import { render, screen } from "@testing-library/react";
import { WelcomeTour } from "@/components/onboarding/WelcomeTour";

describe("WelcomeTour", () => {
  it("renders the tour welcome screen", () => {
    render(<WelcomeTour />);
    expect(screen.getByText(/create your first job posting/i)).toBeTruthy();
  });
});
