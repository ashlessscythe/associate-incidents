import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getAssociatePointsAndNotification,
  setAssociatePointsAdjustment,
} from "@/lib/api";
import type { AssociateAndDesignation } from "@/lib/types";
import { cn } from "@/lib/utils";
import { toast } from "react-hot-toast";

interface AssociatePointsAdjustmentModalProps {
  associate: AssociateAndDesignation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

const AssociatePointsAdjustmentModal: React.FC<
  AssociatePointsAdjustmentModalProps
> = ({ associate, open, onOpenChange, onSaved }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [occurrencePoints, setOccurrencePoints] = useState(0);
  const [adjustmentInput, setAdjustmentInput] = useState("0");

  useEffect(() => {
    if (!open || !associate) return;

    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await getAssociatePointsAndNotification(associate.id);
        if (cancelled) return;
        setOccurrencePoints(data.occurrencePoints ?? 0);
        setAdjustmentInput(String(data.pointsAdjustment ?? 0));
      } catch (e) {
        console.error(e);
        toast.error("Could not load point details");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, associate?.id]);

  const adjustment = parseFloat(adjustmentInput);
  const adjustmentValid = !Number.isNaN(adjustment);
  const totalPreview = occurrencePoints + (adjustmentValid ? adjustment : 0);

  const handleSave = async () => {
    if (!associate || !adjustmentValid) {
      toast.error("Enter a valid number for the adjustment");
      return;
    }
    setSaving(true);
    try {
      await setAssociatePointsAdjustment(associate.id, adjustment);
      toast.success("Points adjustment saved");
      onSaved();
      onOpenChange(false);
    } catch (e) {
      console.error(e);
      toast.error("Failed to save adjustment");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Adjust points — {associate?.name ?? ""}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
          className="space-y-4"
        >
          <p className="text-sm text-muted-foreground">
            Total points everywhere in the app (last 12 months) are the sum of
            points from attendance occurrences plus this manual adjustment.
            Notification level uses the same total.
          </p>
          <div className="grid gap-2">
            <Label>Points from occurrences (last 12 months)</Label>
            <div
              className={cn(
                "text-lg font-medium tabular-nums",
                !loading && occurrencePoints < 0 && "text-destructive"
              )}
            >
              {loading ? "…" : occurrencePoints}
            </div>
          </div>
          <div className="grid gap-2">
            <Label
              htmlFor="points-adjustment"
              className={cn(
                adjustmentValid &&
                  adjustment < 0 &&
                  "text-destructive"
              )}
            >
              Manual adjustment
              {adjustmentValid && adjustment < 0 ? (
                <span className="ml-2 text-xs font-normal text-destructive">
                  (subtracting from total)
                </span>
              ) : null}
            </Label>
            <Input
              id="points-adjustment"
              type="number"
              step="any"
              value={adjustmentInput}
              onChange={(e) => setAdjustmentInput(e.target.value)}
              disabled={loading}
              className={cn(
                adjustmentValid &&
                  adjustment < 0 &&
                  "border-destructive/60 text-destructive focus-visible:ring-destructive"
              )}
            />
            <p
              className={cn(
                "text-xs",
                adjustmentValid && adjustment < 0
                  ? "text-destructive/90"
                  : "text-muted-foreground"
              )}
            >
              Use negative values to subtract (e.g. -2.5).
            </p>
          </div>
          <div
            className={cn(
              "rounded-md border border-border bg-muted/50 p-3 transition-colors",
              !loading &&
                adjustmentValid &&
                totalPreview < 0 &&
                "border-destructive/50 bg-destructive/10"
            )}
          >
            <div
              className={cn(
                "text-sm",
                !loading && adjustmentValid && totalPreview < 0
                  ? "text-destructive"
                  : "text-muted-foreground"
              )}
            >
              Total points
            </div>
            <div
              className={cn(
                "text-xl font-semibold tabular-nums",
                !loading &&
                  adjustmentValid &&
                  totalPreview < 0 &&
                  "text-destructive"
              )}
            >
              {loading ? "…" : adjustmentValid ? totalPreview : "—"}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || saving || !adjustmentValid}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AssociatePointsAdjustmentModal;
