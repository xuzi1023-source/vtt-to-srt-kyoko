import React from 'react';
import { CheckCircle, XCircle, FileText, Loader2, Download } from 'lucide-react';
import { SubtitleFile, FileStatus } from '../types';

interface FileListProps {
  files: SubtitleFile[];
  onRemove: (id: string) => void;
}

export const FileList: React.FC<FileListProps> = ({ files, onRemove }) => {
  if (files.length === 0) return null;

  return (
    <div className="w-full mt-8 bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden flex flex-col max-h-[500px]">
      <div className="px-6 py-4 border-b border-gray-800 bg-gray-900 flex justify-between items-center sticky top-0 z-10">
        <h3 className="font-semibold text-gray-300">File Queue ({files.length})</h3>
        <span className="text-xs text-gray-500">Scroll to see all</span>
      </div>
      
      <div className="overflow-y-auto flex-1 p-2 space-y-2 custom-scrollbar">
        {files.map((file) => (
          <div 
            key={file.id} 
            className="flex items-center justify-between p-3 rounded-lg bg-gray-800/40 hover:bg-gray-800 border border-transparent hover:border-gray-700 transition-all group"
          >
            <div className="flex items-center gap-4 overflow-hidden">
              <div className={`
                p-2 rounded-lg shrink-0
                ${file.status === FileStatus.COMPLETED ? 'bg-green-500/10 text-green-500' : ''}
                ${file.status === FileStatus.ERROR ? 'bg-red-500/10 text-red-500' : ''}
                ${file.status === FileStatus.PENDING ? 'bg-gray-700/50 text-gray-400' : ''}
                ${file.status === FileStatus.PROCESSING ? 'bg-indigo-500/10 text-indigo-400' : ''}
              `}>
                <FileText size={18} />
              </div>
              
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium text-gray-200 truncate pr-4" title={file.originalName}>
                  {file.originalName}
                </span>
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  {(file.size / 1024).toFixed(1)} KB &rarr; {file.newName}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              {file.status === FileStatus.PROCESSING && (
                <span className="flex items-center gap-2 text-xs text-indigo-400">
                  <Loader2 size={14} className="animate-spin" /> Converting
                </span>
              )}
              {file.status === FileStatus.COMPLETED && (
                <CheckCircle size={18} className="text-green-500" />
              )}
              {file.status === FileStatus.ERROR && (
                <span className="flex items-center gap-2 text-xs text-red-400" title={file.error}>
                  <XCircle size={18} /> Error
                </span>
              )}
              {file.status === FileStatus.COMPLETED && (
                 <button 
                  onClick={() => {
                     // Trigger single file download
                     const blob = new Blob([file.content || ''], { type: 'text/srt;charset=utf-8' });
                     const url = URL.createObjectURL(blob);
                     const a = document.createElement('a');
                     a.href = url;
                     a.download = file.newName;
                     a.click();
                     URL.revokeObjectURL(url);
                  }}
                  className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                  title="Download single file"
                 >
                   <Download size={16} />
                 </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};