import React, { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { getAssociates } from "@/components/lib/api";

interface Associate {
  id: string;
  name: string;
}

interface AssociateListProps {
  onSelectAssociate: (id: string) => void;
}

const AssociateList: React.FC<AssociateListProps> = ({ onSelectAssociate }) => {
  const [associates, setAssociates] = useState<Associate[]>([]);

  useEffect(() => {
    async function fetchAssociates() {
      console.log("from inside fetchAssociates");
      const data = await getAssociates();
      setAssociates(data);
    }
    fetchAssociates();
  }, []);

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
