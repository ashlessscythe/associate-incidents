import React, { useEffect, useState } from "react";
import { PanelLeftClose, PanelLeftOpen, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export type ModuleWorkspaceFormApi = {
  closeForm: () => void;
};

type ModuleWorkspaceProps = {
  select: React.ReactNode;
  form?:
    | React.ReactNode
    | ((api: ModuleWorkspaceFormApi) => React.ReactNode);
  canAdd?: boolean;
  addLabel?: string;
  formTitle?: string;
  formDescription?: string;
  hasSelection: boolean;
  emptyMessage?: string;
  children: React.ReactNode;
  className?: string;
};

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(query).matches : false
  );

  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}

function ModuleWorkspace({
  select,
  form,
  canAdd = false,
  addLabel = "Add",
  formTitle = "Add",
  formDescription,
  hasSelection,
  emptyMessage = "Select an associate to view details.",
  children,
  className,
}: ModuleWorkspaceProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isFormSheetOpen, setIsFormSheetOpen] = useState(false);
  const isSmUp = useMediaQuery("(min-width: 640px)");
  const isLgUp = useMediaQuery("(min-width: 1024px)");

  const closeForm = () => setIsFormSheetOpen(false);

  const renderForm = () => {
    if (!form) return null;
    if (typeof form === "function") {
      return form({ closeForm });
    }
    return form;
  };

  return (
    <div
      className={cn(
        "flex flex-col lg:flex-row min-h-0 relative bg-background text-foreground",
        className
      )}
    >
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col relative shrink-0 transition-all duration-300 ease-in-out bg-card text-card-foreground shadow-md rounded-lg overflow-hidden",
          isSidebarOpen
            ? "lg:w-[min(20rem,36%)] xl:w-[min(22rem,30%)] 2xl:w-[min(24rem,25%)]"
            : "lg:w-0 lg:shadow-none"
        )}
      >
        {isLgUp && isSidebarOpen && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
            {select}
            {canAdd && renderForm()}
          </div>
        )}
      </aside>

      {isLgUp && (
        <div className="hidden lg:block relative w-0 shrink-0 self-stretch">
          <Button
            type="button"
            size="icon"
            variant="default"
            onClick={() => setIsSidebarOpen((open) => !open)}
            className="absolute top-4 left-0 z-20 -translate-x-1/2 shadow-md h-8 w-8"
            title={isSidebarOpen ? "Hide sidebar" : "Show sidebar"}
            aria-label={isSidebarOpen ? "Hide sidebar" : "Show sidebar"}
          >
            {isSidebarOpen ? (
              <PanelLeftClose className="h-4 w-4" />
            ) : (
              <PanelLeftOpen className="h-4 w-4" />
            )}
          </Button>
        </div>
      )}

      {/* Mobile sticky toolbar */}
      {!isLgUp && (
        <div className="sticky top-0 z-30 -mx-4 px-4 py-3 mb-3 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 min-w-0">{select}</div>
            {canAdd && (
              <Button
                type="button"
                className="w-full sm:w-auto shrink-0"
                onClick={() => setIsFormSheetOpen(true)}
                disabled={!hasSelection}
              >
                <Plus className="h-4 w-4 mr-2" />
                {addLabel}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Main content */}
      <div
        className={cn(
          "flex-1 min-w-0 min-h-0 transition-all duration-300 ease-in-out",
          isSidebarOpen ? "lg:ml-4" : "lg:ml-6"
        )}
      >
        {children}
        {!hasSelection && (
          <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
            <p className="text-sm sm:text-base">{emptyMessage}</p>
          </div>
        )}
      </div>

      {/* Mobile form sheet: bottom on phone, right on sm+ */}
      {canAdd && !isLgUp && (
        <Sheet open={isFormSheetOpen} onOpenChange={setIsFormSheetOpen}>
          <SheetContent
            side={isSmUp ? "right" : "bottom"}
            className={cn(
              !isSmUp && "rounded-t-xl",
              isSmUp && "flex flex-col"
            )}
          >
            <SheetHeader>
              <SheetTitle>{formTitle}</SheetTitle>
              {formDescription && (
                <SheetDescription>{formDescription}</SheetDescription>
              )}
            </SheetHeader>
            <div className="mt-4 overflow-y-auto flex-1">{renderForm()}</div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}

export default ModuleWorkspace;
