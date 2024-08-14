import { useState } from "react";
import AttendancePage from "./pages/AttendancePage";
import CAPage from "./pages/CAPage";
import Header from "@/components/Header";

type PageType = "attendance" | "ca" | null;

function MainApp() {
  const [currentPage, setCurrentPage] = useState<PageType>(null);

  const handlePageSelect = (page: PageType) => {
    setCurrentPage(page);
  };

  const renderContent = () => {
    switch (currentPage) {
      case "attendance":
        return <AttendancePage />;
      case "ca":
        return <CAPage />;
      default:
        return (
          <div className="text-center mt-10">
            <h2 className="text-2xl font-bold mb-4">
              Welcome to the Employee Management System
            </h2>
            <p>Please select a module from the options above to get started.</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
      <Header />
      <main className="container mx-auto p-4">
        <div className="flex justify-center space-x-4 mb-4">
          <button
            className={`px-4 py-2 rounded ${
              currentPage === "attendance"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-800"
            }`}
            onClick={() => handlePageSelect("attendance")}
          >
            Attendance Tracking
          </button>
          <button
            className={`px-4 py-2 rounded ${
              currentPage === "ca"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-800"
            }`}
            onClick={() => handlePageSelect("ca")}
          >
            Corrective Action
          </button>
        </div>
        {renderContent()}
      </main>
    </div>
  );
}

export default MainApp;
