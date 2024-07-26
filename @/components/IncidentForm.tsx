import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface IncidentFormProps {
  associateId: string | null;
}

const IncidentForm: React.FC<IncidentFormProps> = ({ associateId }) => {
  const [type, setType] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [isVerbal, setIsVerbal] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!associateId) {
      alert("Please select an associate first");
      return;
    }
    // TODO: Submit incident to API
    console.log({ associateId, type, description, isVerbal, date: new Date() });
    // Reset form
    setType("");
    setDescription("");
    setIsVerbal(false);
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
            <SelectItem value="D1">D1</SelectItem>
            <SelectItem value="D2">D2</SelectItem>
            <SelectItem value="D3">D3</SelectItem>
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
        <Button type="submit" disabled={!associateId}>
          Add Incident
        </Button>
      </div>
    </form>
  );
};

export default IncidentForm;
