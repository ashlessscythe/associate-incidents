import React, { useState, useRef } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";

interface OccurrenceType {
  id: string;
  code: string;
  description: string;
  points: number;
}

interface OccurrenceFormProps {
  occurrenceTypes: OccurrenceType[];
  associateId: string | null;
  onAddOccurrence: (occurrenceData: {
    typeId: string;
    date: Date;
    notes: string;
  }) => Promise<void>;
}

const OccurrenceForm: React.FC<OccurrenceFormProps> = ({
  occurrenceTypes,
  associateId,
  onAddOccurrence,
}) => {
  const [typeId, setTypeId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const dateInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!associateId || !dateInputRef.current) return;

    const date = dateInputRef.current.value;
    if (!date) {
      setError("Please select a date");
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddOccurrence({
        typeId,
        date: new Date(date),
        notes,
      });

      // Reset form
      setTypeId("");
      if (dateInputRef.current) {
        dateInputRef.current.value = "";
      }
      setNotes("");
    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(e.message);
      } else if (typeof e === "string") {
        setError(e);
      } else {
        setError("An unknown error occurred");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // set max date today plus 5 days
  const maxDate = () => {
    let d = new Date();
    d.setDate(d.getDate() + 5);
    return d.toISOString().split("T")[0];
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4">
      <h2 className="text-xl font-semibold mb-2">Add Occurrence</h2>
      <div className="space-y-4">
        <Select onValueChange={setTypeId} value={typeId}>
          <SelectTrigger>
            <SelectValue placeholder="Select occurrence type" />
          </SelectTrigger>
          <SelectContent>
            {occurrenceTypes.map((occurrenceType) => (
              <SelectItem key={occurrenceType.id} value={occurrenceType.id}>
                {occurrenceType.code} - {occurrenceType.description} (
                {occurrenceType.points} points)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="date"
          ref={dateInputRef}
          defaultValue={new Date().toISOString().split("T")[0]}
          max={maxDate()} // Prevents future dates
        />
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Enter notes (optional)"
        />
        <Button
          type="submit"
          disabled={!associateId || !typeId || isSubmitting}
        >
          {isSubmitting ? "Adding..." : "Add Occurrence"}
        </Button>
        {error && <div className="text-red-500">{error}</div>}
      </div>
    </form>
  );
};

export default OccurrenceForm;
