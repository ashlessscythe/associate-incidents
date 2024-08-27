import React, { useEffect, useState } from "react";
import { getCAByType, getRules, getAssociatesData } from "../lib/api";
import { Button } from "@/components/ui/button";
import CAByTypeRow from "@/components/CAByTypeRow";
import { CorrectiveAction, Rule } from "../lib/api";

interface AssociateData {
  id: string;
  name: string;
  currentPoints: number;
  totalOccurrences: number;
  totalCA: number;
}

interface CAByTypeData {
  id: string;
  name: string;
  correctiveActions: CorrectiveAction[];
}

const ReportsPage: React.FC = () => {
  const [caByTypeData, setCAByTypeData] = useState<CAByTypeData[]>([]);
  const [associatesData, setAssociatesData] = useState<AssociateData[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeReport, setActiveReport] = useState<"points" | "ca" | null>(
    null
  );

  useEffect(() => {
    const fetchRules = async () => {
      try {
        const rulesData = await getRules();
        setRules(rulesData);
      } catch (err) {
        console.error("Failed to fetch rules:", err);
        setError("Failed to fetch rules");
      }
    };
    fetchRules();
  }, []);

  const handleFetchCAByType = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCAByType();
      setCAByTypeData(data);
      setActiveReport("ca");
    } catch (err) {
      setError("Failed to fetch CA by type data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchAssociatesData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAssociatesData();
      setAssociatesData(data);
      setActiveReport("points");
    } catch (err) {
      setError("Failed to fetch associates data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearReport = () => {
    setCAByTypeData([]);
    setAssociatesData([]);
    setActiveReport(null);
    setError(null);
  };

  const handleEditCA = async (ca: CorrectiveAction) => {
    // Implement edit functionality
    console.log("Edit CA:", ca);
  };

  const handleDeleteCA = async (id: string) => {
    // Implement delete functionality
    console.log("Delete CA:", id);
  };

  const renderActiveReport = () => {
    switch (activeReport) {
      case "points":
        return (
          <div className="overflow-x-auto">
            <table className="w-4/5 mx-auto bg-white dark:bg-gray-800 border-collapse shadow-md rounded-lg">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-700">
                  <th className="px-4 py-2 text-left border-b dark:border-gray-600">
                    Name
                  </th>
                  <th className="px-4 py-2 text-right border-b dark:border-gray-600">
                    Current Points
                  </th>
                </tr>
              </thead>
              <tbody>
                {associatesData.map((associate, index) => (
                  <tr
                    key={associate.id}
                    className={`
                      ${
                        index % 2 === 0
                          ? "bg-gray-50 dark:bg-gray-800"
                          : "bg-white dark:bg-gray-900"
                      }
                      hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150 ease-in-out
                    `}
                  >
                    <td className="border-b dark:border-gray-700 px-4 py-2">
                      {associate.name}
                    </td>
                    <td className="border-b dark:border-gray-700 px-4 py-2 text-right">
                      {associate.currentPoints.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case "ca":
        return (
          <ul className="space-y-4">
            {caByTypeData.map((associate) => (
              <CAByTypeRow
                key={associate.id}
                associate={associate}
                rules={rules}
                onEditCA={handleEditCA}
                onDeleteCA={handleDeleteCA}
              />
            ))}
          </ul>
        );
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Reports</h1>
      <div className="flex justify-start space-x-4 mb-4">
        <Button onClick={handleFetchAssociatesData} disabled={loading}>
          {loading && activeReport === "points"
            ? "Loading..."
            : "Run Associate Totals Report"}
        </Button>
        <Button onClick={handleFetchCAByType} disabled={loading}>
          {loading && activeReport === "ca"
            ? "Loading..."
            : "Run CA by Type Report"}
        </Button>
        <Button onClick={handleClearReport} variant="outline">
          Clear Report
        </Button>
      </div>
      {error && <p className="text-red-500 mt-2 mb-4">{error}</p>}
      {renderActiveReport()}
    </div>
  );
};

export default ReportsPage;
