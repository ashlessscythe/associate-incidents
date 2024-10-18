import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import OccurrenceList from "@/components/list/OccurrenceList";
import { AssociateInfo, Occurrence, OccurrenceType } from "@/lib/api";

interface OccurrenceByTypeRowProps {
  associateInfo: AssociateInfo;
  occurrences?: Occurrence[] | [];
  occurrenceTypes: OccurrenceType[];
  onDeleteOccurrence: (occurrenceId: string) => void;
  onUpdateOccurrence: (associateId: string) => void;
  allowEdit?: boolean;
}

const OccurrenceByTypeRow: React.FC<OccurrenceByTypeRowProps> = ({
  associateInfo,
  occurrences = [],
  occurrenceTypes,
  onDeleteOccurrence,
  onUpdateOccurrence,
  allowEdit,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => setIsExpanded((prev) => !prev);

  const occurrenceCounts = useMemo(() => {
    return occurrences.reduce((acc, occurrence) => {
      const typeCode = occurrence.type.code;
      acc[typeCode] = (acc[typeCode] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [occurrences]);

  return (
    <li className="bg-card text-card-foreground rounded-lg shadow overflow-hidden">
      <div className="flex justify-between items-center p-4 bg-muted hover:bg-muted/80 transition-colors duration-150">
        <div className="flex items-center space-x-4">
          <span className="font-semibold">{associateInfo.name}</span>
          <Link
            to={`/attendance?associateId=${associateInfo.id}`}
            className="text-primary hover:text-primary/80 mr-2"
          >
            Occurrences
          </Link>
          <Link
            to={`/ca?associateId=${associateInfo.id}`}
            className="text-secondary hover:text-secondary/80"
          >
            CA
          </Link>
          <ArrowRight size={20} className="text-muted-foreground" />
          <div className="flex items-center space-x-2">
            {Object.keys(occurrenceCounts).length > 0 ? (
              Object.entries(occurrenceCounts).map(([code, count]) => (
                <span
                  key={code}
                  className="text-sm bg-accent text-accent-foreground px-2 py-1 rounded"
                >
                  {code}: {count}
                </span>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">
                No occurrences
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-muted-foreground">
            Total Points: {associateInfo.points}, Level:{" "}
            {associateInfo.notificationLevel}
          </span>
          <Button onClick={toggleExpand} variant="ghost" size="sm">
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </Button>
        </div>
      </div>
      {isExpanded && (
        <div className="mt-2 p-4">
          <OccurrenceList
            associateInfo={associateInfo}
            occurrences={occurrences}
            onDelete={onDeleteOccurrence}
            onUpdate={onUpdateOccurrence}
            occurrenceTypes={occurrenceTypes}
            allowEdit={allowEdit}
          />
        </div>
      )}
    </li>
  );
};

export default OccurrenceByTypeRow;
