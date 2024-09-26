import React, { useState } from "react";
import { Moon, Sun, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

type PageType = "attendance" | "ca" | "associates" | "reports" | null;

interface HeaderProps {
  currentPage: PageType;
  onPageSelect: (page: PageType) => void;
  user: any;
  onLoginClick: () => void;
  onLogOut: () => Promise<void>;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

const Header: React.FC<HeaderProps> = ({
  currentPage,
  onPageSelect,
  user,
  onLoginClick,
  onLogOut,
  isDarkMode,
  onToggleDarkMode,
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
    <header className="bg-white dark:bg-gray-800 shadow-md z-10">
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
              onClick={onToggleDarkMode}
              className="ml-4 mr-4"
            >
              {isDarkMode ? (
                <Sun className="h-[1.2rem] w-[1.2rem]" />
              ) : (
                <Moon className="h-[1.2rem] w-[1.2rem]" />
              )}
            </Button>
            {user ? (
              <Button onClick={onLogOut} variant="outline">
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
