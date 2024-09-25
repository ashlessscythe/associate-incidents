import React, { useState, useRef, useEffect } from "react";
import { Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Label } from "./ui/label";
import { Input } from "@/components/ui/input";
import { useAssociatesWithDesignation } from "@/hooks/useAssociates";
import { Designation } from "@/hooks/useAssociates";
import { AssociateAndDesignation } from "@/lib/api";

interface AssociateSelectProps {
  selectedAssociateId: string | null;
  onAssociateSelect: (associateId: string | null) => void;
}

const AssociateSelect: React.FC<AssociateSelectProps> = ({
  selectedAssociateId,
  onAssociateSelect,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const { associatesWithDesignation, fetchAssociatesWithDesignation } =
    useAssociatesWithDesignation();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDesignation, setSelectedDesignation] = useState<
    Designation | "ALL"
  >("ALL");
  const [cachedAssociates, setCachedAssociates] = useState<
    AssociateAndDesignation[]
  >([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (cachedAssociates.length === 0 || selectedDesignation !== "ALL") {
        await fetchAssociatesWithDesignation();
        setCachedAssociates(associatesWithDesignation);
      }
    };

    fetchData();
  }, [cachedAssociates, fetchAssociatesWithDesignation, selectedDesignation]);

  useEffect(() => {
    setSearchTerm("");
  }, [selectedDesignation]);

  const filteredAssociates = cachedAssociates.filter(
    (associate) =>
      associate.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (selectedDesignation === "ALL" ||
        associate.designation === selectedDesignation)
  );

  const handleChange = (value: string) => {
    onAssociateSelect(value === "SELECT_ASSOCIATE" ? null : value);
  };

  return (
    <div className="space-y-4 w-full">
      <h2 className="text-xl font-semibold">Select Associate</h2>

      <RadioGroup
        value={selectedDesignation}
        onValueChange={(value) =>
          setSelectedDesignation(value as Designation | "ALL")
        }
        className="flex flex-wrap gap-2 mb-4"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="ALL" id="all" />
          <Label htmlFor="all">All</Label>
        </div>
        {Object.values(Designation).map((designation) => (
          <div key={designation} className="flex items-center space-x-2">
            <RadioGroupItem value={designation} id={designation} />
            <Label htmlFor={designation}>{designation}</Label>
          </div>
        ))}
      </RadioGroup>

      <Select
        onValueChange={handleChange}
        value={selectedAssociateId || "SELECT_ASSOCIATE"}
        open={isOpen}
        onOpenChange={(open) => setIsOpen(open)}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select an associate" />
        </SelectTrigger>
        <SelectContent className="w-full">
          <div className="flex items-center px-3 py-2 sticky top-0 bg-white dark:bg-gray-800 z-10 border-b">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Input
              ref={inputRef}
              placeholder="Search associates..."
              className="h-8 w-full bg-transparent focus:outline-none focus:ring-0 border-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" ||
                  e.key === "ArrowDown" ||
                  e.key === "ArrowUp"
                ) {
                  e.preventDefault();
                }
              }}
              onKeyUp={(e) => e.stopPropagation()}
            />
          </div>
          <div className="max-h-[200px] overflow-y-auto">
            <SelectItem value="SELECT_ASSOCIATE">Select Associate</SelectItem>
            {filteredAssociates.map((associate) => (
              <SelectItem key={associate.id} value={associate.id}>
                {associate.name} - [{associate.designation}]
              </SelectItem>
            ))}
          </div>
        </SelectContent>
      </Select>
    </div>
  );
};

export default AssociateSelect;
