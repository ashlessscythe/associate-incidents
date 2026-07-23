import React, { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "./ui/button";
import { Link, useLocation } from "react-router-dom";
import ThemeSelector from "./ThemeSelector";
import type { User } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface HeaderProps {
  user: User | null;
  onLoginClick: () => void;
  onLogOut: () => Promise<void>;
}

type NavItem = {
  to: string;
  label: string;
  shortLabel?: string;
  isActive: (pathname: string) => boolean;
  visible: (user: User) => boolean;
};

const navItems: NavItem[] = [
  {
    to: "/",
    label: "Home",
    isActive: (pathname) => pathname === "/",
    visible: () => true,
  },
  {
    to: "/attendance",
    label: "Attendance Tracking",
    shortLabel: "Attendance",
    isActive: (pathname) => pathname.startsWith("/attendance"),
    visible: (user) =>
      user.roles?.some((r) => r === "att-view" || r === "att-edit") ?? false,
  },
  {
    to: "/ca",
    label: "Corrective Action",
    shortLabel: "CA",
    isActive: (pathname) => pathname.startsWith("/ca"),
    visible: (user) =>
      user.roles?.some((r) => r === "ca-view" || r === "ca-edit") ?? false,
  },
  {
    to: "/associates",
    label: "Associates",
    isActive: (pathname) => pathname.startsWith("/associates"),
    visible: (user) =>
      user.roles?.some(
        (r) => r === "user-edit" || r === "ca-edit" || r === "att-edit"
      ) ?? false,
  },
  {
    to: "/reports",
    label: "Reports",
    isActive: (pathname) => pathname.startsWith("/reports"),
    visible: (user) =>
      user.roles?.some(
        (r) => r === "report-edit" || r === "ca-edit" || r === "att-edit"
      ) ?? false,
  },
  {
    to: "/admin",
    label: "Admin",
    isActive: (pathname) => pathname.startsWith("/admin"),
    visible: (user) => Boolean(user.isAdmin),
  },
];

const Header: React.FC<HeaderProps> = ({
  user,
  onLoginClick,
  onLogOut,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const showNav = Boolean(user && !user.roles?.includes("pending"));

  const visibleItems = showNav
    ? navItems.filter((item) => item.visible(user!))
    : [];

  const linkClass = (active: boolean) =>
    cn(
      "px-4 py-2 rounded block",
      active
        ? "bg-primary text-primary-foreground"
        : "text-foreground hover:text-primary"
    );

  const NavLinks = ({ compact = false }: { compact?: boolean }) => (
    <>
      {visibleItems.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          className={linkClass(item.isActive(location.pathname))}
          onClick={() => setIsMenuOpen(false)}
        >
          {compact && item.shortLabel ? item.shortLabel : item.label}
        </Link>
      ))}
    </>
  );

  return (
    <header className="sticky top-0 z-40 bg-background text-foreground shadow-md border-b border-border">
      <div className="container mx-auto px-4 py-3 md:py-4">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">
            <Link to="/">Incident Tracker</Link>
          </h1>
          <div className="flex items-center shrink-0">
            <nav className="hidden md:block">
              <ul className="flex space-x-2 lg:space-x-4">
                <NavLinks />
              </ul>
            </nav>
            <ThemeSelector />
            {user ? (
              <Button onClick={onLogOut} variant="outline" className="ml-2 md:ml-4">
                Log out
              </Button>
            ) : (
              <Button onClick={onLoginClick} variant="outline" className="ml-2 md:ml-4">
                Log in
              </Button>
            )}
            {showNav && (
              <Button
                variant="ghost"
                size="icon"
                aria-label={isMenuOpen ? "Close Menu" : "Toggle Menu"}
                aria-expanded={isMenuOpen}
                onClick={() => setIsMenuOpen((open) => !open)}
                className="md:hidden ml-1"
              >
                {isMenuOpen ? (
                  <X className="h-[1.2rem] w-[1.2rem]" />
                ) : (
                  <Menu className="h-[1.2rem] w-[1.2rem]" />
                )}
              </Button>
            )}
          </div>
        </div>
        {isMenuOpen && showNav && (
          <nav className="mt-3 md:hidden" aria-label="Mobile">
            <ul className="flex flex-col space-y-1">
              <NavLinks compact />
            </ul>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
