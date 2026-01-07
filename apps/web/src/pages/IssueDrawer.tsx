import React, { useState, useEffect, useRef } from "react";
import {
  Issue,
  IssueStatus,
  IssuePriority,
  LinkType,
  WorkLog,
  Version,
} from "../types";
import {
  X,
  Share2,
  MoreHorizontal,
  ChevronDown,
  Trash2,
  Plus,
  Link as LinkIcon,
  History as HistoryIcon,
  MessageSquare,
  Paperclip,
  Download,
  Search,
  FileText,
  ExternalLink,
  Timer,
  ChevronRight,
  Eye,
  EyeOff,
  Zap,
  LayoutList,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { IssueTypeIcon } from "../components/Common/IssueTypeIcon";
import { Avatar } from "../components/Common/Avatar";
import { STATUS_LABELS, WORKFLOW_TRANSITIONS } from "@repo/core";
import {
  updateIssue,
  deleteIssue,
  USERS,
  addComment,
  getIssueById,
  getIssues,
  getSubtasks,
  addIssueLink,
  getCurrentUserId,
  recordView,
  logWork,
  createIssue,
  toggleWatch,
  addAttachment,
  hasPermission,
  getVersions,
} from "@repo/storage";
import { useLiveQuery } from "dexie-react-hooks";
import { useConfirm } from "../providers/ConfirmProvider";

interface Props {
  issue: Issue | null;
  onClose: () => void;
  onUpdate: (updatedIssue: Issue) => void;
}

export const IssueDrawer: React.FC<Props> = ({
  issue: initialIssue,
  onClose,
}) => {
  const [commentText, setCommentText] = useState("");
  const [activeTab, setActiveTab] = useState<
    "comments" | "history" | "worklog"
  >("comments");
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showLinkMenu, setShowLinkMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [linkSearch, setLinkSearch] = useState("");
  const [selectedLinkType, setSelectedLinkType] =
    useState<LinkType>("relates to");

  const [showWorkLogModal, setShowWorkLogModal] = useState(false);
  const [workLogTime, setWorkLogTime] = useState("");
  const [workLogComment, setWorkLogComment] = useState("");

  const [showSubtaskInput, setShowSubtaskInput] = useState(false);
  const [subtaskTitle, setSubtaskTitle] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const issue = useLiveQuery(
    () => (initialIssue ? getIssueById(initialIssue.id) : undefined),
    [initialIssue?.id],
  );
  const subtasks =
    useLiveQuery(() => (issue ? getSubtasks(issue.id) : []), [issue?.id]) || [];
  const allIssues = useLiveQuery(() => getIssues(), []) || [];
  const projectVersions =
    useLiveQuery(
      () => (issue ? getVersions(issue.projectId) : []),
      [issue?.projectId],
    ) || [];

  const currentUserId = getCurrentUserId();
  const { confirm } = useConfirm();

  useEffect(() => {
    if (issue) {
      setTitle(issue.title);
      setDescription(issue.description || "");
      recordView(issue.id);
    }
  }, [issue]);

  if (!issue) return null;

  const isWatching = issue.watcherIds?.includes(currentUserId);

  const handlePostComment = async () => {
    if (!commentText.trim()) return;
    await addComment(issue.id, commentText);
    setCommentText("");
  };

  const handleLogWork = async () => {
    const minutes = parseInt(workLogTime) || 0;
    if (minutes > 0) {
      await logWork(issue.id, minutes * 60, workLogComment);
      setWorkLogTime("");
      setWorkLogComment("");
      setShowWorkLogModal(false);
    }
  };

  const handleAddSubtask = async () => {
    if (!subtaskTitle.trim()) return;
    await createIssue({
      projectId: issue.projectId,
      title: subtaskTitle,
      parentId: issue.id,
      type: "Task",
      status: "To Do",
    });
    setSubtaskTitle("");
    setShowSubtaskInput(false);
  };

  const handleLinkIssue = async (targetId: string) => {
    await addIssueLink(issue.id, targetId, selectedLinkType);
    setShowLinkMenu(false);
    setLinkSearch("");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await addAttachment(issue.id, file);
    }
  };

  const handleDelete = async () => {
    const shouldDelete = await confirm({
      title: "課題の削除",
      message:
        "この課題を完全に削除してもよろしいですか？\nこの操作は取り消せません。",
      confirmText: "削除する",
      isDestructive: true,
    });

    if (shouldDelete) {
      const success = await deleteIssue(issue.id);
      if (success) {
        onClose();
      } else {
        alert("課題を削除できませんでした。権限がない可能性があります。");
      }
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/#/projects/${issue.projectId}?issue=${issue.key}`;
    navigator.clipboard.writeText(url);
    alert("課題へのリンクをクリップボードにコピーしました！");
  };

  const searchableIssues = allIssues.filter(
    (i) =>
      i.id !== issue.id &&
      (i.title.toLowerCase().includes(linkSearch.toLowerCase()) ||
        i.key.toLowerCase().includes(linkSearch.toLowerCase())),
  );

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full md:w-[640px] bg-white h-full shadow-2xl flex flex-col animate-slideInRight">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <IssueTypeIcon type={issue.type} />
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              {issue.key}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => toggleWatch(issue.id)}
              className={`p-2 rounded-xl border transition-all ${isWatching ? "bg-blue-50 text-primary border-blue-100" : "text-gray-400 border-gray-100 hover:bg-gray-50"}`}
            >
              {isWatching ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
            <button
              onClick={handleShare}
              className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl transition-all"
            >
              <Share2 size={18} />
            </button>
            <div className="relative">
              <button
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl transition-all"
              >
                <MoreHorizontal size={18} />
              </button>
              {showMoreMenu && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-gray-100 shadow-2xl rounded-2xl z-50 overflow-hidden py-1 animate-slideUp">
                  <button
                    onClick={handleDelete}
                    className="w-full text-left px-4 py-3 text-xs font-bold text-red-500 hover:bg-red-50 flex items-center gap-2"
                  >
                    <Trash2 size={14} /> 課題を削除
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-red-500 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-10 no-scrollbar pb-32">
          {/* Title & Status */}
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => updateIssue(issue.id, { title })}
              className="text-2xl font-black text-secondary leading-tight w-full outline-none bg-white focus:ring-4 focus:ring-primary/5 border border-transparent hover:border-gray-200 focus:border-primary/20 rounded-xl transition-all p-2"
            />
            <div className="mt-4 flex flex-wrap gap-3">
              <div className="relative">
                <button
                  onClick={() => setShowStatusMenu(!showStatusMenu)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-[10px] transition-all uppercase tracking-widest ${issue.status === "Done" ? "bg-green-100 text-green-700" : "bg-gray-100 text-secondary"}`}
                >
                  {STATUS_LABELS[issue.status]} <ChevronDown size={14} />
                </button>
                {showStatusMenu && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-100 shadow-2xl rounded-2xl z-50 overflow-hidden animate-slideUp">
                    {Object.keys(STATUS_LABELS).map((status) => (
                      <button
                        key={status}
                        onClick={() => {
                          updateIssue(issue.id, {
                            status: status as IssueStatus,
                          });
                          setShowStatusMenu(false);
                        }}
                        className="w-full text-left px-4 py-3 text-[10px] font-black text-secondary hover:bg-blue-50 transition-colors uppercase"
                      >
                        {STATUS_LABELS[status as IssueStatus]}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={issue.fixVersionId || ""}
                  onChange={(e) =>
                    updateIssue(issue.id, {
                      fixVersionId: e.target.value || undefined,
                    })
                  }
                  className="bg-gray-50 border border-gray-200 text-[10px] font-bold uppercase p-2 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">解決バージョンなし</option>
                  {projectVersions.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              詳細説明
            </h3>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={() => updateIssue(issue.id, { description })}
              className="w-full p-4 bg-gray-50/50 rounded-2xl text-sm font-medium text-gray-700 outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all resize-none min-h-[120px]"
              placeholder="詳細を入力..."
            />
          </div>

          {/* Subtasks */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <LayoutList size={14} /> 子課題
              </h3>
              <button
                onClick={() => setShowSubtaskInput(true)}
                className="p-2 text-primary hover:bg-blue-50 rounded-xl transition-all"
              >
                <Plus size={18} />
              </button>
            </div>
            <div className="space-y-2">
              {subtasks.map((st) => (
                <div
                  key={st.id}
                  className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-2xl group hover:border-primary/20 transition-all shadow-sm"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <CheckCircle2
                      size={16}
                      className={
                        st.status === "Done"
                          ? "text-green-500"
                          : "text-gray-300"
                      }
                    />
                    <span
                      className={`text-xs font-bold truncate ${st.status === "Done" ? "text-gray-400 line-through" : "text-gray-700"}`}
                    >
                      {st.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[9px] font-mono text-gray-400">
                      {st.key}
                    </span>
                    <Avatar userId={st.assigneeId} size="sm" />
                  </div>
                </div>
              ))}
              {showSubtaskInput && (
                <div className="p-4 bg-gray-50 rounded-2xl border border-primary/20 animate-fadeIn">
                  <input
                    autoFocus
                    value={subtaskTitle}
                    onChange={(e) => setSubtaskTitle(e.target.value)}
                    placeholder="何をする必要がありますか？"
                    className="w-full bg-transparent border-none outline-none text-sm font-bold mb-3"
                    onKeyDown={(e) => e.key === "Enter" && handleAddSubtask()}
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setShowSubtaskInput(false)}
                      className="px-3 py-1.5 text-[10px] font-black text-gray-400 uppercase"
                    >
                      キャンセル
                    </button>
                    <button
                      onClick={handleAddSubtask}
                      className="px-3 py-1.5 bg-primary text-white rounded-lg text-[10px] font-black uppercase"
                    >
                      追加
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Issue Links */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <LinkIcon size={14} /> 関連する課題
              </h3>
              <button
                onClick={() => setShowLinkMenu(!showLinkMenu)}
                className="p-2 text-primary hover:bg-blue-50 rounded-xl transition-all"
              >
                <Plus size={18} />
              </button>
            </div>

            {showLinkMenu && (
              <div className="p-4 bg-gray-50 rounded-2xl border border-primary/20 animate-fadeIn space-y-4">
                <div className="flex gap-2">
                  {(
                    ["blocks", "is blocked by", "relates to"] as LinkType[]
                  ).map((lt) => (
                    <button
                      key={lt}
                      onClick={() => setSelectedLinkType(lt)}
                      className={`px-2 py-1 rounded text-[9px] font-black uppercase border transition-all ${selectedLinkType === lt ? "bg-primary text-white border-primary" : "bg-white text-gray-400 border-gray-200"}`}
                    >
                      {lt}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    value={linkSearch}
                    onChange={(e) => setLinkSearch(e.target.value)}
                    placeholder="課題を検索..."
                    className="w-full pl-9 p-2 text-xs font-bold bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                {linkSearch && searchableIssues.length > 0 && (
                  <div className="max-h-40 overflow-y-auto no-scrollbar space-y-1">
                    {searchableIssues.map((si) => (
                      <button
                        key={si.id}
                        onClick={() => handleLinkIssue(si.id)}
                        className="w-full text-left p-2 hover:bg-white rounded-lg text-xs flex justify-between group"
                      >
                        <span className="font-bold text-gray-700 truncate">
                          {si.title}
                        </span>
                        <span className="text-[9px] text-gray-400 font-mono group-hover:text-primary">
                          {si.key}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              {issue.links?.map((link) => {
                const target = allIssues.find(
                  (i) => i.id === link.outwardIssueId,
                );
                if (!target) return null;
                return (
                  <div
                    key={link.id}
                    className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-2xl shadow-sm"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <span className="text-[9px] font-black text-primary uppercase bg-blue-50 px-1.5 py-0.5 rounded">
                        {link.type}
                      </span>
                      <span className="text-xs font-bold text-gray-700 truncate">
                        {target.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[9px] font-mono text-gray-400">
                        {target.key}
                      </span>
                      <ArrowRight size={14} className="text-gray-300" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Attachments */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Paperclip size={14} /> 添付ファイル
              </h3>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-primary hover:bg-blue-50 rounded-xl transition-all"
              >
                <Plus size={18} />
              </button>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
            />

            <div className="grid grid-cols-2 gap-3">
              {issue.attachments?.map((at) => (
                <div
                  key={at.id}
                  className="p-3 bg-gray-50 border border-gray-100 rounded-2xl flex items-center gap-3 group relative hover:border-primary/20 transition-all"
                >
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-primary shadow-sm shrink-0">
                    {at.fileType.startsWith("image") ? (
                      <img
                        src={at.data}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <FileText size={20} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-bold text-gray-700 truncate">
                      {at.fileName}
                    </div>
                    <div className="text-[8px] text-gray-400 uppercase font-black">
                      {(at.fileSize / 1024).toFixed(1)} KB
                    </div>
                  </div>
                  <a
                    href={at.data}
                    download={at.fileName}
                    className="absolute inset-0 flex items-center justify-center bg-black/5 opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity"
                  >
                    <Download size={16} className="text-primary" />
                  </a>
                </div>
              ))}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-4 border-2 border-dashed border-gray-100 rounded-2xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-primary/20 hover:text-primary transition-all cursor-pointer min-h-[64px]"
              >
                <Plus size={16} />
                <span className="text-[8px] font-black uppercase tracking-widest">
                  追加
                </span>
              </div>
            </div>
          </div>

          {/* Activity Tabs */}
          <div className="pt-6 border-t border-gray-50">
            <div className="flex gap-8 border-b border-gray-50 mb-8 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setActiveTab("comments")}
                className={`pb-4 text-[10px] font-black uppercase tracking-[0.2em] relative transition-all whitespace-nowrap ${activeTab === "comments" ? "text-primary" : "text-gray-400"}`}
              >
                コメント
              </button>
              <button
                onClick={() => setActiveTab("worklog")}
                className={`pb-4 text-[10px] font-black uppercase tracking-[0.2em] relative transition-all whitespace-nowrap ${activeTab === "worklog" ? "text-primary" : "text-gray-400"}`}
              >
                ログ
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`pb-4 text-[10px] font-black uppercase tracking-[0.2em] relative transition-all whitespace-nowrap ${activeTab === "history" ? "text-primary" : "text-gray-400"}`}
              >
                履歴
              </button>
            </div>

            {activeTab === "comments" && (
              <div className="space-y-8 animate-fadeIn">
                <div className="flex gap-4">
                  <Avatar userId={currentUserId} size="sm" />
                  <div className="flex-1 space-y-2">
                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="コメントを入力..."
                      className="w-full p-4 bg-gray-50/50 rounded-2xl text-xs font-medium outline-none border border-transparent focus:border-primary/20 focus:bg-white min-h-[80px]"
                    />
                    {commentText && (
                      <button
                        onClick={handlePostComment}
                        className="bg-primary text-white text-[10px] font-black uppercase px-4 py-2 rounded-xl shadow-lg float-right"
                      >
                        送信
                      </button>
                    )}
                  </div>
                </div>
                {issue.comments
                  ?.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                  .map((c) => (
                    <div key={c.id} className="flex gap-4 group">
                      <Avatar userId={c.authorId} size="sm" />
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] font-black text-secondary">
                            {USERS.find((u) => u.id === c.authorId)?.name}
                          </span>
                          <span className="text-[9px] font-bold text-gray-400">
                            {new Date(c.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-2xl rounded-tl-none">
                          {c.content}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {activeTab === "history" && (
              <div className="space-y-4 animate-fadeIn">
                {issue.history
                  ?.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                  .map((h) => (
                    <div key={h.id} className="flex gap-3 text-xs">
                      <div className="w-1.5 h-1.5 bg-blue-300 rounded-full mt-1.5 shrink-0" />
                      <div>
                        <span className="font-black text-secondary">
                          {USERS.find((u) => u.id === h.authorId)?.name}
                        </span>
                        <span className="text-gray-500 mx-2">が</span>
                        <span className="font-bold text-secondary uppercase tracking-tighter">
                          {h.field}
                        </span>
                        <span className="text-gray-400 line-through mx-1">
                          {String(h.from || "なし")}
                        </span>
                        <span className="text-gray-500 mx-2">→</span>
                        <span className="font-black text-primary">
                          {String(h.to)}
                        </span>
                        <div className="text-[9px] text-gray-300 mt-1 font-bold">
                          {new Date(h.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {activeTab === "worklog" && (
              <div className="space-y-4 animate-fadeIn">
                {issue.workLogs
                  ?.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                  .map((wl) => (
                    <div
                      key={wl.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar userId={wl.authorId} size="sm" />
                        <div>
                          <div className="text-xs font-bold text-secondary">
                            {(wl.timeSpentSeconds / 3600).toFixed(1)}h 記録
                          </div>
                          <div className="text-[10px] text-gray-400">
                            {wl.comment || "コメントなし"}
                          </div>
                        </div>
                      </div>
                      <div className="text-[9px] font-black text-gray-300 uppercase">
                        {new Date(wl.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                <button
                  onClick={() => setShowWorkLogModal(true)}
                  className="w-full p-4 border-2 border-dashed border-gray-100 rounded-2xl text-[10px] font-black text-gray-400 uppercase hover:text-primary hover:border-primary/20 transition-all"
                >
                  時間を記録
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Worklog Modal */}
        {showWorkLogModal && (
          <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6">
            <div className="bg-white w-full max-w-xs rounded-3xl shadow-2xl p-6 space-y-6 animate-slideUp">
              <h3 className="font-black text-secondary uppercase tracking-widest text-center">
                時間を記録
              </h3>
              <div className="space-y-4">
                <input
                  type="number"
                  value={workLogTime}
                  onChange={(e) => setWorkLogTime(e.target.value)}
                  placeholder="分数 (例: 60)"
                  className="w-full p-4 bg-gray-50 rounded-2xl outline-none border border-transparent focus:border-primary/20 font-bold"
                />
                <input
                  type="text"
                  value={workLogComment}
                  onChange={(e) => setWorkLogComment(e.target.value)}
                  placeholder="説明 (任意)"
                  className="w-full p-4 bg-gray-50 rounded-2xl outline-none border border-transparent focus:border-primary/20 font-bold"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowWorkLogModal(false)}
                  className="flex-1 p-4 bg-gray-100 text-gray-500 rounded-2xl font-bold"
                >
                  戻る
                </button>
                <button
                  onClick={handleLogWork}
                  className="flex-1 p-4 bg-primary text-white rounded-2xl font-bold"
                >
                  記録する
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
