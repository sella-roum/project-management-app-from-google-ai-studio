import React, { useState } from "react";
import { Project, Issue } from "../../types";
import { getVersions, createVersion } from "@repo/storage";
import { Truck, CheckCircle, Calendar, Plus, X } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";

interface Props {
  project: Project;
  issues: Issue[];
}

export const ProjectReleases: React.FC<Props> = ({ project, issues }) => {
  const versions =
    useLiveQuery(() => getVersions(project.id), [project.id]) || [];
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDate, setNewDate] = useState("");

  const handleCreate = async () => {
    if (!newName) return;
    let releaseDate: string | undefined;
    if (newDate) {
      const parsedDate = new Date(newDate);
      if (Number.isNaN(parsedDate.getTime())) {
        alert("YYYY-MM-DD 形式で入力してください。");
        return;
      }
      releaseDate = parsedDate.toISOString();
    }
    await createVersion({
      projectId: project.id,
      name: newName,
      releaseDate,
    });
    setNewName("");
    setNewDate("");
    setShowCreate(false);
  };

  return (
    <div className="p-4 space-y-4 pb-24 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-800">
          リリース (バージョン)
        </h2>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-primary text-white p-2 rounded-full shadow-lg hover:scale-110 transition-transform"
        >
          <Plus size={20} />
        </button>
      </div>

      {showCreate && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 animate-fadeIn space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-bold text-blue-800">
              新規バージョン
            </span>
            <button onClick={() => setShowCreate(false)}>
              <X size={16} />
            </button>
          </div>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="バージョン名 (例: v1.1.0)"
            className="w-full p-2 bg-white border border-gray-300 rounded text-sm focus:ring-2 focus:ring-primary outline-none"
          />
          <input
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            className="w-full p-2 bg-white border border-gray-300 rounded text-sm outline-none"
          />
          <button
            onClick={handleCreate}
            className="w-full bg-primary text-white py-2 rounded text-sm font-bold"
          >
            作成
          </button>
        </div>
      )}

      {versions.length === 0 ? (
        <div className="p-12 text-center text-gray-500 bg-white rounded-lg border border-dashed border-gray-300">
          <Truck size={48} className="mx-auto mb-4 text-gray-200" />
          <p className="text-sm">リリースバージョンはまだありません。</p>
        </div>
      ) : (
        versions
          .sort(
            (a, b) =>
              new Date(b.releaseDate || 0).getTime() -
              new Date(a.releaseDate || 0).getTime(),
          )
          .map((version) => {
            const versionIssues = issues.filter(
              (i) => i.fixVersionId === version.id,
            );
            const doneIssues = versionIssues.filter((i) => i.status === "Done");
            const progress =
              versionIssues.length > 0
                ? Math.round((doneIssues.length / versionIssues.length) * 100)
                : 0;
            return (
              <div
                key={version.id}
                className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                      {version.name}
                      {version.status === "released" && (
                        <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full uppercase font-bold">
                          Released
                        </span>
                      )}
                    </h3>
                    {version.releaseDate && (
                      <div className="text-[10px] text-gray-500 flex items-center gap-1 mt-1">
                        <Calendar size={10} />{" "}
                        {new Date(version.releaseDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                    <span>進捗 {progress}%</span>
                    <span>
                      {doneIssues.length} / {versionIssues.length} 完了
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className="bg-primary h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })
      )}
    </div>
  );
};
