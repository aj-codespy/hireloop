import { render, screen } from "@testing-library/react";
import { RoleGate } from "@/components/auth/role-gate";

// Mock useOrgPermissions hook
jest.mock("@/hooks/use-org-permissions", () => ({
  useOrgPermissions: jest.fn(),
}));

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: jest.fn(),
  }),
}));

import { useOrgPermissions } from "@/hooks/use-org-permissions";

describe("RoleGate", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows loading state when permissions are loading", () => {
    (useOrgPermissions as jest.Mock).mockReturnValue({
      role: null,
      loading: true,
    });

    render(
      <RoleGate minRole="admin">
        <div>Protected Content</div>
      </RoleGate>
    );

    expect(screen.getByText("Checking permissions…")).toBeInTheDocument();
  });

  it("renders children when user has required role", () => {
    (useOrgPermissions as jest.Mock).mockReturnValue({
      role: "admin",
      loading: false,
    });

    render(
      <RoleGate minRole="admin">
        <div>Protected Content</div>
      </RoleGate>
    );

    expect(screen.getByText("Protected Content")).toBeInTheDocument();
  });

  it("renders children when user has higher role", () => {
    (useOrgPermissions as jest.Mock).mockReturnValue({
      role: "admin",
      loading: false,
    });

    render(
      <RoleGate minRole="viewer">
        <div>Protected Content</div>
      </RoleGate>
    );

    expect(screen.getByText("Protected Content")).toBeInTheDocument();
  });

  it("returns null when user has insufficient role", () => {
    (useOrgPermissions as jest.Mock).mockReturnValue({
      role: "viewer",
      loading: false,
    });

    const { container } = render(
      <RoleGate minRole="admin">
        <div>Protected Content</div>
      </RoleGate>
    );

    expect(container.firstChild).toBeNull();
  });

  it("returns null when user has no role", () => {
    (useOrgPermissions as jest.Mock).mockReturnValue({
      role: null,
      loading: false,
    });

    const { container } = render(
      <RoleGate minRole="admin">
        <div>Protected Content</div>
      </RoleGate>
    );

    expect(container.firstChild).toBeNull();
  });
});