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
import Login from '@/components/Login';
import { setAuthToken } from "@/components/lib/api";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [associates, setAssociates] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [incidentTypes, setIncidentTypes] = useState([]);
  const [selectedAssociateId, setSelectedAssociateId] = useState<string | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // auth
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setAuthToken(token);
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const handleLogin = (token: string) => {
    localStorage.setItem("token", token);
    setAuthToken(token);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setAuthToken(null);
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

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
      setIncidents([]); // clear inc if no associate is selected
    }
  };

  const handleAssociateSelect = (associateId: string | null) => {
    setSelectedAssociateId(associateId);
    if (!associateId) {
      setIncidents([]); // clear inc if "Select Associate" is selected
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
        // fetch inc after adding
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
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
      <Header onLogout={handleLogout} />
      <main className="container mx-auto p-4">
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
      </main>
    </div>
  );
}

export default App;
