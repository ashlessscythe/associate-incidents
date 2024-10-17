import React, { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "./ui/button";
import { Link } from "react-router-dom";
import ThemeSelector from "./ThemeSelector";

type PageType = "attendance" | "ca" | "associates" | "reports" | null;

interface HeaderProps {
  currentPage: PageType;
  onPageSelect: (page: PageType) => void;
  user: any;
  onLoginClick: () => void;
  onLogOut: () => Promise<void>;
}

const Header: React.FC<HeaderProps> = ({
  currentPage,
  onPageSelect,
  user,
  onLoginClick,
  onLogOut,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const NavLinks = () => (
    <>
      <Link
        to="/"
        className={`px-4 py-2 rounded ${
          currentPage === null
            ? "bg-primary text-primary-foreground"
            : "text-foreground hover:text-primary"
        }`}
        onClick={() => onPageSelect(null)}
      >
        Home
      </Link>
      <Link
        to="/attendance"
        className={`px-4 py-2 rounded ${
          currentPage === "attendance"
            ? "bg-primary text-primary-foreground"
            : "text-foreground hover:text-primary"
        }`}
        onClick={() => onPageSelect("attendance")}
      >
        Attendance Tracking
      </Link>
      <Link
        to="/ca"
        className={`px-4 py-2 rounded ${
          currentPage === "ca"
            ? "bg-primary text-primary-foreground"
            : "text-foreground hover:text-primary"
        }`}
        onClick={() => onPageSelect("ca")}
      >
        Corrective Action
      </Link>
      <Link
        to="/associates"
        className={`px-4 py-2 rounded ${
          currentPage === "associates"
            ? "bg-primary text-primary-foreground"
            : "text-foreground hover:text-primary"
        }`}
        onClick={() => onPageSelect("associates")}
      >
        Associates
      </Link>
      <Link
        to="/reports"
        className={`px-4 py-2 rounded ${
          currentPage === "reports"
            ? "bg-primary text-primary-foreground"
            : "text-foreground hover:text-primary"
        }`}
        onClick={() => onPageSelect("reports")}
      >
        Reports
      </Link>
    </>
  );

  return (
    <header className="bg-background text-foreground shadow-md z-10">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">
            Incident Tracker
          </h1>
          <div className="flex items-center">
            <nav className="hidden md:block">
              <ul className="flex space-x-4">
                {user && user.role !== "pending" && <NavLinks />}
              </ul>
            </nav>
            <ThemeSelector />
            {user ? (
              <Button onClick={onLogOut} variant="outline" className="ml-4">
                Log out
              </Button>
            ) : (
              <Button onClick={onLoginClick} variant="outline" className="ml-4">
                Log in
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              aria-label="Toggle Menu"
              onClick={toggleMenu}
              className="md:hidden ml-2"
            >
              {isMenuOpen ? (
                <X className="h-[1.2rem] w-[1.2rem]" />
              ) : (
                <Menu className="h-[1.2rem] w-[1.2rem]" />
              )}
            </Button>
          </div>
        </div>
        {isMenuOpen && (
          <nav className="mt-4 md:hidden">
            <ul className="flex flex-col space-y-2">
              <NavLinks />
            </ul>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
