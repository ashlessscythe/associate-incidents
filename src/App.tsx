import React, { useEffect, useState, Suspense } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import { Button } from "./components/ui/button";
import { ThemeProvider, useTheme } from "next-themes";
import AuthModal from "./components/modals/AuthModal";
import Header from "./components/Header";
import CookieConsentFooter from "./components/CookieConsentFooter";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import "./index.css";

// Lazy load page components
const OccurencePage = React.lazy(() => import("./pages/OccurrencePage"));
const CAPage = React.lazy(() => import("./pages/CAPage"));
const AssociatesPage = React.lazy(() => import("./pages/AssociatesPage"));
const ReportsPage = React.lazy(() => import("./pages/ReportsPage"));
const PendingPage = React.lazy(() => import("./pages/PendingPage"));
const AdminPage = React.lazy(() => import("./pages/AdminPage"));
const ResetPassword = React.lazy(() => import("./pages/ResetPassword"));

type PageType = "attendance" | "ca" | "associates" | "reports" | "admin" | null;

const Profile = () => {
  const { user } = useAuth();
  if (user) {
    return (
      <div className="text-foreground">
        <p className="mb-2">Logged in as: {user.email}</p>
        <p>Please select a module from the options above to get started.</p>
      </div>
    );
  } else {
    return (
      <div className="text-foreground w-full max-w-6xl mx-auto px-4">
        <p className="mb-12 text-lg text-center">
          Please log in to access the platform. If you don't have an account,
          you can create one.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mt-8">
          {/* Key Features Card */}
          <div className="bg-card rounded-lg p-6 sm:p-8 shadow-md border border-border">
            <div className="flex items-center mb-4">
              <span className="text-2xl mr-2">✨</span>
              <h3 className="text-xl font-semibold">Key Features</h3>
            </div>
            <ul className="space-y-4">
              <li className="flex items-start">
                <span className="mr-2">📊</span>
                <div>
                  <strong>Occurrence Tracking</strong>
                  <p className="text-sm text-muted-foreground">
                    Efficiently manage and track attendance-related incidents
                    with our comprehensive occurrence system.
                  </p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="mr-2">👥</span>
                <div>
                  <strong>Associate Management</strong>
                  <p className="text-sm text-muted-foreground">
                    Maintain detailed associate records and track their history
                    in a centralized location.
                  </p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="mr-2">📝</span>
                <div>
                  <strong>Corrective Actions</strong>
                  <p className="text-sm text-muted-foreground">
                    Document and monitor corrective actions with structured
                    follow-up processes.
                  </p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="mr-2">📈</span>
                <div>
                  <strong>Advanced Reporting</strong>
                  <p className="text-sm text-muted-foreground">
                    Generate detailed reports and analytics to identify trends
                    and make data-driven decisions.
                  </p>
                </div>
              </li>
            </ul>
          </div>

          {/* Benefits Card */}
          <div className="bg-card rounded-lg p-6 sm:p-8 shadow-md border border-border">
            <div className="flex items-center mb-4">
              <span className="text-2xl mr-2">🎯</span>
              <h3 className="text-xl font-semibold">Benefits</h3>
            </div>
            <ul className="space-y-3">
              <li className="flex items-center">
                <span className="mr-2">⚡</span>
                <span>Streamlined incident management workflow</span>
              </li>
              <li className="flex items-center">
                <span className="mr-2">🔔</span>
                <span>Real-time tracking and notifications</span>
              </li>
              <li className="flex items-center">
                <span className="mr-2">🔒</span>
                <span>Secure and role-based access control</span>
              </li>
              <li className="flex items-center">
                <span className="mr-2">📊</span>
                <span>Customizable reporting options</span>
              </li>
              <li className="flex items-center">
                <span className="mr-2">🎨</span>
                <span>Dark mode and multiple theme options</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  }
};

const ProtectedRoute = ({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles: string[];
}) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="text-foreground">Loading...</div>;
  if (!user) return <Navigate to="/" />;

  if (!user.roles) {
    console.error("User has no roles or roles not found");
    return null;
  }

  const userHasRole = user.roles.some((role: string) =>
    allowedRoles.includes(role)
  );

  if (!userHasRole) {
    if (user.roles.includes("pending")) {
      return <Navigate to="/pending" />;
    } else {
      return (
        <div className="container mx-auto p-8 text-center">
          <div className="bg-yellow-100 dark:bg-yellow-900 border-l-4 border-yellow-500 text-yellow-700 dark:text-yellow-200 p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4">Access Restricted</h2>
            <p className="mb-4">
              You don't have permission to access this page. Your account needs
              the appropriate permissions to view this section.
            </p>
            <p>
              Please contact your administrator to request access or return to
              the home page.
            </p>
            <Button
              onClick={() => (window.location.href = "/")}
              className="mt-6"
              variant="outline"
            >
              Return to Home
            </Button>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="text-foreground">Loading...</div>;
  if (!user) return <Navigate to="/" />;
  if (!user.isAdmin) {
    return (
      <div className="container mx-auto p-8 text-center">
        <div className="bg-red-100 dark:bg-red-900 border-l-4 border-red-500 text-red-700 dark:text-red-200 p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4">Admin Access Required</h2>
          <p className="mb-4">
            You need administrator privileges to access this page.
          </p>
          <Button
            onClick={() => (window.location.href = "/")}
            className="mt-6"
            variant="outline"
          >
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

function AppContent() {
  const [currentPage, setCurrentPage] = useState<PageType>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const { loading, user, logout } = useAuth();
  const { theme } = useTheme();

  useEffect(() => {
    // Apply the theme class to the html element
    const htmlElement = document.documentElement;
    const themeClass =
      theme === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "night"
          : "day"
        : theme || "day"; // Provide a default value if theme is undefined
    htmlElement.classList.remove(
      "day",
      "night",
      "ocean",
      "nature",
      "volcano",
      "cyberpunk",
      "neon"
    );
    htmlElement.classList.add(themeClass);
  }, [theme]);

  const handlePageSelect = (page: PageType) => {
    setCurrentPage(page);
  };

  const handleLogOut = async () => {
    try {
      await logout();
      setCurrentPage(null);
      setIsLoginOpen(false);
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  useEffect(() => {
    if (user) {
      setIsLoginOpen(false);
    }
  }, [user]);

  if (loading) return <div className="text-foreground">Loading...</div>;

  return (
    <Router>
      <div className="flex flex-col h-screen min-h-screen transition-colors duration-300 bg-background text-foreground">
        <Header
          currentPage={currentPage}
          onPageSelect={handlePageSelect}
          user={user}
          onLoginClick={() => setIsLoginOpen(true)}
          onLogOut={handleLogOut}
        />
        <main className="container flex-1 overflow-y-auto p-4">
          <Suspense
            fallback={<div className="text-foreground">Loading...</div>}
          >
            <Routes>
              <Route
                path="/"
                element={
                  <div className="text-center mt-10">
                    <h2 className="text-2xl font-bold mb-4 text-foreground">
                      Welcome to the Incident Tracker
                    </h2>
                    <Profile />
                  </div>
                }
              />
              <Route
                path="/pending"
                element={
                  <ProtectedRoute allowedRoles={["pending"]}>
                    <PendingPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/attendance"
                element={
                  <ProtectedRoute allowedRoles={["att-view", "att-edit"]}>
                    <OccurencePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/ca"
                element={
                  <ProtectedRoute allowedRoles={["ca-view", "ca-edit"]}>
                    <CAPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/associates"
                element={
                  <ProtectedRoute
                    allowedRoles={["user-edit", "ca-edit", "att-edit"]}
                  >
                    <AssociatesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports"
                element={
                  <ProtectedRoute
                    allowedRoles={["report-edit", "ca-edit", "att-edit"]}
                  >
                    <ReportsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/reset-password"
                element={<ResetPassword />}
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </main>
      </div>
      <AuthModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
      <CookieConsentFooter />
    </Router>
  );
}

function App() {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      value={{
        day: "day",
        night: "night",
        ocean: "ocean",
        nature: "nature",
        volcano: "volcano",
        cyberpunk: "cyberpunk",
        neon: "neon",
      }}
    >
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
