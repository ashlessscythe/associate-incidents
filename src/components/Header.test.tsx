// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Header from "./Header";
import { renderWithRouter } from "@/test/react";
import { buildUser } from "@/test/fixtures";

describe("Header", () => {
  const onLoginClick = vi.fn();
  const onLogOut = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("highlights the active route from the URL", async () => {
    renderWithRouter(
      <Header
        user={buildUser({
          roles: ["att-view", "ca-view", "user-edit", "report-edit"],
        })}
        onLoginClick={onLoginClick}
        onLogOut={onLogOut}
      />,
      { route: "/attendance" }
    );

    const attendanceLinks = screen.getAllByRole("link", {
      name: /Attendance/,
    });
    expect(attendanceLinks[0]).toHaveClass("bg-primary");
    expect(screen.getByRole("link", { name: "Home" })).not.toHaveClass(
      "bg-primary"
    );
  });

  it("only shows nav links the user is allowed to access", () => {
    renderWithRouter(
      <Header
        user={buildUser({ roles: ["att-view"], isAdmin: false })}
        onLoginClick={onLoginClick}
        onLogOut={onLogOut}
      />,
      { route: "/" }
    );

    expect(
      screen.getByRole("link", { name: /Attendance Tracking/ })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /Corrective Action/ })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Associates" })
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Reports" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Admin" })).not.toBeInTheDocument();
  });

  it("closes the mobile menu after navigating", async () => {
    const user = userEvent.setup();

    renderWithRouter(
      <Header
        user={buildUser({
          roles: ["att-view", "ca-view", "user-edit", "report-edit"],
        })}
        onLoginClick={onLoginClick}
        onLogOut={onLogOut}
      />,
      { route: "/" }
    );

    await user.click(screen.getByRole("button", { name: "Toggle Menu" }));
    expect(screen.getByRole("navigation", { name: "Mobile" })).toBeInTheDocument();

    await user.click(
      screen.getByRole("link", { name: "Attendance" })
    );

    await waitFor(() => {
      expect(
        screen.queryByRole("navigation", { name: "Mobile" })
      ).not.toBeInTheDocument();
    });
  });
});
