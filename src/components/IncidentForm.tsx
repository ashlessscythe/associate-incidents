import React, { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { addIncident } from "./lib/api";

interface IncidentType {
  id: string;
  name: string;
  description: string;
}

interface IncidentFormProps {
  incidentTypes: IncidentType[];
  associateId: string | null;
  onAddIncident: (incidentData: {
    typeId: string;
    description: string;
    isVerbal: boolean;
  }) => Promise<void>;
}

const IncidentForm: React.FC<IncidentFormProps> = ({
  incidentTypes,
  associateId,
  onAddIncident,
}) => {
  const [type, setType] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [isVerbal, setIsVerbal] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!associateId) return;

    setIsSubmitting(true);
    try {
      console.log("subbmitting: ", {
        type,
        description,
        isVerbal,
        associateId,
      });
      await onAddIncident({
        typeId: type,
        description,
        isVerbal,
      });

      // Reset form
      setType("");
      setDescription("");
      setIsVerbal(false);
    } catch (e) {
      console.error("Error adding incident:", e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4">
      <h2 className="text-xl font-semibold mb-2">Add Incident</h2>
      <div className="space-y-4">
        <Select onValueChange={setType} value={type}>
          <SelectTrigger>
            <SelectValue placeholder="Select incident type" />
          </SelectTrigger>
          <SelectContent>
            {incidentTypes.map((incidentType) => (
              <SelectItem key={incidentType.id} value={incidentType.id}>
                {incidentType.name} - {incidentType.description}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="text"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={isVerbal}
            onChange={(e) => setIsVerbal(e.target.checked)}
            className="form-checkbox"
          />
          <span>Verbal</span>
        </label>
        <Button
          type="submit"
          disabled={!associateId || !type || !description || isSubmitting}
        >
          {isSubmitting ? "Adding..." : "Add Incident"}
        </Button>
      </div>
    </form>
  );
};

export default IncidentForm;
