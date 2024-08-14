import React, { useState } from "react";
import { Rule } from "@/components/lib/api";

interface CAFormProps {
  rules: Rule[];
  associateId: string | null;
  onAddCorrectiveAction: (data: {
    ruleId: string;
    description: string;
    level: number;
  }) => void;
}

const CAForm: React.FC<CAFormProps> = ({
  rules,
  associateId,
  onAddCorrectiveAction,
}) => {
  const [ruleId, setRuleId] = useState("");
  const [description, setDescription] = useState("");
  const [level, setLevel] = useState(1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (associateId && ruleId) {
      onAddCorrectiveAction({ ruleId, description, level });
      setRuleId("");
      setDescription("");
      setLevel(1);
    }
  };

  if (!associateId) {
    return <p>Please select an associate to add a corrective action.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="rule"
          className="block text-sm font-medium text-gray-700"
        >
          Rule Violated
        </label>
        <select
          id="rule"
          value={ruleId}
          onChange={(e) => setRuleId(e.target.value)}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          required
        >
          <option value="">Select a rule</option>
          {rules.map((rule) => (
            <option key={rule.id} value={rule.id}>
              {rule.type} - {rule.code}: {rule.description}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700"
        >
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          rows={3}
          required
        />
      </div>
      <div>
        <label
          htmlFor="level"
          className="block text-sm font-medium text-gray-700"
        >
          Notification Level
        </label>
        <select
          id="level"
          value={level}
          onChange={(e) => setLevel(Number(e.target.value))}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          required
        >
          <option value={1}>1 - Documented Verbal Warning</option>
          <option value={2}>2 - Written Warning</option>
          <option value={3}>3 - Final Written Warning</option>
          <option value={4}>4 - Termination</option>
        </select>
      </div>
      <button
        type="submit"
        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Add Corrective Action
      </button>
    </form>
  );
};

export default CAForm;
