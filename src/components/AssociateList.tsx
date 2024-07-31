import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AssociateListProps {
  associates: Associate[];
  selectedAssociateId: string | null;
  onSelectAssociate: (associateId: string | null) => void;
}

interface Associate {
  id: string;
  name: string;
}

const AssociateList: React.FC<AssociateListProps> = ({
  associates,
  selectedAssociateId,
  onSelectAssociate,
}) => {
  return (
    <div className="mb-4">
      <h2 className="text-xl font-semibold mb-2">Select Associate</h2>
      <Select
        onValueChange={onSelectAssociate}
        value={selectedAssociateId === null ? undefined : selectedAssociateId}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select an associate" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={null}>Select Associate</SelectItem>
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
