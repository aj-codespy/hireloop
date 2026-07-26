import { act, render } from "@testing-library/react";
import Hero from "./page";

describe("Hero component", () => {
  it("renders without crashing", async () => {
    let container: HTMLElement | undefined;
    await act(async () => {
      const result = render(<Hero />);
      container = result.container;
    });
    expect(container).toBeTruthy();
  });
});
