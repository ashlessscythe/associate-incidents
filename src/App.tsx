import React, { useEffect, useState } from "react";
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

function App() {
  const [associates, setAssociates] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [incidentTypes, setIncidentTypes] = useState([]);
  const [selectedAssociateId, setSelectedAssociateId] = useState<string | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [associatesData, typesData] = await Promise.all([
          getAssociates(),
          getIncidentTypes(),
        ]);
        setAssociates(associatesData);
        setIncidentTypes(typesData);
      } catch (err) {
        setError(err.message);
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
      } catch (err) {
        setError(err.message);
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
      } catch (e) {
        setError(e.message);
        console.error("Error adding incident:", e.message);
      }
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
      <Header />
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
