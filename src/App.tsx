import { useEffect, useState } from "react";
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
import LoginModal from "@/components/modals/LoginModal";
import OccurencePage from "./pages/OccurrencePage";
import CAPage from "./pages/CAPage";
import Header from "@/components/Header";
import AssociatesPage from "@/pages/AssociatesPage";
import ReportsPage from "@/pages/ReportsPage";
import PendingPage from "@/pages/PendingPage";
import "@/components/authorizer-custom.css";

type PageType = "attendance" | "ca" | "associates" | "reports" | null;

const Profile = () => {
  const { user } = useAuthorizer();
  if (user) {
    return (
      <div>
        <p className="mb-2">Logged in as: {user.email}</p>
        <p>Please select a module from the options above to get started.</p>
      </div>
    );
  } else {
    return (
      <div>
        <p>
          Please log in to access the platform. If you don't have an account,
          you can create one.
        </p>
      </div>
    );
  }
  return null;
};

const ProtectedRoute = ({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles: string[];
}) => {
  const { user, loading } = useAuthorizer();

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/" />;

  if (!user.roles) {
    console.error("User has no roles or roles not found");
    return;
  }

  // Check if the user has at least one of the allowed roles
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
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedMode = localStorage.getItem("darkMode");
    return savedMode ? JSON.parse(savedMode) : false;
  });
  const { loading, user, logout } = useAuthorizer();

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

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem("darkMode", JSON.stringify(newMode));
  };

  useEffect(() => {
    if (user) {
      setIsLoginOpen(false);
    }
  }, [user]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  if (loading) return <div>Loading...</div>;

  return (
    <Router>
      <div
        className={`flex flex-col h-screen min-h-screen transition-colors duration-300 ${
          isDarkMode
            ? "dark bg-dark-mode-gradient backdrop-blur-md"
            : "bg-gray-100"
        }`}
      >
        <Header
          currentPage={currentPage}
          onPageSelect={handlePageSelect}
          user={user}
          onLoginClick={() => setIsLoginOpen(true)}
          onLogOut={() => handleLogOut()}
          isDarkMode={isDarkMode}
          onToggleDarkMode={toggleDarkMode}
        />
        <main className="container flex-1 overflow-y-auto p-4">
          <Routes>
            <Route
              path="/"
              element={
                <div className="text-center mt-10">
                  <h2 className="text-2xl font-bold mb-4 dark:text-white">
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
        </main>
      </div>
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </Router>
  );
}

function App() {
  return (
    <AuthorizerProvider
      config={{
        authorizerURL: import.meta.env.VITE_AUTHORIZER_URL,
        redirectURL: window.location.origin,
        clientID: import.meta.env.VITE_AUTHORIZER_CLIENT_ID,
      }}
    >
      <AppContent />
    </AuthorizerProvider>
  );
}

export default App;
