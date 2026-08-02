import { render, screen, fireEvent } from "@testing-library/react";
import RootError from "@/app/error";

describe("RootError boundary (L5)", () => {
  it("renders a fallback instead of a white screen", () => {
    render(<RootError error={new Error("boom")} reset={jest.fn()} />);

    expect(screen.getByRole("heading", { name: /something went wrong/i })).toBeInTheDocument();
    expect(screen.getByText("Try Again")).toBeInTheDocument();
    expect(screen.getByText("Reload Page")).toBeInTheDocument();
  });

  it("calls reset when Try Again is clicked", () => {
    const reset = jest.fn();
    render(<RootError error={new Error("boom")} reset={reset} />);

    fireEvent.click(screen.getByText("Try Again"));
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("hides internal error details when there is no message", () => {
    render(<RootError error={new Error()} reset={jest.fn()} />);

    expect(screen.queryByText(/Error Details/i)).not.toBeInTheDocument();
  });
});
