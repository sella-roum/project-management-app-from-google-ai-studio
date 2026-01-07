import React, { useState } from "react";
import { CATEGORY_LABELS } from "@repo/core";
import { getProjects, toggleProjectStar } from "../services/mockData";
import { useNavigate } from "react-router-dom";
import { Star, MoreHorizontal } from "lucide-react";
import { CreateProjectModal } from "../components/Modals/CreateProjectModal";
import { useLiveQuery } from "dexie-react-hooks";
import { Project } from "../types";

export const Projects = () => {
  const projects = useLiveQuery(() => getProjects()) || [];
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  const handleStarClick = async (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    await toggleProjectStar(projectId);
  };

  const handleProjectCreated = (newProject: Project) => {
    setIsModalOpen(false);
    navigate(`/projects/${newProject.id}`);
  };

  // Sort: Starred first, then by name
  const sortedProjects = [...projects].sort((a, b) => {
    if (a.starred === b.starred) return a.name.localeCompare(b.name);
    return a.starred ? -1 : 1;
  });

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-secondary">プロジェクト</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-white px-4 py-2 rounded font-medium hover:bg-primaryHover transition-colors"
        >
          プロジェクト作成
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {sortedProjects.map((project) => (
          <div
            key={project.id}
            onClick={() => navigate(`/projects/${project.id}`)}
            className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-lg transition-shadow cursor-pointer group relative overflow-hidden"
          >
            <div
              className={`absolute top-0 left-0 w-1 h-full ${project.type === "Scrum" ? "bg-green-500" : "bg-blue-500"}`}
            />

            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center text-2xl shadow-sm">
                {project.iconUrl}
              </div>
              <button
                onClick={(e) => handleStarClick(e, project.id)}
                className={`transition-colors ${project.starred ? "text-yellow-400" : "text-gray-300 hover:text-yellow-400"}`}
              >
                <Star
                  size={20}
                  fill={project.starred ? "currentColor" : "none"}
                />
              </button>
            </div>

            <h2 className="text-lg font-bold text-gray-800 mb-1 group-hover:text-primary transition-colors">
              {project.name}
            </h2>
            <div className="text-sm text-gray-500 font-mono mb-4">
              {project.key} &bull; {project.type}
            </div>

            <p className="text-sm text-gray-600 line-clamp-2 mb-4 h-10">
              {project.description}
            </p>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                {CATEGORY_LABELS[project.category]}
              </span>
              <MoreHorizontal size={16} className="text-gray-400" />
            </div>
          </div>
        ))}
      </div>

      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={handleProjectCreated}
      />
    </div>
  );
};
