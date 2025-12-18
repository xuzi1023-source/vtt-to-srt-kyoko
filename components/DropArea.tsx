import React, { useCallback, useState } from 'react';
import { UploadCloud, FileType } from 'lucide-react';

interface DropAreaProps {
  onFilesSelected: (files: File[]) => void;
  disabled: boolean;
}

export const DropArea: React.FC<DropAreaProps> = ({ onFilesSelected, disabled }) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragOver(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const vttFiles = Array.from(e.dataTransfer.files).filter(
        (file: File) => file.name.endsWith('.vtt') || file.type.includes('vtt')
      );
      
      if (vttFiles.length > 0) {
        onFilesSelected(vttFiles);
      } else {
        alert("Please drop valid .vtt files.");
      }
    }
  }, [onFilesSelected, disabled]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const vttFiles = Array.from(e.target.files); // Filter in parent if needed, usually input accept handles it visually
      onFilesSelected(vttFiles);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative w-full h-64 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all duration-300 ease-in-out cursor-pointer group
        ${disabled ? 'opacity-50 cursor-not-allowed border-gray-700 bg-gray-800/50' : 
          isDragOver 
            ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01] shadow-2xl shadow-indigo-500/20' 
            : 'border-gray-700 bg-gray-900/50 hover:border-gray-500 hover:bg-gray-800'
        }
      `}
    >
      <input
        type="file"
        multiple
        accept=".vtt"
        onChange={handleFileInput}
        disabled={disabled}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
      />
      
      <div className="z-10 flex flex-col items-center space-y-4 text-center p-4">
        <div className={`p-4 rounded-full transition-colors ${isDragOver ? 'bg-indigo-500 text-white' : 'bg-gray-800 text-gray-400 group-hover:bg-gray-700 group-hover:text-gray-200'}`}>
          <UploadCloud size={40} />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-200">
            {isDragOver ? 'Drop files here' : 'Drag & Drop VTT files'}
          </h3>
          <p className="text-sm text-gray-500 mt-2">
            or click to browse from your computer
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-600 font-medium px-3 py-1 rounded-full bg-gray-800/50 border border-gray-700/50">
          <FileType size={14} />
          <span>Supports multiple files (100+)</span>
        </div>
      </div>
    </div>
  );
};