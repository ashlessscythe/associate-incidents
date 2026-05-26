// @vitest-environment jsdom

import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "./App.tsx";
import { buildUser } from "@/test/fixtures";

const authMock = vi.hoisted(() => ({
  state: {
    user: null as unknown,
    loading: false,
    logout: vi.fn(),
  },
}));

vi.mock("./contexts/AuthContext", () => ({
  AuthProvider: ({ children }: { children: ReactNode }) => children,
  useAuth: () => ({
    user: authMock.state.user,
    loading: authMock.state.loading,
    logout: authMock.state.logout,
    login: vi.fn(),
    register: vi.fn(),
    refreshUser: vi.fn(),
  }),
}));

vi.mock("next-themes", () => ({
  ThemeProvider: ({ children }: { children: ReactNode }) => children,
  useTheme: () => ({ theme: "day" }),
}));

vi.mock("./components/Header", () => ({
  default: () => <header>Incident Tracker Header</header>,
}));

vi.mock("./components/modals/AuthModal", () => ({
  default: () => null,
}));

vi.mock("./components/CookieConsentFooter", () => ({
  default: () => null,
}));

vi.mock("./pages/OccurrencePage", () => ({
  default: () => <div>Attendance Screen</div>,
}));

vi.mock("./pages/CAPage", () => ({
  default: () => <div>Corrective Action Screen</div>,
}));

vi.mock("./pages/AssociatesPage", () => ({
  default: () => <div>Associates Screen</div>,
}));

vi.mock("./pages/ReportsPage", () => ({
  default: () => <div>Reports Screen</div>,
}));

vi.mock("./pages/PendingPage", () => ({
  default: () => <div>Pending Approval Screen</div>,
}));

vi.mock("./pages/AdminPage", () => ({
  default: () => <div>Admin Screen</div>,
}));

vi.mock("./pages/ResetPassword", () => ({
  default: () => <div>Reset Password Screen</div>,
}));

function renderAppAt(path: string) {
  window.history.pushState({}, "", path);
  return render(<App />);
}

describe("App smoke routing", () => {
  beforeEach(() => {
    authMock.state.user = null;
    authMock.state.loading = false;
    authMock.state.logout.mockReset();
    document.documentElement.className = "";
    window.history.pushState({}, "", "/");
  });

  it("shows the anonymous landing screen", () => {
    renderAppAt("/");

    expect(
      screen.getByRole("heading", { name: "Welcome to the Incident Tracker" })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Please log in to access the platform/i)
    ).toBeInTheDocument();
  });

  it("allows an attendance viewer onto the attendance screen", async () => {
    authMock.state.user = buildUser({ roles: ["att-view"] });

    renderAppAt("/attendance");

    expect(await screen.findByText("Attendance Screen")).toBeInTheDocument();
  });

  it("redirects pending users to the pending screen when they lack page access", async () => {
    authMock.state.user = buildUser({ roles: ["pending"] });

    renderAppAt("/attendance");

    expect(
      await screen.findByText("Pending Approval Screen")
    ).toBeInTheDocument();
  });

  it("blocks non-admin users from the admin screen", () => {
    authMock.state.user = buildUser({ roles: ["att-view"], isAdmin: false });

    renderAppAt("/admin");

    expect(screen.getByText("Admin Access Required")).toBeInTheDocument();
    expect(screen.queryByText("Admin Screen")).not.toBeInTheDocument();
  });
});
