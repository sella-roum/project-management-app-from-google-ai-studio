import React, { useState } from "react";
import {
  getNotifications,
  markAllNotificationsRead,
  getIssueById,
  markNotificationRead,
} from "../services/mockData";
import { Bell, MessageSquare, UserPlus } from "lucide-react";
import { useOutletContext } from "react-router-dom";
import { Issue } from "../types";
import { useLiveQuery } from "dexie-react-hooks";

interface GlobalContext {
  onOpenIssue: (i: Issue) => void;
}

export const Notifications = () => {
  const notifications = useLiveQuery(() => getNotifications()) || [];
  const { onOpenIssue } = useOutletContext<GlobalContext>();

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
  };

  const handleNotificationClick = async (notif: any) => {
    // Mark as read immediately
    if (!notif.read) {
      await markNotificationRead(notif.id);
    }

    if (notif.issueId) {
      const issue = await getIssueById(notif.issueId);
      if (issue) {
        onOpenIssue(issue);
      }
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "mention":
        return <MessageSquare size={16} className="text-blue-500" />;
      case "assignment":
        return <UserPlus size={16} className="text-orange-500" />;
      default:
        return <Bell size={16} className="text-gray-500" />;
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-secondary">通知</h1>
        <button
          onClick={handleMarkAllRead}
          className="text-primary text-sm font-medium hover:underline disabled:opacity-50 disabled:no-underline"
          disabled={notifications.every((n) => n.read)}
        >
          すべて既読にする
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 divide-y divide-gray-100">
        {notifications.length > 0 ? (
          notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleNotificationClick(notif)}
              className={`p-4 flex gap-3 cursor-pointer transition-colors ${!notif.read ? "bg-blue-50/50" : "hover:bg-gray-50"}`}
            >
              <div className="mt-1">{getIcon(notif.type)}</div>
              <div className="flex-1">
                <p
                  className={`text-sm text-gray-900 mb-0.5 ${!notif.read ? "font-bold" : "font-medium"}`}
                >
                  {notif.title}
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  {notif.description}
                </p>
                <span className="text-xs text-gray-400">
                  {new Date(notif.createdAt).toLocaleDateString()}{" "}
                  {new Date(notif.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              {!notif.read && (
                <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
              )}
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-gray-500">通知はありません</div>
        )}
      </div>
    </div>
  );
};
