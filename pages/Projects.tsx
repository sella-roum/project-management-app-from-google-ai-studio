import React from 'react';
import { getProjects } from '../services/mockData';
import { useNavigate } from 'react-router-dom';
import { Star, MoreHorizontal, Folder } from 'lucide-react';

export const Projects = () => {
  const projects = getProjects();
  const navigate = useNavigate();

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-secondary">Projects</h1>
        <button className="bg-primary text-white px-4 py-2 rounded font-medium hover:bg-primaryHover transition-colors">
          Create Project
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {projects.map(project => (
          <div 
            key={project.id}
            onClick={() => navigate(`/projects/${project.id}`)}
            className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-lg transition-shadow cursor-pointer group relative overflow-hidden"
          >
            <div className={`absolute top-0 left-0 w-1 h-full ${project.type === 'Scrum' ? 'bg-green-500' : 'bg-blue-500'}`} />
            
            <div className="flex justify-between items-start mb-4">
               <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center text-2xl shadow-sm">
                  {project.iconUrl}
               </div>
               <button className="text-gray-400 hover:text-yellow-400 transition-colors">
                 <Star size={20} />
               </button>
            </div>
            
            <h2 className="text-lg font-bold text-gray-800 mb-1 group-hover:text-primary transition-colors">
              {project.name}
            </h2>
            <div className="text-sm text-gray-500 font-mono mb-4">{project.key} &bull; {project.type}</div>
            
            <p className="text-sm text-gray-600 line-clamp-2 mb-4 h-10">
              {project.description}
            </p>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
               <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                 {project.category}
               </span>
               <MoreHorizontal size={16} className="text-gray-400" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
