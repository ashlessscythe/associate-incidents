import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Associate {
  id: string;
  name: string;
}

interface AssociateListProps {
  associates: Associate[];
  selectedAssociateId: string | null;
  onSelectAssociate: (associateId: string | null) => void;
}

const AssociateList: React.FC<AssociateListProps> = ({
  associates,
  selectedAssociateId,
  onSelectAssociate,
}) => {
  const handleChange = (value: string) => {
    onSelectAssociate(value === "SELECT_ASSOCIATE" ? null : value);
  };

  return (
    <div className="mb-4">
      <h2 className="text-xl font-semibold mb-2">Select Associate</h2>
      <Select
        onValueChange={handleChange}
        value={selectedAssociateId || "SELECT_ASSOCIATE"}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select an associate" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="SELECT_ASSOCIATE">Select Associate</SelectItem>
          {associates.map((associate) => (
            <SelectItem key={associate.id} value={associate.id}>
              {associate.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default AssociateList;
