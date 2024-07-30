import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface AssociateListProps {
  associates: Associate[];
  selectedAssociateId: string | null;
  onSelectAssociate: (id: string) => void;
}

interface Associate {
  id: string;
  name: string;
}

const AssociateList: React.FC<AssociateListProps> = ({
  associates,
  onSelectAssociate,
}) => {
  return (
    <div className="mb-4">
      <h2 className="text-xl font-semibold mb-2">Select an Associate</h2>
      <Select onValueChange={onSelectAssociate}>
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
    </div>
  );
};

export default AssociateList;
