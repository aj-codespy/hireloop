#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import assert from "node:assert/strict";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const hireloopTsPath = path.resolve(__dirname, "../apps/web/src/app/actions/hireloop.ts");

console.log("--------------------------------------------------");
console.log("Verifying Environment Configuration and Error Handling");
console.log("Target Action: setJobQuestionsAction");
console.log(`Source File: ${hireloopTsPath}`);
console.log("--------------------------------------------------");

// 1. Read and extract the function text
if (!fs.existsSync(hireloopTsPath)) {
  console.error(`Error: Source file does not exist at ${hireloopTsPath}`);
  process.exit(1);
}

const content = fs.readFileSync(hireloopTsPath, "utf8");

// Transpile the source before extracting the function. The previous hand-rolled
// parser treated object types in a return annotation as function-body braces,
// producing an invalid, truncated JavaScript function as soon as the signature
// became more expressive.
const requireWeb = createRequire(path.resolve(__dirname, "../apps/web/package.json"));
const ts = requireWeb("typescript");
const transpiled = ts.transpileModule(content, {
  compilerOptions: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
  },
}).outputText;

const startIdx = transpiled.indexOf("export async function setJobQuestionsAction");
if (startIdx === -1) {
  console.error("Error: Could not find transpiled setJobQuestionsAction in hireloop.ts");
  process.exit(1);
}

let braceCount = 0;
let endIdx = -1;
let started = false;
for (let i = startIdx; i < transpiled.length; i++) {
  if (transpiled[i] === "{") {
    braceCount++;
    started = true;
  } else if (transpiled[i] === "}") {
    braceCount--;
    if (started && braceCount === 0) {
      endIdx = i + 1;
      break;
    }
  }
}

if (endIdx === -1) {
  console.error("Error: Could not find matching braces for setJobQuestionsAction");
  process.exit(1);
}

const jsFuncText = transpiled.substring(startIdx, endIdx).replace("export async function", "async function");

// Compile function via factory
const ORG_MANAGER_ROLES = ["org_admin", "org_manager"];
const factoryBody = `
  ${jsFuncText}
  return setJobQuestionsAction;
`;

function createMockedAction({ requireOrgRole, setJobQuestionsInDb, fetch, processMock }) {
  const factory = new Function(
    "requireOrgRole",
    "setJobQuestionsInDb",
    "ORG_MANAGER_ROLES",
    "fetch",
    "process",
    "logger",
    "isRedirectError",
    "isNotFoundError",
    factoryBody
  );
  // Suppress expected logs during tests.
  const silentLogger = { info: () => {}, warn: () => {}, error: () => {} };
  return factory(
    requireOrgRole,
    setJobQuestionsInDb,
    ORG_MANAGER_ROLES,
    fetch,
    processMock,
    silentLogger,
    () => false,
    () => false
  );
}

// Global test variables
const defaultRequireOrgRole = async () => ({ orgId: "org-123" });
const defaultSetJobQuestionsInDb = async () => {};

let testCount = 0;
let passedCount = 0;

async function runTest(name, fn) {
  testCount++;
  console.log(`Test ${testCount}: ${name}`);
  try {
    await fn();
    console.log("  => PASSED ✅");
    passedCount++;
  } catch (err) {
    console.error("  => FAILED ❌");
    console.error(err);
  }
}

async function main() {
  // Test 1: Returns early if no question IDs
  await runTest("Returns early if no question IDs are passed", async () => {
    let fetchCalled = false;
    const action = createMockedAction({
      requireOrgRole: defaultRequireOrgRole,
      setJobQuestionsInDb: defaultSetJobQuestionsInDb,
      fetch: async () => {
        fetchCalled = true;
        return { ok: true };
      },
      processMock: { env: {} }
    });

    await action("job-1", []);
    assert.equal(fetchCalled, false, "fetch should not have been called when questions array is empty");

    await action("job-1", [{ id: "" }, { id: null }]);
    assert.equal(fetchCalled, false, "fetch should not have been called when no question has a valid ID");
  });

  // Test 2: Throws error if INTERVIEW_INTERNAL_SECRET is missing
  await runTest("Throws error if INTERVIEW_INTERNAL_SECRET environment variable is missing", async () => {
    const action = createMockedAction({
      requireOrgRole: defaultRequireOrgRole,
      setJobQuestionsInDb: defaultSetJobQuestionsInDb,
      fetch: async () => ({ ok: true }),
      processMock: {
        env: {
          NEXT_PUBLIC_API_URL: "http://localhost:8000",
          INTERVIEW_INTERNAL_SECRET: "" // Missing
        }
      }
    });

    const result = await action("job-1", [{ id: "q-1" }]);
    assert.deepEqual(result, {
      ok: false,
      error: "Audio generation failed: Missing INTERVIEW_INTERNAL_SECRET environment variable.",
    });
  });

  // Test 3: Handles simulated fetch network error
  await runTest("Handles simulated fetch network error correctly", async () => {
    const action = createMockedAction({
      requireOrgRole: defaultRequireOrgRole,
      setJobQuestionsInDb: defaultSetJobQuestionsInDb,
      fetch: async () => {
        throw new Error("DNS lookup failed");
      },
      processMock: {
        env: {
          NEXT_PUBLIC_API_URL: "http://localhost:8000",
          INTERVIEW_INTERNAL_SECRET: "my-secret-key"
        }
      }
    });

    const result = await action("job-1", [{ id: "q-1" }]);
    assert.deepEqual(result, {
      ok: false,
      error: "Audio generation failed: Network error - DNS lookup failed",
    });
  });

  // Test 4: Handles simulated fetch status code error (ok: false, status 500)
  await runTest("Handles simulated fetch status code 500 error correctly", async () => {
    const action = createMockedAction({
      requireOrgRole: defaultRequireOrgRole,
      setJobQuestionsInDb: defaultSetJobQuestionsInDb,
      fetch: async () => ({
        ok: false,
        status: 500,
        text: async () => "Internal Server Error"
      }),
      processMock: {
        env: {
          NEXT_PUBLIC_API_URL: "http://localhost:8000",
          INTERVIEW_INTERNAL_SECRET: "my-secret-key"
        }
      }
    });

    const result = await action("job-1", [{ id: "q-1" }]);
    assert.deepEqual(result, {
      ok: false,
      error: "Audio generation failed: API returned status 500 - Internal Server Error",
    });
  });

  // Test 5: Handles non-parsable body on fetch status code error
  await runTest("Handles non-parsable response body correctly on API error", async () => {
    const action = createMockedAction({
      requireOrgRole: defaultRequireOrgRole,
      setJobQuestionsInDb: defaultSetJobQuestionsInDb,
      fetch: async () => ({
        ok: false,
        status: 400,
        text: async () => {
          throw new Error("Read stream failed");
        }
      }),
      processMock: {
        env: {
          NEXT_PUBLIC_API_URL: "http://localhost:8000",
          INTERVIEW_INTERNAL_SECRET: "my-secret-key"
        }
      }
    });

    const result = await action("job-1", [{ id: "q-1" }]);
    assert.deepEqual(result, {
      ok: false,
      error: "Audio generation failed: API returned status 400 - Could not parse response body",
    });
  });

  // Test 6: Runs successfully and passes parameters correctly under normal conditions
  await runTest("Successfully executes fetch and passes correct arguments under normal conditions", async () => {
    let fetchArgs = null;
    const action = createMockedAction({
      requireOrgRole: defaultRequireOrgRole,
      setJobQuestionsInDb: defaultSetJobQuestionsInDb,
      fetch: async (url, options) => {
        fetchArgs = { url, options };
        return { ok: true, status: 200 };
      },
      processMock: {
        env: {
          NEXT_PUBLIC_API_URL: "http://localhost:9000",
          INTERVIEW_INTERNAL_SECRET: "super-secret"
        }
      }
    });

    await action("job-1", [{ id: "q-1" }, { id: "q-2" }], 5);

    assert.ok(fetchArgs, "fetch should have been called");
    assert.equal(fetchArgs.url, "http://localhost:9000/admin/questions/render-audio");
    assert.equal(fetchArgs.options.method, "POST");
    assert.equal(fetchArgs.options.headers["Content-Type"], "application/json");
    assert.equal(fetchArgs.options.headers["X-Internal-Secret"], "super-secret");
    
    const body = JSON.parse(fetchArgs.options.body);
    assert.deepEqual(body, {
      question_ids: ["q-1", "q-2"],
      langs: ["en", "hi"]
    });
  });

  console.log("--------------------------------------------------");
  console.log(`Summary: Passed ${passedCount}/${testCount} tests.`);
  console.log("--------------------------------------------------");

  if (passedCount !== testCount) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error("Test runner execution crashed:", err);
  process.exit(1);
});
