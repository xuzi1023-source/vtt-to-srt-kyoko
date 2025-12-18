import React, { useState, useCallback } from 'react';
import JSZip from 'jszip';
import saveAs from 'file-saver';
import { Download, Trash2, Zap, AlertCircle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { DropArea } from './components/DropArea';
import { FileList } from './components/FileList';
import { SubtitleFile, FileStatus, ProcessingStats } from './types';
import { convertVttToSrt } from './utils/converter';

const App: React.FC = () => {
  const [files, setFiles] = useState<SubtitleFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stats, setStats] = useState<ProcessingStats>({
    total: 0,
    completed: 0,
    failed: 0,
    processing: false
  });

  const handleFilesSelected = useCallback(async (selectedFiles: File[]) => {
    setIsProcessing(true);
    
    // Create initial placeholder entries
    const newFileEntries: SubtitleFile[] = selectedFiles.map(file => ({
      id: uuidv4(),
      originalName: file.name,
      newName: file.name.replace(/\.vtt$/i, '.srt'),
      size: file.size,
      status: FileStatus.PENDING,
      content: null
    }));

    setFiles(prev => [...prev, ...newFileEntries]);
    
    // Process files
    // We use a functional update loop to process them without blocking the UI too much
    // For 100+ files, we process them in parallel but update state in chunks if necessary. 
    // Since text processing is fast, Promise.all is usually fine.
    
    const processedResults = await Promise.all(
      selectedFiles.map(async (file, index) => {
        try {
          const text = await file.text();
          const srtContent = convertVttToSrt(text);
          return {
             status: FileStatus.COMPLETED,
             content: srtContent,
             error: undefined
          };
        } catch (err) {
          return {
             status: FileStatus.ERROR,
             content: null,
             error: 'Failed to read or parse file'
          };
        }
      })
    );

    // Merge results back into state
    setFiles(prevFiles => {
      const updatedFiles = [...prevFiles];
      // We assume the order is preserved in Promise.all, so we match by index offset
      // from the end of the previous array
      const startIndex = updatedFiles.length - newFileEntries.length;
      
      processedResults.forEach((result, idx) => {
        const targetIndex = startIndex + idx;
        if (updatedFiles[targetIndex]) {
          updatedFiles[targetIndex] = {
            ...updatedFiles[targetIndex],
            status: result.status,
            content: result.content,
            error: result.error
          };
        }
      });
      return updatedFiles;
    });

    setIsProcessing(false);
  }, []);

  // Recalculate stats whenever files change
  React.useEffect(() => {
    const total = files.length;
    const completed = files.filter(f => f.status === FileStatus.COMPLETED).length;
    const failed = files.filter(f => f.status === FileStatus.ERROR).length;
    setStats({ total, completed, failed, processing: isProcessing });
  }, [files, isProcessing]);

  const handleDownloadAll = async () => {
    const completedFiles = files.filter(f => f.status === FileStatus.COMPLETED);
    if (completedFiles.length === 0) return;

    if (completedFiles.length === 1) {
        // Download single file directly
        const file = completedFiles[0];
        const blob = new Blob([file.content || ''], { type: 'text/srt;charset=utf-8' });
        saveAs(blob, file.newName);
        return;
    }

    // Download ZIP
    const zip = new JSZip();
    completedFiles.forEach(file => {
      if (file.content) {
        zip.file(file.newName, file.content);
      }
    });

    try {
      const blob = await zip.generateAsync({ type: 'blob' });
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
      saveAs(blob, `converted_subtitles_${timestamp}.zip`);
    } catch (error) {
      console.error("Failed to zip files", error);
      alert("Failed to generate ZIP file.");
    }
  };

  const handleClearAll = () => {
    if (window.confirm("Are you sure you want to clear the list?")) {
      setFiles([]);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-900 via-gray-900 to-black">
      <div className="w-full max-w-4xl space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-600/30">
              <Zap size={32} className="text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white">
            VTT to SRT Converter
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Batch convert your WebVTT subtitles to SubRip format instantly. 
            Secure, client-side, and supports massive bulk operations.
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-3xl p-6 sm:p-8 shadow-2xl">
          
          <DropArea onFilesSelected={handleFilesSelected} disabled={isProcessing} />

          {/* Action Bar */}
          {files.length > 0 && (
             <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-gray-900/60 rounded-xl border border-gray-700/50">
               <div className="flex items-center gap-4 text-sm">
                 <div className="flex flex-col">
                   <span className="text-gray-400">Total Files</span>
                   <span className="text-xl font-bold text-white">{stats.total}</span>
                 </div>
                 <div className="w-px h-8 bg-gray-700"></div>
                 <div className="flex flex-col">
                   <span className="text-gray-400">Success</span>
                   <span className="text-xl font-bold text-green-400">{stats.completed}</span>
                 </div>
               </div>

               <div className="flex gap-3 w-full sm:w-auto">
                 <button
                   onClick={handleClearAll}
                   className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors text-sm font-medium"
                 >
                   <Trash2 size={16} />
                   Clear
                 </button>
                 <button
                   onClick={handleDownloadAll}
                   disabled={stats.completed === 0}
                   className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-900/20 transition-all text-sm font-medium"
                 >
                   <Download size={16} />
                   {stats.completed > 1 ? 'Download ZIP' : 'Download SRT'}
                 </button>
               </div>
             </div>
          )}

          {/* Status Message */}
          {stats.failed > 0 && (
            <div className="mt-4 p-4 rounded-lg bg-red-900/20 border border-red-900/50 flex items-center gap-3 text-red-400 text-sm">
              <AlertCircle size={18} />
              <span>{stats.failed} file(s) failed to convert. Check format validity.</span>
            </div>
          )}

          <FileList files={files} onRemove={() => {}} />
          
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-600">
          Files are processed locally in your browser. No data is sent to any server.
        </p>
      </div>
    </div>
  );
};

export default App;