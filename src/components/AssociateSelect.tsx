import React, { useState, useEffect } from "react";
import { Search, Users } from "lucide-react";
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
import { getDesignations } from "@/lib/associateApi";
import { AssociateAndDesignation } from "@/lib/types";

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
    string | "ALL"
  >("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [designations, setDesignations] = useState<string[]>([]);
  const [loadingDesignations, setLoadingDesignations] = useState(true);

  useEffect(() => {
    fetchAssociatesWithDesignation();
  }, [fetchAssociatesWithDesignation]);

  useEffect(() => {
    const fetchDesignations = async () => {
      try {
        setLoadingDesignations(true);
        const data = await getDesignations();
        setDesignations(data);
      } catch (error) {
        console.error("Error fetching designations:", error);
      } finally {
        setLoadingDesignations(false);
      }
    };

    fetchDesignations();
  }, []);

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
    <div className="space-y-4 w-full max-h-full overflow-hidden flex flex-col">
      <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2 flex-shrink-0">
        <Users className="h-5 w-5" />
        Select Associate
      </h2>

      <div className="flex-shrink-0">
        <RadioGroup
          value={selectedDesignation}
          onValueChange={(value) => setSelectedDesignation(value)}
          className="flex flex-wrap gap-2 mb-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="ALL" id="all" />
            <Label htmlFor="all" className="text-sm">All</Label>
          </div>
          {loadingDesignations ? (
            <div className="text-sm text-muted-foreground">Loading designations...</div>
          ) : (
            designations.map((designation) => (
              <div key={designation} className="flex items-center space-x-2">
                <RadioGroupItem value={designation} id={designation} />
                <Label htmlFor={designation} className="text-sm">{designation}</Label>
              </div>
            ))
          )}
        </RadioGroup>
      </div>

      <div className="flex-shrink-0">
        <Select
          onValueChange={handleChange}
          value={selectedAssociateId || "SELECT_ASSOCIATE"}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Search or select an associate" />
          </SelectTrigger>
          <SelectContent 
            className="w-full max-w-[var(--radix-select-trigger-width)]"
            position="popper"
            side="bottom"
            align="start"
            sideOffset={4}
          >
            <div className="sticky top-0 p-2 bg-background border-b z-10">
              <div className="flex items-center px-3 py-2 border rounded-md">
                <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                <input
                  placeholder="Search associates..."
                  className="w-full bg-transparent focus:outline-none text-sm"
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
            <div className="max-h-[300px] overflow-y-auto overscroll-contain">
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
                    <div className="flex flex-col">
                      <span className="font-medium">{associate.name}</span>
                      <span className="text-xs text-muted-foreground">{associate.designation}</span>
                    </div>
                  </SelectItem>
                ))
              )}
            </div>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default AssociateSelect;
