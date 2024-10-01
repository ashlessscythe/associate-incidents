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

interface NewAssociateModalProps {
  onAddAssociate: (name: string) => void;
  hasEditorRole: boolean | false;
}

const NewAssociateModal: React.FC<NewAssociateModalProps> = ({
  onAddAssociate,
  hasEditorRole,
}) => {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onAddAssociate(name);
    setName("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={!hasEditorRole}>
          {hasEditorRole
            ? "Add New Associate"
            : "Add New Associate (requires editor role)"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Associate</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button disabled={!hasEditorRole} type="submit">
              {hasEditorRole
                ? "Add Associate"
                : "Add Associate (Requires Editor Role)"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewAssociateModal;
