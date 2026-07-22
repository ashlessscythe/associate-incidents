import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "react-hot-toast";
import {
  getAdminNotificationLevels,
  replaceNotificationLevels,
} from "@/lib/notificationApi";
import { Bell, Plus, Trash2, Save } from "lucide-react";

interface NotificationLevelsConfigProps {
  isOpen: boolean;
  onClose: () => void;
  designation: string;
}

type LevelDraft = {
  key: string;
  level: string;
  name: string;
  pointThreshold: string;
};

const makeKey = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `row-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export default function NotificationLevelsConfig({
  isOpen,
  onClose,
  designation,
}: NotificationLevelsConfigProps) {
  const [drafts, setDrafts] = useState<LevelDraft[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen || !designation) return;

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const levels = await getAdminNotificationLevels(designation);
        if (cancelled) return;
        setDrafts(
          levels.map((l) => ({
            key: l.id ?? makeKey(),
            level: String(l.level),
            name: l.name,
            pointThreshold: String(l.pointThreshold ?? ""),
          }))
        );
      } catch {
        if (!cancelled) {
          toast.error("Failed to load notification levels");
          setDrafts([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [isOpen, designation]);

  const updateDraft = (
    key: string,
    field: keyof Omit<LevelDraft, "key">,
    value: string
  ) => {
    setDrafts((prev) =>
      prev.map((row) => (row.key === key ? { ...row, [field]: value } : row))
    );
  };

  const handleAddRow = () => {
    setDrafts((prev) => {
      const nextLevel =
        prev.reduce((max, row) => {
          const n = Number(row.level);
          return Number.isInteger(n) && n > max ? n : max;
        }, 0) + 1;
      return [
        ...prev,
        {
          key: makeKey(),
          level: String(nextLevel),
          name: "",
          pointThreshold: "",
        },
      ];
    });
  };

  const handleRemoveRow = (key: string) => {
    setDrafts((prev) => prev.filter((row) => row.key !== key));
  };

  const validateAndBuildPayload = () => {
    const seenLevels = new Set<number>();
    const normalized: {
      level: number;
      name: string;
      pointThreshold: number;
    }[] = [];

    for (let i = 0; i < drafts.length; i++) {
      const row = drafts[i];
      const level = Number(row.level);
      const name = row.name.trim();
      const pointThreshold = Number(row.pointThreshold);

      if (!Number.isInteger(level) || level < 1) {
        toast.error(`Row ${i + 1}: level must be a positive integer`);
        return null;
      }
      if (!name) {
        toast.error(`Row ${i + 1}: name is required`);
        return null;
      }
      if (!Number.isFinite(pointThreshold) || pointThreshold < 0) {
        toast.error(`Row ${i + 1}: point threshold must be a number ≥ 0`);
        return null;
      }
      if (seenLevels.has(level)) {
        toast.error(`Duplicate level number: ${level}`);
        return null;
      }
      seenLevels.add(level);
      normalized.push({ level, name, pointThreshold });
    }

    normalized.sort((a, b) => a.level - b.level);
    for (let i = 1; i < normalized.length; i++) {
      if (normalized[i].pointThreshold <= normalized[i - 1].pointThreshold) {
        toast.error(
          "Point thresholds must increase strictly with level number"
        );
        return null;
      }
    }

    return normalized;
  };

  const handleSave = async () => {
    const payload = validateAndBuildPayload();
    if (!payload) return;

    setSaving(true);
    try {
      const levels = await replaceNotificationLevels(designation, payload);
      setDrafts(
        levels.map((l) => ({
          key: l.id ?? makeKey(),
          level: String(l.level),
          name: l.name,
          pointThreshold: String(l.pointThreshold ?? ""),
        }))
      );
      toast.success(`Saved notification levels for ${designation}`);
      onClose();
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string } };
      };
      toast.error(
        err.response?.data?.message || "Failed to save notification levels"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            {designation} — Notification levels
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Associates in this designation reach a level when their rolling
            points meet or exceed that level&apos;s threshold. Renaming a level
            does not update historical notification records that stored the
            previous name.
          </p>

          {loading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Loading levels…
            </div>
          ) : (
            <div className="space-y-3">
              {drafts.length === 0 ? (
                <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                  No levels configured — add rows or leave empty for None only
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="hidden sm:grid sm:grid-cols-[5rem_1fr_7rem_2.5rem] gap-2 px-1">
                    <Label className="text-xs">Level #</Label>
                    <Label className="text-xs">Name</Label>
                    <Label className="text-xs">Points</Label>
                    <span />
                  </div>
                  {drafts.map((row) => (
                    <div
                      key={row.key}
                      className="grid grid-cols-1 sm:grid-cols-[5rem_1fr_7rem_2.5rem] gap-2 items-center"
                    >
                      <div className="space-y-1">
                        <Label className="text-xs sm:hidden">Level #</Label>
                        <Input
                          type="number"
                          min={1}
                          step={1}
                          value={row.level}
                          onChange={(e) =>
                            updateDraft(row.key, "level", e.target.value)
                          }
                          disabled={saving}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs sm:hidden">Name</Label>
                        <Input
                          value={row.name}
                          placeholder="e.g. Verbal Warning"
                          onChange={(e) =>
                            updateDraft(row.key, "name", e.target.value)
                          }
                          disabled={saving}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs sm:hidden">
                          Point threshold
                        </Label>
                        <Input
                          type="number"
                          min={0}
                          step="any"
                          value={row.pointThreshold}
                          placeholder="3"
                          onChange={(e) =>
                            updateDraft(
                              row.key,
                              "pointThreshold",
                              e.target.value
                            )
                          }
                          disabled={saving}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="justify-self-end sm:justify-self-center"
                        onClick={() => handleRemoveRow(row.key)}
                        disabled={saving}
                        aria-label="Remove level"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddRow}
                disabled={loading || saving}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add level
              </Button>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => void handleSave()}
            disabled={loading || saving}
          >
            <Save className="h-4 w-4 mr-1" />
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
