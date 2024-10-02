import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { getLocations, getDepartments, Location, Department } from "@/lib/api";

interface ExportCADetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (location: string, department: string) => void;
  initialLocation?: string;
  initialDepartment?: string;
}

const ExportCADetailsModal: React.FC<ExportCADetailsModalProps> = ({
  isOpen,
  onClose,
  onExport,
  initialLocation,
  initialDepartment,
}) => {
  const [location, setLocation] = useState("");
  const [department, setDepartment] = useState("");
  const [locations, setLocations] = useState<Location[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  useEffect(() => {
    const fetchLocationsAndDepartments = async () => {
      try {
        const [locationsData, departmentsData] = await Promise.all([
          getLocations(),
          getDepartments(),
        ]);
        setLocations(locationsData);
        setDepartments(departmentsData);
      } catch (error) {
        console.error("Error fetching locations and departments:", error);
      }
    };

    fetchLocationsAndDepartments();
  }, []);

  useEffect(() => {
    setLocation(initialLocation || "");
    setDepartment(initialDepartment || "");
  }, [initialLocation, initialDepartment]);

  const handleExport = () => {
    onExport(location, department);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Details</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {!initialLocation && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="location" className="text-right">
                Location
              </Label>
              <Select value={location} onValueChange={setLocation}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.name}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {!initialDepartment && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="department" className="text-right">
                Department
              </Label>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.name}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleExport}
            disabled={
              (!initialLocation && !location) ||
              (!initialDepartment && !department)
            }
          >
            Export
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExportCADetailsModal;
