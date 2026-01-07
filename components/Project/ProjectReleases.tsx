import React from 'react';
import { Project, Issue, Version } from '../../types';
import { getVersions } from '../../services/mockData';
import { Truck, CheckCircle, Calendar } from 'lucide-react';

interface Props {
  project: Project;
  issues: Issue[];
}

export const ProjectReleases: React.FC<Props> = ({ project, issues }) => {
  const versions = getVersions(project.id);

  if (versions.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <Truck size={48} className="mx-auto mb-4 text-gray-300" />
        <p>リリースバージョンはまだ作成されていません。</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 pb-24">
      {versions.map(version => {
        const versionIssues = issues.filter(i => i.fixVersionId === version.id);
        const doneIssues = versionIssues.filter(i => i.status === 'Done');
        const progress = versionIssues.length > 0 
          ? Math.round((doneIssues.length / versionIssues.length) * 100) 
          : 0;
        
        const isReleased = version.status === 'released';

        return (
          <div key={version.id} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  {version.name}
                  {isReleased && <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">リリース済</span>}
                </h3>
                {version.description && <p className="text-sm text-gray-500 mt-1">{version.description}</p>}
              </div>
              <div className="text-right">
                 {version.releaseDate && (
                   <div className="text-xs text-gray-500 flex items-center gap-1 justify-end">
                     <Calendar size={12} />
                     {new Date(version.releaseDate).toLocaleDateString()}
                   </div>
                 )}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>進捗</span>
                <span>{doneIssues.length} / {versionIssues.length} 課題</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div 
                  className={`h-2.5 rounded-full ${isReleased ? 'bg-green-500' : 'bg-blue-600'}`} 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>

            {/* Status counts */}
            <div className="mt-3 flex gap-4">
               <div className="flex items-center gap-1 text-xs text-gray-600">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span>完了 {doneIssues.length}</span>
               </div>
               <div className="flex items-center gap-1 text-xs text-gray-600">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span>未完了 {versionIssues.length - doneIssues.length}</span>
               </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
