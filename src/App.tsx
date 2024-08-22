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
import LoginModal from "@/components/LoginModal";
import AttendancePage from "./pages/AttendancePage";
import CAPage from "./pages/CAPage";
import Header from "@/components/Header";
import AssociatesPage from "@/pages/AssociatesPage";
import ReportsPage from "@/pages/ReportsPage";
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

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuthorizer();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/" />;
  return <>{children}</>;
};

function AppContent() {
  const [currentPage, setCurrentPage] = useState<PageType>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const { loading, user, logout } = useAuthorizer();

  const handlePageSelect = (page: PageType) => {
    setCurrentPage(page);
  };

  const handleLogOut = async () => {
    try {
      await logout();
      setCurrentPage(null);
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  useEffect(() => {
    if (user) {
      setIsLoginOpen(false);
    }
  }, [user]);

  if (loading) return <div>Loading...</div>;

  return (
    <Router>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
        <Header
          currentPage={currentPage}
          onPageSelect={handlePageSelect}
          user={user}
          onLoginClick={() => setIsLoginOpen(true)}
          onLogOut={() => handleLogOut()}
        />
        <main className="container mx-auto p-4">
          <Routes>
            <Route
              path="/"
              element={
                <div className="text-center mt-10">
                  <h2 className="text-2xl font-bold mb-4">
                    Welcome to the Incident Tracker
                  </h2>
                  <Profile />
                </div>
              }
            />
            <Route
              path="/attendance"
              element={
                <ProtectedRoute>
                  <AttendancePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ca"
              element={
                <ProtectedRoute>
                  <CAPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/associates"
              element={
                <ProtectedRoute>
                  <AssociatesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <ReportsPage />
                </ProtectedRoute>
              }
            />
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
