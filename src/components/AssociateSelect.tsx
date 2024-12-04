import React, { useState, useEffect } from "react";
import { Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useAssociatesWithDesignation } from "@/hooks/useAssociates";
import { AssociateAndDesignation, Designation } from "@/lib/types";

interface AssociateSelectProps {
  selectedAssociateId: string | null;
  onAssociateSelect: (associateId: string | null) => void;
}

const AssociateSelect: React.FC<AssociateSelectProps> = ({
  selectedAssociateId,
  onAssociateSelect,
}) => {
  const { associatesWithDesignation, loading, fetchAssociatesWithDesignation } =
    useAssociatesWithDesignation();
  const [selectedDesignation, setSelectedDesignation] = useState<
    Designation | "ALL"
  >("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchAssociatesWithDesignation();
  }, [fetchAssociatesWithDesignation]);

  // Sort function for consistent alphabetical ordering
  const sortAlphabetically = (
    a: AssociateAndDesignation,
    b: AssociateAndDesignation
  ) => {
    return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
  };

  const filteredAssociates = associatesWithDesignation
    .filter((associate) => {
      const matchesSearch = associate.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesDesignation =
        selectedDesignation === "ALL" ||
        associate.designation === selectedDesignation;
      return matchesSearch && matchesDesignation;
    })
    .sort(sortAlphabetically);

  const handleChange = (value: string) => {
    onAssociateSelect(value === "SELECT_ASSOCIATE" ? null : value);
    setSearchTerm(""); // Reset search when selection is made
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Prevent the select component from handling keyboard events
    e.stopPropagation();
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
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Search or select an associate" />
        </SelectTrigger>
        <SelectContent className="w-full">
          <div className="sticky top-0 p-2 bg-background border-b">
            <div className="flex items-center px-3 py-2 border rounded-md">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <input
                placeholder="Search associates..."
                className="w-full bg-transparent focus:outline-none"
                value={searchTerm}
                onChange={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSearchTerm(e.target.value);
                }}
                onKeyDown={handleKeyDown}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              />
            </div>
          </div>
          <div className="max-h-[200px] overflow-y-auto">
            <SelectItem value="SELECT_ASSOCIATE">Select Associate</SelectItem>
            {loading ? (
              <SelectItem value="loading" disabled>
                Loading...
              </SelectItem>
            ) : filteredAssociates.length === 0 ? (
              <SelectItem value="no-results" disabled>
                No matches found
              </SelectItem>
            ) : (
              filteredAssociates.map((associate) => (
                <SelectItem key={associate.id} value={associate.id}>
                  {associate.name} {associate.designation}
                </SelectItem>
              ))
            )}
          </div>
        </SelectContent>
      </Select>
    </div>
  );
};

export default AssociateSelect;
