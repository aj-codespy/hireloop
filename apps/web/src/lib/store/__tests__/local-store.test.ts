import { persistLocalState, loadLocalState } from "@/lib/store/local-store";
import { seedState } from "@/lib/store/seed";

describe("persistLocalState — guarded writes (H5)", () => {
  const originalSetItem = Storage.prototype.setItem;

  afterEach(() => {
    Storage.prototype.setItem = originalSetItem;
    jest.restoreAllMocks();
  });

  it("does not throw when localStorage.setItem fails (quota/private mode)", () => {
    Storage.prototype.setItem = jest.fn(() => {
      throw new DOMException("QuotaExceededError", "QuotaExceededError");
    });

    expect(() => persistLocalState(seedState())).not.toThrow();
  });

  it("does not throw when setItem rejects with a generic error", () => {
    Storage.prototype.setItem = jest.fn(() => {
      throw new Error("SecurityError: access denied");
    });

    expect(() => persistLocalState(seedState())).not.toThrow();
  });

  it("still writes through when storage works normally", () => {
    const setItem = jest.fn();
    Storage.prototype.setItem = setItem;

    const state = seedState();
    persistLocalState(state);

    expect(setItem).toHaveBeenCalledWith("hireloop-app-state", JSON.stringify(state));
  });

  it("loadLocalState falls back to seed when getItem throws", () => {
    Storage.prototype.getItem = jest.fn(() => {
      throw new DOMException("SecurityError", "SecurityError");
    }) as unknown as typeof Storage.prototype.getItem;

    expect(() => loadLocalState()).not.toThrow();
    expect(loadLocalState()).toEqual(seedState());
  });
});
