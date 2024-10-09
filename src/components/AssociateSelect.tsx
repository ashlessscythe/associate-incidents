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
import { useAssociatesWithDesignation } from "@/hooks/useAssociates";
import { AssociateAndDesignation, Designation } from "@/lib/api";

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

      <div className="relative">
        <div className="flex items-center px-3 py-2 border rounded-md mb-2">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <input
            ref={inputRef}
            placeholder="Search associates..."
            className="w-full bg-transparent focus:outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Select
          onValueChange={handleChange}
          value={selectedAssociateId || "SELECT_ASSOCIATE"}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select an associate" />
          </SelectTrigger>
          <SelectContent className="w-full">
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
    </div>
  );
};

export default AssociateSelect;
