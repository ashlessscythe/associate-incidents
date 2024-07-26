import React from "react";
import AssociateList from "@/components/AssociateList";
import IncidentForm from "@/components/IncidentForm";
import IncidentList from "@/components/IncidentList";

function App() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Discipline Tracker</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AssociateList />
        <div>
          <IncidentForm />
          <IncidentList />
        </div>
      </div>
    </div>
  );
}

export default App;
