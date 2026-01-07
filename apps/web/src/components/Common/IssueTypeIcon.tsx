import React from "react";
import { CheckSquare, Bookmark, Bug, Zap } from "lucide-react";
import { IssueType } from "../../types";

export const IssueTypeIcon = ({ type }: { type: IssueType }) => {
  switch (type) {
    case "Bug":
      return <Bug size={16} className="text-red-500 fill-current/20" />;
    case "Story":
      return <Bookmark size={16} className="text-green-600 fill-current/20" />;
    case "Task":
      return (
        <CheckSquare size={16} className="text-blue-500 fill-current/20" />
      );
    case "Epic":
      return <Zap size={16} className="text-purple-600 fill-current/20" />;
    default:
      return <CheckSquare size={16} className="text-gray-500" />;
  }
};
