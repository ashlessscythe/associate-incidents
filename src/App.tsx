import { useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import AttendancePage from "./pages/AttendancePage";
import CAPage from "./pages/CAPage";
import Header from "@/components/Header";
import AssociatesPage from "@/pages/AssociatesPage";
import ReportsPage from "@/pages/ReportsPage";

type PageType = "attendance" | "ca" | "associates" | "reports" | null;

function App() {
  const [currentPage, setCurrentPage] = useState<PageType>(null);

  const handlePageSelect = (page: PageType) => {
    setCurrentPage(page);
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
        <Header currentPage={currentPage} onPageSelect={handlePageSelect} />
        <main className="container mx-auto p-4">
          <Routes>
            <Route
              path="/"
              element={
                <div className="text-center mt-10">
                  <h2 className="text-2xl font-bold mb-4">
                    Welcome to the Employee Management System
                  </h2>
                  <p>
                    Please select a module from the options above to get
                    started.
                  </p>
                </div>
              }
            />
            <Route path="/attendance" element={<AttendancePage />} />
            <Route path="/ca" element={<CAPage />} />
            <Route path="/associates" element={<AssociatesPage />} />
            <Route path="/reports" element={<ReportsPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
