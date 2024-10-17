import React, { useEffect, useState, Suspense } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import {
  AuthorizerProvider,
  useAuthorizer,
} from "@authorizerdev/authorizer-react";
import { ThemeProvider, useTheme } from "next-themes";
import LoginModal from "./components/modals/LoginModal";
import Header from "./components/Header";
import "./components/authorizer-custom.css";
import "./index.css";

// Lazy load page components
const OccurencePage = React.lazy(() => import("./pages/OccurrencePage"));
const CAPage = React.lazy(() => import("./pages/CAPage"));
const AssociatesPage = React.lazy(() => import("./pages/AssociatesPage"));
const ReportsPage = React.lazy(() => import("./pages/ReportsPage"));
const PendingPage = React.lazy(() => import("./pages/PendingPage"));

type PageType = "attendance" | "ca" | "associates" | "reports" | null;

const Profile = () => {
  const { user } = useAuthorizer();
  if (user) {
    return (
      <div className="text-foreground">
        <p className="mb-2">Logged in as: {user.email}</p>
        <p>Please select a module from the options above to get started.</p>
      </div>
    );
  } else {
    return (
      <div className="text-foreground">
        <p>
          Please log in to access the platform. If you don't have an account,
          you can create one.
        </p>
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
  const { user, loading } = useAuthorizer();

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
    return user.roles.includes("pending") ? (
      <Navigate to="/pending" />
    ) : (
      <Navigate to="/" />
    );
  }

  return <>{children}</>;
};

function AppContent() {
  const [currentPage, setCurrentPage] = useState<PageType>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const { loading, user, logout } = useAuthorizer();
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
      "corporate",
      "ocean",
      "nature",
      "volcano",
      "sky"
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
                  <ProtectedRoute allowedRoles={["viewer", "att-edit"]}>
                    <OccurencePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/ca"
                element={
                  <ProtectedRoute allowedRoles={["viewer", "ca-edit"]}>
                    <CAPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/associates"
                element={
                  <ProtectedRoute allowedRoles={["viewer", "user-edit"]}>
                    <AssociatesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports"
                element={
                  <ProtectedRoute allowedRoles={["viewer", "report-edit"]}>
                    <ReportsPage />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </main>
      </div>
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
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
        corporate: "corporate",
        ocean: "ocean",
        nature: "nature",
        volcano: "volcano",
        sky: "sky",
      }}
    >
      <AuthorizerProvider
        config={{
          authorizerURL: import.meta.env.VITE_AUTHORIZER_URL,
          redirectURL: window.location.origin,
          clientID: import.meta.env.VITE_AUTHORIZER_CLIENT_ID,
        }}
      >
        <AppContent />
      </AuthorizerProvider>
    </ThemeProvider>
  );
}

export default App;
