import React, { useState, useRef, useEffect } from "react";
import { Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface Associate {
  id: string;
  name: string;
}

interface AssociateSelectProps {
  associates: Associate[];
  selectedAssociateId: string | null;
  onAssociateSelect: (associateId: string | null) => void;
}

const AssociateSelect: React.FC<AssociateSelectProps> = ({
  associates,
  selectedAssociateId,
  onAssociateSelect,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredAssociates = associates.filter((associate) =>
    associate.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleChange = (value: string) => {
    onAssociateSelect(value === "SELECT_ASSOCIATE" ? null : value);
  };

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  return (
    <div className="space-y-2 mb-4">
      <h2 className="text-xl font-semibold mb-2">Select Associate</h2>
      <Select
        onValueChange={handleChange}
        value={selectedAssociateId || "SELECT_ASSOCIATE"}
        onOpenChange={(open) => setIsOpen(open)}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select an associate" />
        </SelectTrigger>
        <SelectContent>
          <div className="flex items-center px-3 py-2 sticky top-0 bg-white dark:bg-gray-800 z-10 border-b">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Input
              ref={inputRef}
              placeholder="Search associates..."
              className="h-8 w-full bg-transparent focus:outline-none focus:ring-0 border-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
            />
          </div>
          <div className="max-h-[200px] overflow-y-auto">
            <SelectItem value="SELECT_ASSOCIATE">Select Associate</SelectItem>
            {filteredAssociates.map((associate) => (
              <SelectItem key={associate.id} value={associate.id}>
                {associate.name}
              </SelectItem>
            ))}
          </div>
        </SelectContent>
      </Select>
    </div>
  );
};

export default AssociateSelect;
