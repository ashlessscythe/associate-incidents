import React, { useEffect, useState } from "react";
import {
  getAssociates,
  getIncidents,
  getIncidentTypes,
} from "@/components/lib/api";
import Header from "@/components/Header";
import AssociateList from "@/components/AssociateList";
import IncidentForm from "@/components/IncidentForm";
import IncidentList from "@/components/IncidentList";

function App() {
  const [associates, setAssociates] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [incidentTypes, setIncidentTypes] = useState([]);
  const [selectedAssociateId, setSelectedAssociateId] = useState(null);
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
        if (associatesData.length > 0) {
          setSelectedAssociateId(associatesData[0].id);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchIncidents = async () => {
      if (selectedAssociateId) {
        try {
          const incidentsData = await getIncidents(selectedAssociateId);
          setIncidents(incidentsData);
        } catch (err) {
          setError(err.message);
        }
      }
    };

    fetchIncidents();
  }, [selectedAssociateId]);

  const handleAssociateSelect = (associateId: React.SetStateAction<null>) => {
    setSelectedAssociateId(associateId);
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
        />
        <IncidentList incidents={incidents} incidentTypes={incidentTypes} />
      </main>
    </div>
  );
}

export default App;
