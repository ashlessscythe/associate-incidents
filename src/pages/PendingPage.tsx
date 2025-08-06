import React from "react";
import { Clock } from "lucide-react";

const PendingPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <div className="text-center max-w-md w-full space-y-4">
        <div className="flex justify-center">
          <Clock className="h-12 w-12 text-gray-400 dark:text-gray-500" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">
          Account Pending Approval
        </h1>
        <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
          Your account is currently pending approval. Please check back later or
          contact an administrator.
        </p>
      </div>
    </div>
  );
};

export default PendingPage;
