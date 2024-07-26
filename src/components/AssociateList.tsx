import React, { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface Associate {
  id: string;
  name: string;
}

const AssociateList: React.FC = () => {
  const [associates, setAssociates] = useState<Associate[]>([]);
  const [selectedAssociate, setSelectedAssociate] = useState<string | null>(
    null
  );

  useEffect(() => {
    // TODO: Fetch associates from the API
    // For now, we'll use dummy data
    setAssociates([
      { id: "1", name: "John Doe" },
      { id: "2", name: "Jane Smith" },
      { id: "3", name: "Bob Johnson" },
    ]);
  }, []);

  const handleAssociateSelect = (value: string) => {
    setSelectedAssociate(value);
    // TODO: Fetch incidents for the selected associate
  };

  return (
    <div className="mb-4">
      <h2 className="text-xl font-semibold mb-2">Select an Associate</h2>
      <Select onValueChange={handleAssociateSelect}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select an associate" />
        </SelectTrigger>
        <SelectContent>
          {associates.map((associate) => (
            <SelectItem key={associate.id} value={associate.id}>
              {associate.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selectedAssociate && (
        <p className="mt-2">Selected Associate ID: {selectedAssociate}</p>
      )}
    </div>
  );
};

export default AssociateList;
