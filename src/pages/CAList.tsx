import React from "react";
import { CorrectiveAction, Rule } from "@/components/lib/api";

interface CAListProps {
  correctiveActions: CorrectiveAction[];
  rules: Rule[];
}

const CAList: React.FC<CAListProps> = ({ correctiveActions }) => {
  if (correctiveActions.length === 0) {
    return <p>No corrective actions found for this associate.</p>;
  }

  return (
    <div className="mt-8">
      <h2 className="text-lg font-semibold mb-4">Corrective Actions</h2>
      <ul className="space-y-4">
        {correctiveActions.map((ca) => (
          <li
            key={ca.id}
            className="bg-white shadow overflow-hidden sm:rounded-md"
          >
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                {ca.rule.type} Rule - {ca.rule.code}
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                {ca.rule.description}
              </p>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
              <dl className="sm:divide-y sm:divide-gray-200">
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">
                    Description
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {ca.description}
                  </dd>
                </div>
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">
                    Notification Level
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {ca.level} - {getNotificationLevelText(ca.level)}
                  </dd>
                </div>
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Date</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {new Date(ca.date).toLocaleDateString()}
                  </dd>
                </div>
              </dl>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

function getNotificationLevelText(level: number): string {
  switch (level) {
    case 1:
      return "Documented Verbal Warning";
    case 2:
      return "Written Warning";
    case 3:
      return "Final Written Warning";
    case 4:
      return "Termination";
    default:
      return "Unknown";
  }
}

export default CAList;
