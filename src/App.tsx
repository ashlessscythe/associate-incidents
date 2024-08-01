import { useEffect, useState } from "react";
import {
  getAssociates,
  getIncidents,
  getIncidentTypes,
  addIncident,
} from "@/components/lib/api";
import Header from "@/components/Header";
import AssociateList from "@/components/AssociateList";
import IncidentForm from "@/components/IncidentForm";
import IncidentList from "@/components/IncidentList";
import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { setAuthToken } from '@/components/lib/api';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute'; // Adjust the import path as needed

function AuthWrapper({ children }) {
  const { getToken } = useAuth();
  
  useEffect(() => {
    const updateToken = async () => {
      const token = await getToken();
      setAuthToken(token);
    };
    updateToken();
  }, [getToken]);

  return <>{children}</>
}

function App() {
  const [associates, setAssociates] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [incidentTypes, setIncidentTypes] = useState([]);
  const [selectedAssociateId, setSelectedAssociateId] = useState<string | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [associatesData, typesData] = await Promise.all([
          getAssociates(),
          getIncidentTypes(),
        ]);
        setAssociates(associatesData);
        setIncidentTypes(typesData);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else if (typeof err === "string") {
          setError(err);
        } else {
          setError("An unknown error occurred");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    fetchIncidents();
  }, [selectedAssociateId]);

  const fetchIncidents = async () => {
    if (selectedAssociateId) {
      try {
        const incidentsData = await getIncidents(selectedAssociateId);
        setIncidents(incidentsData);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else if (typeof err === "string") {
          setError(err);
        } else {
          setError("An unknown error occurred");
        }
      }
    } else {
      setIncidents([]); // clear incidents if no associate is selected
    }
  };

  const handleAssociateSelect = (associateId: string | null) => {
    setSelectedAssociateId(associateId);
    if (!associateId) {
      setIncidents([]); // clear incidents if "Select Associate" is selected
    }
  };

  const handleAddIncident = async (incidentData: {
    typeId: string;
    description: string;
    isVerbal: boolean;
  }) => {
    if (selectedAssociateId) {
      try {
        await addIncident({
          ...incidentData,
          associateId: selectedAssociateId,
        });
        // fetch incidents after adding
        await fetchIncidents();
      } catch (e: unknown) {
        if (e instanceof Error) {
          setError(e.message);
        } else if (typeof e === "string") {
          setError(e);
        } else {
          setError("An unknown error occurred");
        }
      }
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>
      <Router>
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
          <Header />
          <main className="container mx-auto p-4">
            <Routes>
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <>
                      <AssociateList
                        associates={associates}
                        selectedAssociateId={selectedAssociateId}
                        onSelectAssociate={handleAssociateSelect}
                      />
                      <IncidentForm
                        incidentTypes={incidentTypes}
                        associateId={selectedAssociateId}
                        onAddIncident={handleAddIncident}
                      />
                      <IncidentList incidents={incidents} incidentTypes={incidentTypes} />
                    </>
                  </ProtectedRoute>
                }
              />
              {/* Add other routes here */}
            </Routes>
          </main>
        </div>
      </Router>
    </ClerkProvider>
  );
}

export default App;
