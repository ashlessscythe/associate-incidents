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
import { Switch } from "@/components/ui/switch";
import {
  getAssociatePointsAndNotification,
  setAssociatePointsAdjustment,
  setAssociatePointTotalsEffectiveDate,
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
  const [effectiveDateInput, setEffectiveDateInput] = useState("");
  /** When false, associate override is cleared; designation default (if any) applies. */
  const [useEffectiveDateCutoff, setUseEffectiveDateCutoff] = useState(false);
  const [designationDefaultYmd, setDesignationDefaultYmd] = useState<string | null>(
    null
  );

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
        const saved = data.pointTotalsEffectiveDate
          ? new Date(data.pointTotalsEffectiveDate)
              .toISOString()
              .split("T")[0]
          : "";
        setEffectiveDateInput(saved);
        setUseEffectiveDateCutoff(!!saved);
        setDesignationDefaultYmd(
          data.designationPointTotalsEffectiveDate
            ? new Date(data.designationPointTotalsEffectiveDate)
                .toISOString()
                .split("T")[0]
            : null
        );
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
    if (useEffectiveDateCutoff && !effectiveDateInput.trim()) {
      toast.error("Pick an effective date, or turn off the date cutoff");
      return;
    }
    setSaving(true);
    try {
      await setAssociatePointsAdjustment(associate.id, adjustment);
      const datePayload = useEffectiveDateCutoff
        ? effectiveDateInput.trim()
        : null;
      await setAssociatePointTotalsEffectiveDate(associate.id, datePayload);
      toast.success("Points settings saved");
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
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-[480px] max-h-[90vh] overflow-y-auto">
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
            Totals use occurrences on or after the <strong>effective cutoff</strong>{" "}
            (within the rolling 12-month window), plus the manual adjustment.
            Notification level uses the same total.{" "}
            <strong>Designation defaults</strong> are set in Admin → Designations;
            you can override them here for this person only.
          </p>
          <div
            className="rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground space-y-1"
            role="status"
          >
            <p>
              <span className="font-medium text-foreground">Designation </span>
              <span className="font-mono">{associate?.designation ?? "—"}</span>
              {designationDefaultYmd ? (
                <>
                  : default cutoff{" "}
                  <span className="font-mono tabular-nums">
                    {designationDefaultYmd}
                  </span>{" "}
                  (inclusive), from admin.
                </>
              ) : (
                <> — no designation-wide cutoff configured.</>
              )}
            </p>
            {!useEffectiveDateCutoff && designationDefaultYmd ? (
              <p>Associate override is off — this person follows the designation date above.</p>
            ) : null}
            {!useEffectiveDateCutoff && !designationDefaultYmd ? (
              <p>Associate override is off — all in-window occurrences count (no cutoff).</p>
            ) : null}
          </div>
          <div className="grid gap-2">
            <div className="flex flex-col gap-3 rounded-md border border-border px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
              <Label
                htmlFor="use-effective-date-cutoff"
                className="text-sm font-normal cursor-pointer leading-snug pr-2"
              >
                Associate-specific date override (replaces designation default for
                this person)
              </Label>
              <Switch
                id="use-effective-date-cutoff"
                className="shrink-0 self-end sm:self-auto"
                checked={useEffectiveDateCutoff}
                disabled={loading}
                onCheckedChange={(on) => {
                  setUseEffectiveDateCutoff(on);
                  if (!on) setEffectiveDateInput("");
                }}
              />
            </div>
            <Label htmlFor="point-totals-effective-date">
              Associate override date (inclusive)
            </Label>
            <Input
              id="point-totals-effective-date"
              type="date"
              value={useEffectiveDateCutoff ? effectiveDateInput : ""}
              onChange={(e) => setEffectiveDateInput(e.target.value)}
              disabled={loading || !useEffectiveDateCutoff}
              className="max-w-full sm:max-w-[12rem]"
            />
            <p className="text-xs text-muted-foreground">
              When override is off, nothing is stored on the associate and the
              designation default applies. When on, pick the first day that should
              count for this person; older in-window rows stay visible but are
              excluded from totals, print, and Excel &quot;counted&quot; sections.
            </p>
          </div>
          <div className="grid gap-2">
            <Label>Points from counted occurrences (rolling window)</Label>
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
            <Button
              type="submit"
              disabled={
                loading ||
                saving ||
                !adjustmentValid ||
                (useEffectiveDateCutoff && !effectiveDateInput.trim())
              }
            >
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AssociatePointsAdjustmentModal;
