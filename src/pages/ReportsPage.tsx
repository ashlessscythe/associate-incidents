import React, { useState } from "react";
import { getAssociatesData, getCAByType } from "../components/lib/api";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

interface AssociateData {
  name: string;
  currentPoints: number;
  totalOccurrences: number;
  totalCA: number;
}

interface CAByTypeData {
  name: string;
  SAFETY: number;
  WORK: number; // expand these as needed
  [key: string]: string | number; // allow for future rule types
}

const ReportsPage: React.FC = () => {
  const [associatesData, setAssociatesData] = useState<AssociateData[]>([]);
  const [caByTypeData, setCAByTypeData] = useState<CAByTypeData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFetchAssociatesData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAssociatesData();
      setAssociatesData(data);
    } catch (err) {
      setError("Failed to fetch associates data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchCAByType = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCAByType();
      setCAByTypeData(data);
      setAssociatesData([]);
    } catch (err) {
      setError("Failed to fetch CA by type data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearTable = () => {
    setAssociatesData([]);
    setCAByTypeData([]);
    setError(null);
  };

  const renderTable = () => {
    if (associatesData.length > 0) {
      return (
        <Table className="mt-4 ml-4">
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Current Points</TableHead>
              <TableHead>Total Occurrences</TableHead>
              <TableHead>Total CA</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {associatesData.map((associate, index) => (
              <TableRow key={index}>
                <TableCell>{associate.name}</TableCell>
                <TableCell>{associate.currentPoints.toFixed(2)}</TableCell>
                <TableCell>{associate.totalOccurrences}</TableCell>
                <TableCell>{associate.totalCA}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      );
    } else if (caByTypeData.length > 0) {
      const ruleTypes = Object.keys(caByTypeData[0]).filter(
        (key) => key !== "name"
      );
      return (
        <Table className="mt-4 ml-4">
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              {ruleTypes.map((type) => (
                <TableHead key={type}>Total {type} CA</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {caByTypeData.map((associate, index) => (
              <TableRow key={index}>
                <TableCell>{associate.name}</TableCell>
                {ruleTypes.map((type) => (
                  <TableCell key={type}>{associate[type]}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      );
    }
    return null;
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Associates</h1>
      <div className="flex justify-start space-x-4 mb-4">
        <Button onClick={handleFetchAssociatesData} disabled={loading}>
          {loading ? "Loading..." : "Run Associate Totals Report"}
        </Button>
        <Button onClick={handleFetchCAByType} disabled={loading}>
          {loading ? "Loading..." : "Run CA by Type Report"}
        </Button>
        <Button onClick={handleClearTable} variant="outline">
          Clear Table
        </Button>
      </div>
      {error && <p className="text-red-500 mt-2">{error}</p>}
      {renderTable()}
    </div>
  );
};

export default ReportsPage;
