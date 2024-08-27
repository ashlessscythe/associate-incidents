import React, { useEffect, useState, useRef } from "react";
import { Button } from "../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Rule } from "@/lib/api";

interface CAFormProps {
  rules: Rule[];
  associateId: string | null;
  onAddCorrectiveAction: (data: {
    ruleId: string;
    description: string;
    level: number;
    date: Date;
  }) => Promise<void>;
}

const CAForm: React.FC<CAFormProps> = ({
  rules,
  associateId,
  onAddCorrectiveAction,
}) => {
  const [ruleType, setRuleType] = useState<"SAFETY" | "WORK" | null>(null);
  const [ruleId, setRuleId] = useState("");
  const [description, setDescription] = useState("");
  const [level, setLevel] = useState("1");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  const [ruleTypes, setRuleTypes] = useState<("SAFETY" | "WORK")[]>([]);
  const [filteredRules, setFilteredRules] = useState<Rule[]>([]);

  useEffect(() => {
    // Extract unique rule types from the rules
    const types = Array.from(new Set(rules.map((rule) => rule.type)));
    setRuleTypes(types as ("SAFETY" | "WORK")[]);
  }, [rules]);

  useEffect(() => {
    if (ruleType) {
      setFilteredRules(rules.filter((rule) => rule.type === ruleType));
    } else {
      setFilteredRules([]);
    }
    setRuleId(""); // Reset rule selection when type changes
  }, [ruleType, rules]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!associateId || !ruleId || !dateInputRef.current) return;

    const date = dateInputRef.current.value;
    if (!date) {
      setError("Please select a date");
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddCorrectiveAction({
        ruleId,
        description: description || "No description",
        level: Number(level),
        date: new Date(date),
      });
      // Reset form
      setRuleId("");
      setDescription("");
      setLevel("1");
      if (dateInputRef.current) {
        dateInputRef.current.value = "";
      }
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

  if (!associateId) {
    return <p>Please select an associate to add a corrective action.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-semibold mb-2">Add Corrective Action</h2>
      <div className="space-y-4">
        <RadioGroup
          onValueChange={(value: string) =>
            setRuleType(value as "SAFETY" | "WORK")
          }
          value={ruleType || undefined}
        >
          <div className="flex space-x-2">
            {ruleTypes.map((type) => (
              <div key={type} className="flex items-center space-x-2">
                <RadioGroupItem value={type} id={type} />
                <Label htmlFor={type}>{type}</Label>
              </div>
            ))}
          </div>
        </RadioGroup>

        <Select onValueChange={setRuleId} value={ruleId} disabled={!ruleType}>
          <SelectTrigger>
            <SelectValue placeholder="Select a rule" />
          </SelectTrigger>
          <SelectContent
            className="max-w-full left-0 right-0"
            style={{ maxWidth: "100vw", overflow: "auto" }}
          >
            {filteredRules.map((rule) => (
              <SelectItem
                className="whitespace-normal break-words"
                key={rule.id}
                value={rule.id}
              >
                {rule.code} - {rule.description}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="date"
          ref={dateInputRef}
          defaultValue={new Date().toISOString().split("T")[0]}
          max={new Date().toISOString().split("T")[0]} // prevent future dates
        />
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter description"
        />
        <Select onValueChange={setLevel} value={level}>
          <SelectTrigger>
            <SelectValue placeholder="Select notification level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1 - Coaching Conversation</SelectItem>
            <SelectItem value="2">2 - Documented Verbal Warning</SelectItem>
            <SelectItem value="3">3 - Written Warning</SelectItem>
            <SelectItem value="4">4 - Final Written Warning</SelectItem>
            <SelectItem value="5">5 - Termination</SelectItem>
          </SelectContent>
        </Select>
        <Button type="submit" disabled={!ruleId || isSubmitting}>
          {isSubmitting ? "Adding..." : "Add Corrective Action"}
        </Button>
        {error && <div className="text-red-500">{error}</div>}
      </div>
    </form>
  );
};

export default CAForm;
