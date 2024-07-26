import { React, useState } from "react";
import Header from "@/components/Header";
import AssociateList from "@/components/AssociateList";
import IncidentForm from "@/components/IncidentForm";
import IncidentList from "@/components/IncidentList";

function App() {
  const [incidents, setIncidents] = useState([]);

  // logic

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
      <Header />
      <main className="container mx-auto p-4">
        <AssociateList />
        <IncidentForm />
        <IncidentList incidents={[]} />
      </main>
    </div>
  );
}

export default App;
