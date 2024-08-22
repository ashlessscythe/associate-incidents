import React, { useState, useEffect } from "react";
import { Moon, Sun, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuthorizer } from "@authorizerdev/authorizer-react";

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
}) => {
  const { logout } = useAuthorizer();
  const [darkMode, setDarkMode] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const isDarkMode =
      localStorage.getItem("darkMode") === "true" ||
      (!("darkMode" in localStorage) &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    setDarkMode(isDarkMode);
    document.documentElement.classList.toggle("dark", isDarkMode);
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle("dark");
    localStorage.setItem("darkMode", (!darkMode).toString());
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const NavLinks = () => (
    <>
      <Link
        to="/"
        className={`px-4 py-2 rounded ${
          currentPage === null
            ? "bg-blue-500 text-white"
            : "text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
        }`}
        onClick={() => onPageSelect(null)}
      >
        Home
      </Link>
      <Link
        to="/attendance"
        className={`px-4 py-2 rounded ${
          currentPage === "attendance"
            ? "bg-blue-500 text-white"
            : "text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
        }`}
        onClick={() => onPageSelect("attendance")}
      >
        Attendance Tracking
      </Link>
      <Link
        to="/ca"
        className={`px-4 py-2 rounded ${
          currentPage === "ca"
            ? "bg-blue-500 text-white"
            : "text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
        }`}
        onClick={() => onPageSelect("ca")}
      >
        Corrective Action
      </Link>
      <Link
        to="/associates"
        className={`px-4 py-2 rounded ${
          currentPage === "associates"
            ? "bg-blue-500 text-white"
            : "text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
        }`}
        onClick={() => onPageSelect("associates")}
      >
        Associates
      </Link>
      <Link
        to="/reports"
        className={`px-4 py-2 rounded ${
          currentPage === "reports"
            ? "bg-blue-500 text-white"
            : "text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
        }`}
        onClick={() => onPageSelect("reports")}
      >
        Reports
      </Link>
    </>
  );

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Incident Tracker
          </h1>
          <div className="flex items-center">
            <nav className="hidden md:block">
              <ul className="flex space-x-4">
                {user && user.role !== "pending" && <NavLinks />}
              </ul>
            </nav>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Toggle Dark Mode"
              onClick={toggleDarkMode}
              className="ml-4 mr-2"
            >
              {darkMode ? (
                <Sun className="h-[1.2rem] w-[1.2rem]" />
              ) : (
                <Moon className="h-[1.2rem] w-[1.2rem]" />
              )}
            </Button>
            {user ? (
              <Button onClick={handleLogout} variant="outline">
                Log out
              </Button>
            ) : (
              <Button onClick={onLoginClick} variant="outline">
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
