import { render, screen, fireEvent } from "@testing-library/react";
import WelcomeTour from "@/components/onboarding/WelcomeTour";

describe('WelcomeTour', () => {
  it('renders complete tour', () => {
    render(<WelcomeTour />);
    expect(screen.getByText(/Create your first job posting/)).toBeInTheDocument();
    expect(screen.getByText(/Setup interview questions/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Start tour/i })).toBeInTheDocument();
  });

  it('navigates through steps', () => {
    render(<WelcomeTour />);
    const nextButton = screen.getByRole('button', { name: /Next/i });
    const prevButton = screen.getByRole('button', { name: /Previous/i });
    
    expect(nextButton).toBeInTheDocument();
    expect(prevButton).toBeInTheDocument();
    
    fireEvent.click(nextButton);
    expect(screen.getByText(/Step 2/)).toBeInTheDocument();
  });

  it('tracks progress', () => {
    render(<WelcomeTour />);
    const progressBars = screen.getAllByRole('progressbar');
    expect(progressBars).toHaveLength(3);
    expect(progressBars[0]).toHaveAttribute('aria-valuenow', '33');
  });

  it('is mobile responsive', () => {
    render(<WelcomeTour />);
    const tourContainer = screen.getByTestId('welcome-tour-container');
    expect(tourContainer).toHaveClass('mobile-responsive');
  });

  it('uses design system classes', () => {
    render(<WelcomeTour />);
    const tourContainer = screen.getByTestId('welcome-tour-container');
    expect(tourContainer).toHaveClass('gradient', 'elev-3', 'reveal');
  });

  it('closes on complete', () => {
    render(<WelcomeTour />);
    const completeButton = screen.getByRole('button', { name: /Complete tour/i });
    fireEvent.click(completeButton);
    expect(screen.queryByText(/Create your first job posting/)).not.toBeInTheDocument();
  });

  it('skips on skip', () => {
    render(<WelcomeTour />);
    const skipButton = screen.getByRole('button', { name: /Skip tour/i });
    fireEvent.click(skipButton);
    expect(screen.queryByText(/Create your first job posting/)).not.toBeInTheDocument();
  });

  it('passes org context', () => {
    render(<WelcomeTour orgId="test-org-123" />);
    expect(screen.getByText(/Organization: test-org-123/)).toBeInTheDocument();
  });
});