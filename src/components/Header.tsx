import React, { useState, useEffect } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

type PageType = "attendance" | "ca" | "associates" | "reports" | null;

interface HeaderProps {
  currentPage: PageType;
  onPageSelect: (page: PageType) => void;
}

const Header: React.FC<HeaderProps> = ({ currentPage, onPageSelect }) => {
  const [darkMode, setDarkMode] = useState(false);

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

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mr-4">
            Employee Management System
          </h1>
          <nav>
            <ul className="flex space-x-4">
              <li>
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
              </li>
              <li>
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
              </li>
              <li>
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
              </li>
              <li>
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
              </li>
              <li>
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
              </li>
            </ul>
          </nav>
        </div>
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle Dark Mode"
            onClick={toggleDarkMode}
          >
            {darkMode ? (
              <Sun className="h-[1.2rem] w-[1.2rem]" />
            ) : (
              <Moon className="h-[1.2rem] w-[1.2rem]" />
            )}
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
