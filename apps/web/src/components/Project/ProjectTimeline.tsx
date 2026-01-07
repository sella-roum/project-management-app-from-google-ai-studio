import React, { useState, useRef, useEffect, useMemo } from "react";
import { Issue } from "../../types";
import { Avatar } from "../Common/Avatar";
import {
  Calendar,
  ChevronRight,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { updateIssue } from "@repo/storage";

interface Props {
  issues: Issue[];
}

type ZoomLevel = "week" | "month" | "quarter";

export const ProjectTimeline: React.FC<Props> = ({ issues }) => {
  const [zoom, setZoom] = useState<ZoomLevel>("month");
  const containerRef = useRef<HTMLDivElement>(null);

  // Setup date range based on zoom
  const timelineConfig = useMemo(() => {
    const now = new Date();
    let start: Date, end: Date, dayWidth: number;

    switch (zoom) {
      case "week":
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 14);
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 28);
        dayWidth = 60; // 1日あたり60px
        break;
      case "quarter":
        start = new Date(now.getFullYear(), now.getMonth() - 6, 1);
        end = new Date(now.getFullYear(), now.getMonth() + 9, 0);
        dayWidth = 5; // 1日あたり5px
        break;
      case "month":
      default:
        start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        end = new Date(now.getFullYear(), now.getMonth() + 4, 0);
        dayWidth = 20; // 1日あたり20px
        break;
    }

    const totalDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    const width = totalDays * dayWidth;

    return { start, end, totalDays, width, dayWidth };
  }, [zoom]);

  const getX = (dateStr?: string) => {
    if (!dateStr) return 0;
    const date = new Date(dateStr);
    const diffDays =
      (date.getTime() - timelineConfig.start.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays * timelineConfig.dayWidth;
  };

  const handleMove = (e: React.MouseEvent, issue: Issue) => {
    if (e.buttons !== 1) return;
    const rect = e.currentTarget.parentElement?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const day = x / timelineConfig.dayWidth;
    const newDate = new Date(timelineConfig.start.getTime() + day * 86400000);

    // Simple Constraint: Due date cannot be before creation
    if (newDate.toISOString() >= issue.createdAt) {
      updateIssue(issue.id, { dueDate: newDate.toISOString() });
    }
  };

  const labels = useMemo(() => {
    const res: { label: string; left: number }[] = [];
    let curr = new Date(timelineConfig.start);
    while (curr <= timelineConfig.end) {
      if (zoom === "week") {
        res.push({
          label: `${curr.getMonth() + 1}/${curr.getDate()}`,
          left: getX(curr.toISOString()),
        });
        curr.setDate(curr.getDate() + 1);
      } else if (zoom === "quarter") {
        if (curr.getDate() === 1)
          res.push({
            label: `${curr.getMonth() + 1}月`,
            left: getX(curr.toISOString()),
          });
        curr.setDate(curr.getDate() + 7);
      } else {
        if (curr.getDate() === 1)
          res.push({
            label: `${curr.getMonth() + 1}月`,
            left: getX(curr.toISOString()),
          });
        curr.setDate(curr.getDate() + 1);
      }
    }
    return res;
  }, [timelineConfig, zoom]);

  const sortedIssues = [...issues].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt),
  );

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">
      {/* Zoom Controls */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl">
          {(["week", "month", "quarter"] as ZoomLevel[]).map((z) => (
            <button
              key={z}
              onClick={() => setZoom(z)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${zoom === z ? "bg-white text-primary shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
            >
              {z === "week" ? "週" : z === "month" ? "月" : "四半期"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto no-scrollbar" ref={containerRef}>
        <div
          style={{ width: timelineConfig.width + 300 }}
          className="relative p-6"
        >
          <div className="flex sticky top-0 bg-white z-20 border-b border-gray-100 pb-4">
            <div className="w-[300px] shrink-0 font-black text-[9px] text-gray-400 uppercase tracking-widest">
              作業項目
            </div>
            <div className="flex-1 relative h-4">
              {labels.map((l, i) => (
                <div
                  key={i}
                  className="absolute text-[8px] font-black text-gray-300 border-l border-gray-100 h-2 pl-1"
                  style={{ left: l.left }}
                >
                  {l.label}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2 mt-4 relative z-0">
            {sortedIssues.map((issue) => {
              const startX = getX(issue.createdAt);
              const endX = getX(
                issue.dueDate ||
                  new Date(
                    new Date(issue.createdAt).getTime() + 7 * 86400000,
                  ).toISOString(),
              );
              const width = Math.max(30, endX - startX);

              return (
                <div key={issue.id} className="flex items-center group h-9">
                  <div className="w-[300px] shrink-0 pr-6 flex items-center gap-3 overflow-hidden">
                    <span className="text-[9px] font-mono text-gray-400 shrink-0 tracking-tighter">
                      {issue.key}
                    </span>
                    <span className="text-xs font-bold text-gray-700 truncate group-hover:text-primary transition-colors">
                      {issue.title}
                    </span>
                  </div>
                  <div className="flex-1 relative h-6 bg-gray-50/30 rounded-lg">
                    <div
                      onMouseMove={(e) => handleMove(e, issue)}
                      className={`absolute top-0 h-full rounded-full shadow-lg border-2 border-white cursor-move flex items-center px-2 transition-all ${issue.status === "Done" ? "bg-success" : "bg-primary"}`}
                      style={{ left: startX, width }}
                    >
                      {width > 40 && (
                        <span className="text-[8px] text-white font-black truncate uppercase">
                          {issue.key}
                        </span>
                      )}
                    </div>
                    <div
                      className="absolute top-0 pointer-events-none"
                      style={{ left: endX + 8 }}
                    >
                      <Avatar userId={issue.assigneeId} size="sm" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
