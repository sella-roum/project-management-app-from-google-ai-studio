import React, { useState, useEffect } from "react";
import {
  Search as SearchIcon,
  Filter,
  XCircle,
  ChevronDown,
  Bookmark,
  Terminal,
  Save,
  HelpCircle,
  Terminal as TerminalIcon,
} from "lucide-react";
import { PRIORITY_LABELS, TYPE_LABELS, executeJQL } from "@repo/core";
import {
  db,
  getCurrentUserId,
  getProjects,
  getSavedFilters,
  saveFilter,
} from "../services/mockData";
import { IssueCard } from "../components/Common/IssueCard";
import { Issue } from "../types";
import { useLocation } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";

const JQL_FIELDS = [
  "status",
  "priority",
  "type",
  "assigneeId",
  "reporterId",
  "createdAt",
  "dueDate",
];

export const Search = ({
  onOpenIssue,
}: {
  onOpenIssue: (i: Issue) => void;
}) => {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [isJqlMode, setIsJqlMode] = useState(false);
  const [filterProjectId, setFilterProjectId] = useState<string>("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "saved">("all");
  const [jqlSuggestions, setJqlSuggestions] = useState<string[]>([]);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [filterName, setFilterName] = useState("");

  const location = useLocation();
  const projects = useLiveQuery(() => getProjects()) || [];
  const savedFilters = useLiveQuery(() => getSavedFilters()) || [];

  useEffect(() => {
    if (location.state && (location.state as any).filter) {
      setActiveFilter((location.state as any).filter);
    }
  }, [location.state]);

  const handleJqlChange = (val: string) => {
    setQuery(val);
    const words = val.split(" ");
    const lastWord = words[words.length - 1].toLowerCase();

    if (lastWord.length > 0) {
      const fieldMatches = JQL_FIELDS.filter((f) => f.startsWith(lastWord));
      setJqlSuggestions(fieldMatches);
    } else {
      setJqlSuggestions([]);
    }
  };

  const applySuggestion = (s: string) => {
    const words = query.split(" ");
    words[words.length - 1] = s;
    setQuery(words.join(" ") + " ");
    setJqlSuggestions([]);
  };

  const handleSaveFilter = async () => {
    if (!filterName) return;
    let finalQuery = query;
    if (!isJqlMode && activeFilter) {
      const uid = getCurrentUserId();
      finalQuery =
        activeFilter === "assigned"
          ? `assigneeId = ${uid}`
          : `reporterId = ${uid}`;
    }
    await saveFilter(filterName, finalQuery);
    setFilterName("");
    setSaveModalOpen(false);
    setActiveTab("saved");
  };

  const filteredIssues =
    useLiveQuery(async () => {
      const baseIssues = await db.issues.toArray();
      let results = [...baseIssues];
      const currentUserId = getCurrentUserId();

      if (isJqlMode && query) {
        results = executeJQL(query, results);
      } else {
        if (activeFilter === "assigned")
          results = results.filter((i) => i.assigneeId === currentUserId);
        if (activeFilter === "reported")
          results = results.filter((i) => i.reporterId === currentUserId);
        if (filterProjectId)
          results = results.filter((i) => i.projectId === filterProjectId);
        if (query) {
          const q = query.toLowerCase();
          results = results.filter(
            (i) =>
              i.title.toLowerCase().includes(q) ||
              i.key.toLowerCase().includes(q),
          );
        }
      }

      return results;
    }, [query, activeFilter, filterProjectId, isJqlMode]) || [];

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto min-h-full pb-32">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-secondary">課題の検索</h1>
        <button
          onClick={() => setActiveTab(activeTab === "all" ? "saved" : "all")}
          className="text-xs font-bold flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg shadow-sm active:scale-95 transition-transform"
        >
          <Bookmark
            size={14}
            className={
              activeTab === "saved"
                ? "text-primary fill-current"
                : "text-gray-400"
            }
          />
          {activeTab === "saved" ? "検索に戻る" : "保存済みフィルタ"}
        </button>
      </div>

      <div className="flex gap-4 border-b border-gray-200 mb-6">
        <button
          onClick={() => setIsJqlMode(false)}
          className={`pb-3 text-sm font-bold border-b-2 transition-all ${!isJqlMode ? "border-primary text-primary" : "border-transparent text-gray-400"}`}
        >
          ベーシック
        </button>
        <button
          onClick={() => setIsJqlMode(true)}
          className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 ${isJqlMode ? "border-primary text-primary" : "border-transparent text-gray-400"}`}
        >
          <TerminalIcon size={14} /> JQL検索
        </button>
      </div>

      {isJqlMode ? (
        <div className="space-y-4 mb-6 animate-fadeIn relative">
          <div className="relative group">
            <textarea
              value={query}
              onChange={(e) => handleJqlChange(e.target.value)}
              placeholder="status = Done AND priority = Highest"
              className="w-full p-4 bg-gray-900 text-green-400 font-mono text-xs rounded-2xl border-4 border-transparent focus:border-primary/20 shadow-2xl min-h-[120px] outline-none transition-all"
            />
            {jqlSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-30 bg-gray-800 border border-gray-700 shadow-xl rounded-xl p-2 mt-2 max-h-40 overflow-y-auto no-scrollbar">
                {jqlSuggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => applySuggestion(s)}
                    className="w-full text-left px-3 py-1.5 text-xs text-green-500 hover:bg-gray-700 rounded font-mono"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {["status = Done", "type = Bug", "priority = Highest"].map(
                (hint) => (
                  <button
                    key={hint}
                    onClick={() => setQuery(hint)}
                    className="text-[9px] font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded hover:bg-gray-200 uppercase tracking-tighter"
                  >
                    {hint}
                  </button>
                ),
              )}
            </div>
            <button
              onClick={() => setSaveModalOpen(true)}
              className="text-[10px] font-bold text-primary flex items-center gap-1.5 hover:underline"
            >
              <Save size={12} /> この検索を保存
            </button>
          </div>
        </div>
      ) : (
        <div className="relative mb-4 animate-fadeIn">
          <SearchIcon
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="課題キー、タイトル、説明から検索..."
            className="w-full pl-12 pr-12 py-4 bg-white border-2 border-transparent shadow-xl rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none text-base transition-all"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <XCircle size={20} />
            </button>
          )}
        </div>
      )}

      {activeTab === "saved" ? (
        <div className="space-y-3 animate-fadeIn">
          {savedFilters.map((f) => (
            <button
              key={f.id}
              onClick={() => {
                setIsJqlMode(true);
                setQuery(f.query);
                setActiveTab("all");
              }}
              className="w-full text-left bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-primary transition-all"
            >
              <div>
                <div className="font-bold text-gray-800">{f.name}</div>
                <div className="text-[10px] text-gray-400 font-mono mt-1">
                  {f.query}
                </div>
              </div>
              <ChevronDown
                size={16}
                className="-rotate-90 text-gray-300 group-hover:text-primary"
              />
            </button>
          ))}
          {savedFilters.length === 0 && (
            <div className="text-center py-20 text-gray-400 text-xs font-bold uppercase">
              保存済みフィルタはありません
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-6 overflow-x-auto no-scrollbar py-1">
            {!isJqlMode && (
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className={`p-2 rounded-xl border transition-all ${showAdvanced ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-gray-200 text-gray-500"}`}
              >
                <Filter size={18} />
              </button>
            )}
            <button
              onClick={() =>
                setActiveFilter(activeFilter === "assigned" ? null : "assigned")
              }
              className={`whitespace-nowrap px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all ${activeFilter === "assigned" ? "bg-secondary text-white border-secondary" : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"}`}
            >
              自分に割り当て
            </button>
            <button
              onClick={() =>
                setActiveFilter(activeFilter === "reported" ? null : "reported")
              }
              className={`whitespace-nowrap px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all ${activeFilter === "reported" ? "bg-secondary text-white border-secondary" : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"}`}
            >
              自分が報告
            </button>
          </div>

          {showAdvanced && !isJqlMode && (
            <div className="mb-6 p-5 bg-white rounded-2xl border border-gray-100 shadow-lg animate-fadeIn">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">
                プロジェクトで絞り込む
              </label>
              <select
                value={filterProjectId}
                onChange={(e) => setFilterProjectId(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">すべてのプロジェクト</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between px-1 mb-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                結果: {filteredIssues.length}件
              </span>
            </div>
            {filteredIssues.map((issue) => (
              <IssueCard
                key={issue.id}
                issue={issue}
                onClick={() => onOpenIssue(issue)}
              />
            ))}
            {filteredIssues.length === 0 && (
              <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-100">
                <SearchIcon size={48} className="text-gray-100 mx-auto mb-4" />
                <p className="text-sm font-bold text-gray-400">
                  一致する課題は見つかりませんでした。
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Save Filter Modal */}
      {saveModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-xs rounded-3xl shadow-2xl p-6 space-y-6 animate-slideUp">
            <h3 className="font-black text-secondary uppercase tracking-widest text-center">
              フィルタを保存
            </h3>
            <input
              type="text"
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              placeholder="フィルタ名 (例: 完了したバグ)"
              className="w-full p-4 bg-gray-50 rounded-2xl outline-none border border-transparent focus:border-primary/20 font-bold"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setSaveModalOpen(false)}
                className="flex-1 p-4 bg-gray-100 text-gray-500 rounded-2xl font-bold"
              >
                戻る
              </button>
              <button
                onClick={handleSaveFilter}
                className="flex-1 p-4 bg-primary text-white rounded-2xl font-bold"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
