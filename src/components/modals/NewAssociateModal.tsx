import React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Department, Location } from "@/lib/api";
import { Designation } from "@/lib/types";
import type { AddAssociateInput } from "@/lib/associateApi";

interface NewAssociateModalProps {
  onAddAssociate: (input: AddAssociateInput) => void | Promise<void>;
  hasEditorRole: boolean | false;
  departments?: Department[];
  locations?: Location[];
}

const NewAssociateModal: React.FC<NewAssociateModalProps> = ({
  onAddAssociate,
  hasEditorRole,
  departments = [],
  locations = [],
}) => {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [departmentId, setDepartmentId] = React.useState<string>("");
  const [locationId, setLocationId] = React.useState<string>("");
  const [designation, setDesignation] = React.useState<string>("NONE");
  const [submitting, setSubmitting] = React.useState(false);

  const resetForm = () => {
    setName("");
    setDepartmentId("");
    setLocationId("");
    setDesignation("NONE");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    try {
      await onAddAssociate({
        name: name.trim(),
        departmentId: departmentId || undefined,
        locationId: locationId || undefined,
        designation: designation || "NONE",
      });
      resetForm();
      setOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button disabled={!hasEditorRole} className="w-full sm:w-auto">
          {hasEditorRole
            ? "Add New Associate"
            : "Add New Associate (requires editor role)"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Add New Associate</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="designation">Designation</Label>
              <Select value={designation} onValueChange={setDesignation}>
                <SelectTrigger id="designation">
                  <SelectValue placeholder="Select designation" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(Designation).map((value) => (
                    <SelectItem key={value} value={value}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="department">Department</Label>
              <Select
                value={departmentId || undefined}
                onValueChange={setDepartmentId}
              >
                <SelectTrigger id="department">
                  <SelectValue placeholder="Optional" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((department) => (
                    <SelectItem key={department.id} value={department.id}>
                      {department.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="location">Location</Label>
              <Select
                value={locationId || undefined}
                onValueChange={setLocationId}
              >
                <SelectTrigger id="location">
                  <SelectValue placeholder="Optional" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button disabled={!hasEditorRole || submitting} type="submit">
              {submitting ? "Adding..." : "Add Associate"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewAssociateModal;
