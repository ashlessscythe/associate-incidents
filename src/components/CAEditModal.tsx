import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CorrectiveAction, Rule } from "@/components/lib/api";
import GroupedRuleSelect from "@/components/GroupedRuleSelect";

interface CAEditModalProps {
  ca: CorrectiveAction;
  rules: Rule[];
  onUpdate: (updatedCA: CorrectiveAction) => Promise<void>;
  onClose: () => void;
}

const CAEditModal: React.FC<CAEditModalProps> = ({
  ca,
  rules,
  onUpdate,
  onClose,
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return new Date().toISOString().split("T")[0];
    }
    return date.toISOString().split("T")[0];
  };

  const [ruleId, setRuleId] = useState(ca.ruleId);
  const [description, setDescription] = useState(ca.description);
  const [level, setLevel] = useState(ca.level.toString());
  const [date, setDate] = useState<string>(formatDate(ca.date.toString()));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  console.log("ca.date is: ", ca.date);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onUpdate({
        ...ca,
        ruleId,
        description,
        level: Number(level),
        date: new Date(date),
      });
      onClose();
    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("An unknown error occurred");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Corrective Action</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <GroupedRuleSelect
            rules={rules}
            ruleId={ruleId}
            setRuleId={setRuleId}
          />
          <Input
            type="date"
            value={date}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setDate(e.target.value)
            }
            max={new Date().toISOString().split("T")[0]}
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
              <SelectItem value="0">0 - Coaching Conversation</SelectItem>
              <SelectItem value="1">1 - Documented Verbal Warning</SelectItem>
              <SelectItem value="2">2 - Written Warning</SelectItem>
              <SelectItem value="3">3 - Final Written Warning</SelectItem>
              <SelectItem value="4">4 - Termination</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update"}
            </Button>
          </div>
          {error && <div className="text-red-500">{error}</div>}
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CAEditModal;
