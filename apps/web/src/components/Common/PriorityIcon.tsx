import React from "react";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import { IssuePriority } from "../../types";

export const PriorityIcon = ({ priority }: { priority: IssuePriority }) => {
  switch (priority) {
    case "Highest":
      return (
        <ArrowUp size={16} className="text-red-600 font-bold" strokeWidth={3} />
      );
    case "High":
      return <ArrowUp size={16} className="text-red-500" />;
    case "Medium":
      return <ArrowUp size={16} className="text-orange-400 rotate-45" />; // Slanted up
    case "Low":
      return <ArrowDown size={16} className="text-blue-500" />;
    case "Lowest":
      return <ArrowDown size={16} className="text-blue-400 font-bold" />;
    default:
      return <Minus size={16} className="text-gray-400" />;
  }
};
