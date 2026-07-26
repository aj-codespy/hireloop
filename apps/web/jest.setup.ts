import "@testing-library/jest-dom";

// Polyfill window.matchMedia for GSAP ScrollTrigger in jsdom
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock GSAP ScrollTrigger for jsdom (no scroll container)
jest.mock("gsap/ScrollTrigger", () => ({
  ScrollTrigger: {
    create: jest.fn(() => ({ kill: jest.fn() })),
    refresh: jest.fn(),
    getAll: jest.fn(() => []),
  },
  default: {},
}));

// Mock @gsap/react for jsdom
jest.mock("@gsap/react", () => ({
  useGSAP: jest.fn((cb) => {
    // Call the cleanup function if returned
    const cleanup = cb();
    if (cleanup && typeof cleanup === "function") cleanup();
  }),
}));

// Mock gsap core
jest.mock("gsap", () => ({
  default: {
    to: jest.fn(() => ({ kill: jest.fn() })),
    from: jest.fn(() => ({ kill: jest.fn() })),
    fromTo: jest.fn(() => ({ kill: jest.fn() })),
    set: jest.fn(),
    context: jest.fn((cb) => {
      const mockSelf = { set: jest.fn(), add: jest.fn() };
      cb(mockSelf);
      return { revert: jest.fn() };
    }),
    matchMedia: jest.fn(() => ({
      add: jest.fn((query, cb) => cb()),
    })),
    registerPlugin: jest.fn(),
    utils: {
      toArray: jest.fn((arr) => arr),
    },
  },
  to: jest.fn(() => ({ kill: jest.fn() })),
  from: jest.fn(() => ({ kill: jest.fn() })),
  fromTo: jest.fn(() => ({ kill: jest.fn() })),
  set: jest.fn(),
  context: jest.fn((cb) => {
    const mockSelf = { set: jest.fn(), add: jest.fn() };
    cb(mockSelf);
    return { revert: jest.fn() };
  }),
  matchMedia: jest.fn(() => ({
    add: jest.fn((query, cb) => cb()),
  })),
  registerPlugin: jest.fn(),
  utils: {
    toArray: jest.fn((arr) => arr),
  },
}));

jest.mock("server-only", () => ({}));

// Mock Next.js server modules
jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));
jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

// Mock server actions
jest.mock("@/app/actions/hireloop", () => ({
  renderQuestionAudioAction: jest.fn().mockResolvedValue({ success: true }),
}));
jest.mock("@/app/actions/auth", () => ({
  getAdminOrgIdAction: jest.fn().mockResolvedValue("test-org"),
  getCurrentProfileAction: jest.fn().mockResolvedValue({ id: "user-1", accountType: "org_admin", email: "test@test.com", fullName: "Test User" }),
}));