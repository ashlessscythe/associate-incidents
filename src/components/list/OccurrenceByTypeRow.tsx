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
    <li className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden transition-colors duration-200">
      <div className="flex justify-between items-center p-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-150">
        <div className="flex items-center space-x-4">
          <span className="font-semibold text-gray-800 dark:text-white">
            {associateInfo.name}
          </span>
          <Link
            to={`/attendance?associateId=${associateInfo.id}`}
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 mr-2"
          >
            Occurrences
          </Link>
          <Link
            to={`/ca?associateId=${associateInfo.id}`}
            className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200"
          >
            CA
          </Link>
          <ArrowRight size={20} className="text-gray-400 dark:text-gray-500" />
          <div className="flex items-center space-x-2">
            {Object.keys(occurrenceCounts).length > 0 ? (
              Object.entries(occurrenceCounts).map(([code, count]) => (
                <span
                  key={code}
                  className="text-sm bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white px-2 py-1 rounded"
                >
                  {code}: {count}
                </span>
              ))
            ) : (
              <span className="text-sm text-gray-600 dark:text-gray-300">
                No occurrences
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600 dark:text-gray-300">
            Total Points: {associateInfo.points}, Level:{" "}
            {associateInfo.notificationLevel}
          </span>
          <Button
            onClick={toggleExpand}
            variant="ghost"
            size="sm"
            className="text-gray-800 dark:text-white"
          >
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
