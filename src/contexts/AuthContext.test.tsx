// @vitest-environment jsdom

import { useState } from "react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AuthProvider, useAuth } from "./AuthContext";
import { buildUser } from "@/test/fixtures";

const mockApi = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
}));

vi.mock("../lib/apiConfig", () => ({
  default: mockApi,
}));

function AuthProbe() {
  const auth = useAuth();
  const [result, setResult] = useState("");

  return (
    <div>
      <p>{auth.loading ? "loading" : "ready"}</p>
      <p>{auth.user?.email ?? "no-user"}</p>
      <p>{result}</p>
      <button
        type="button"
        onClick={async () => {
          const loginResult = await auth.login(
            "manager@example.com",
            "Password1!"
          );
          setResult(loginResult.success ? "login-ok" : loginResult.error ?? "");
        }}
      >
        Login
      </button>
      <button
        type="button"
        onClick={async () => {
          await auth.logout();
          setResult("logout-ok");
        }}
      >
        Logout
      </button>
      <button
        type="button"
        onClick={async () => {
          const registerResult = await auth.register(
            "new@example.com",
            "Password1!",
            "New User"
          );
          setResult(
            registerResult.success
              ? registerResult.message ?? "registered"
              : registerResult.error ?? ""
          );
        }}
      >
        Register
      </button>
    </div>
  );
}

function renderAuthProbe() {
  return render(
    <AuthProvider>
      <AuthProbe />
    </AuthProvider>
  );
}

describe("AuthProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("logs in by storing the token and current user", async () => {
    const user = buildUser();
    mockApi.post.mockResolvedValue({
      data: {
        token: "jwt-token",
        user,
      },
    });

    renderAuthProbe();
    await screen.findByText("ready");

    await userEvent.click(screen.getByRole("button", { name: "Login" }));

    expect(await screen.findByText("login-ok")).toBeInTheDocument();
    expect(screen.getByText(user.email)).toBeInTheDocument();
    expect(localStorage.getItem("authToken")).toBe("jwt-token");
    expect(mockApi.post).toHaveBeenCalledWith("/auth/login", {
      email: "manager@example.com",
      password: "Password1!",
    });
  });

  it("clears a stale token when the auth check fails", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    localStorage.setItem("authToken", "expired-token");
    mockApi.get.mockRejectedValue(new Error("expired"));

    renderAuthProbe();

    await screen.findByText("ready");
    expect(screen.getByText("no-user")).toBeInTheDocument();
    expect(localStorage.getItem("authToken")).toBeNull();
    expect(mockApi.get).toHaveBeenCalledWith("/auth/me");

    consoleErrorSpy.mockRestore();
  });

  it("logs out by clearing local auth state even when the request succeeds", async () => {
    const user = buildUser();
    localStorage.setItem("authToken", "jwt-token");
    mockApi.get.mockResolvedValue({ data: { user } });
    mockApi.post.mockResolvedValue({ data: { message: "Logged out" } });

    renderAuthProbe();
    expect(await screen.findByText(user.email)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Logout" }));

    expect(await screen.findByText("logout-ok")).toBeInTheDocument();
    expect(screen.getByText("no-user")).toBeInTheDocument();
    expect(localStorage.getItem("authToken")).toBeNull();
    expect(mockApi.post).toHaveBeenCalledWith("/auth/logout");
  });

  it("keeps new registrations logged out while approval is pending", async () => {
    mockApi.post.mockResolvedValue({
      data: {
        message: "Registration successful. Your account is pending approval.",
      },
    });

    renderAuthProbe();
    await screen.findByText("ready");

    await userEvent.click(screen.getByRole("button", { name: "Register" }));

    expect(
      await screen.findByText(
        "Registration successful. Your account is pending approval."
      )
    ).toBeInTheDocument();
    expect(screen.getByText("no-user")).toBeInTheDocument();
    expect(localStorage.getItem("authToken")).toBeNull();
    expect(mockApi.post).toHaveBeenCalledWith("/auth/register", {
      email: "new@example.com",
      password: "Password1!",
      name: "New User",
    });
  });

  it("surfaces login failures without changing auth state", async () => {
    mockApi.post.mockRejectedValue({
      response: { data: { message: "Invalid credentials" } },
    });

    renderAuthProbe();
    await screen.findByText("ready");

    await userEvent.click(screen.getByRole("button", { name: "Login" }));

    expect(await screen.findByText("Invalid credentials")).toBeInTheDocument();
    expect(screen.getByText("no-user")).toBeInTheDocument();
    expect(localStorage.getItem("authToken")).toBeNull();
  });
});
