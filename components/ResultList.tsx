
import React, { useState } from 'react';
import { ScanItem } from '../types';
import { Loader2, CheckCircle, Download, FileArchive, RefreshCw, ZoomIn, ArrowRight, AlertCircle } from 'lucide-react';
import ImageViewer from './ImageViewer';

interface Props {
  items: ScanItem[];
  onReset: () => void;
}

declare global {
  interface Window {
    JSZip: any;
    saveAs: any;
  }
}

const ResultList: React.FC<Props> = ({ items, onReset }) => {
  const [isZipping, setIsZipping] = useState(false);
  const [viewingUrl, setViewingUrl] = useState<{url: string, title: string} | null>(null);

  const activeItems = items.filter(i => i.status !== 'idle');

  if (activeItems.length === 0) return null;

  const isProcessing = activeItems.some(i => i.status === 'detecting' || i.status === 'cropping');
  const completedCount = activeItems.filter(i => i.status === 'cropped').length;
  const totalCount = activeItems.length;
  const progress = Math.round((completedCount / totalCount) * 100);

  const handleDownloadAll = async () => {
    setIsZipping(true);
    try {
      if (!window.JSZip) {
        alert("JSZip 库未加载。");
        return;
      }

      const zip = new window.JSZip();
      const folder = zip.folder("processed_scans");

      const promises = activeItems.filter(i => i.status === 'cropped').map(async (item) => {
        if (item.croppedUrl) {
          const response = await fetch(item.croppedUrl);
          const blob = await response.blob();
          const ext = item.name.split('.').pop() || 'jpg';
          const name = item.name.replace(`.${ext}`, `_processed.${ext}`);
          folder.file(name, blob);
        }
      });

      await Promise.all(promises);

      const content = await zip.generateAsync({ type: "blob" });
      if (window.saveAs) {
        window.saveAs(content, "batch_scans.zip");
      } else {
        const url = URL.createObjectURL(content);
        const a = document.createElement("a");
        a.href = url;
        a.download = "batch_scans.zip";
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      console.error(e);
      alert("打包失败");
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <section className="w-full max-w-6xl mx-auto space-y-6 animate-fade-in pt-4 border-t border-slate-200 pb-20">
      
      {/* Header & Status Bar */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200 sticky top-4 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 text-primary flex items-center justify-center font-bold text-sm">2</div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">智能处理结果 ({completedCount}/{totalCount})</h2>
          </div>
        </div>

        <div className="flex gap-3">
           {isProcessing ? (
             <div className="flex items-center gap-3 bg-blue-50 px-4 py-1.5 rounded-lg border border-blue-100">
                <Loader2 className="w-4 h-4 text-primary animate-spin" />
                <span className="text-sm font-medium text-primary">处理中... {progress}%</span>
             </div>
           ) : (
             <>
                <button
                    onClick={onReset}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all border border-transparent hover:border-slate-200 flex items-center gap-2"
                >
                    <RefreshCw className="w-3 h-3" />
                    重置
                </button>
                <button
                    onClick={handleDownloadAll}
                    disabled={completedCount === 0}
                    className="bg-primary hover:bg-blue-600 text-white text-sm font-medium px-4 py-1.5 rounded-lg shadow-sm flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                >
                    {isZipping ? <Loader2 className="w-3 h-3 animate-spin"/> : <FileArchive className="w-3 h-3" />}
                    批量下载
                </button>
             </>
           )}
        </div>
      </div>

      {/* Compact Comparison List */}
      <div className="grid grid-cols-1 gap-4">
        {activeItems.map((item) => (
          <ComparisonRow 
            key={item.id} 
            item={item} 
            onView={(url, title) => setViewingUrl({url, title})}
          />
        ))}
      </div>

      {viewingUrl && (
        <ImageViewer 
            url={viewingUrl.url} 
            title={viewingUrl.title}
            onClose={() => setViewingUrl(null)} 
        />
      )}

    </section>
  );
};

const ComparisonRow: React.FC<{ 
    item: ScanItem, 
    onView: (url: string, title: string) => void 
}> = ({ item, onView }) => {
  
  const getBoxStyle = () => {
    if (!item.boundingBox || !item.width || !item.height) return { display: 'none' };
    const { x, y, width, height } = item.boundingBox;
    return {
      left: `${(x / item.width) * 100}%`,
      top: `${(y / item.height) * 100}%`,
      width: `${(width / item.width) * 100}%`,
      height: `${(height / item.height) * 100}%`,
    };
  };

  const isReady = item.status === 'cropped';
  const isError = item.status === 'error';

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden flex flex-col md:flex-row h-[220px]">
        
        {/* File Info Sidebar - Compact */}
        <div className="md:w-40 p-3 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-200 flex flex-row md:flex-col justify-between gap-2 shrink-0">
            <div className="min-w-0">
                <h3 className="font-semibold text-slate-700 text-sm truncate" title={item.name}>{item.name}</h3>
                <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
                    {item.status === 'detecting' && <span className="text-blue-500">分析中...</span>}
                    {item.status === 'cropping' && <span className="text-purple-500">裁剪中...</span>}
                    {item.status === 'cropped' && <span className="text-green-600 font-medium flex items-center gap-1"><CheckCircle className="w-3 h-3"/> 已完成</span>}
                    {item.status === 'error' && <span className="text-red-500">失败</span>}
                </div>
            </div>
            
            {isReady && (
                 <a 
                   href={item.croppedUrl} 
                   download={`processed_${item.name}`}
                   className="text-[11px] flex items-center gap-1 text-slate-500 hover:text-primary hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                 >
                    <Download className="w-3 h-3" /> 下载结果
                 </a>
            )}
        </div>

        {/* Visual Area */}
        <div className="flex-1 flex relative overflow-hidden">
            
            {/* Left: Original + Boundary */}
            <div className="flex-1 relative bg-slate-100/50 border-r border-slate-100 group">
                
                <div className="w-full h-full p-2 flex items-center justify-center relative">
                    <div className="relative h-full max-w-full">
                        <img 
                            src={item.originalUrl} 
                            alt="Original" 
                            className="max-w-full max-h-full object-contain block mx-auto"
                        />
                        {(item.status === 'detected' || item.status === 'cropping' || item.status === 'cropped') && (
                            <div 
                                className="absolute border border-green-500 bg-green-500/20 z-20 cursor-pointer hover:bg-green-500/30 transition-colors"
                                style={getBoxStyle()}
                                onClick={() => onView(item.originalUrl, `${item.name} - 原始识别`)}
                            ></div>
                        )}
                        {item.status === 'detecting' && (
                             <div className="absolute inset-0 bg-blue-500/10 animate-pulse z-30"></div>
                        )}
                    </div>
                </div>

                <button 
                    onClick={() => onView(item.originalUrl, `${item.name} - 原始识别`)}
                    className="absolute bottom-2 right-2 p-1 bg-white/90 rounded shadow-sm text-slate-400 hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <ZoomIn className="w-3 h-3" />
                </button>
            </div>

            {/* Center Arrow */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 bg-white rounded-full p-1 shadow-sm border border-slate-100 text-slate-300">
                <ArrowRight className="w-3 h-3" />
            </div>

            {/* Right: Cropped Result */}
            <div className="flex-1 relative bg-[url('https://www.transparenttextures.com/patterns/checkerboard-light-gray.png')] group">
                <div className="w-full h-full p-2 flex items-center justify-center">
                    {item.status === 'cropped' && item.croppedUrl ? (
                        <img 
                            src={item.croppedUrl} 
                            alt="Result" 
                            className="max-w-full max-h-full object-contain shadow-sm cursor-pointer hover:scale-[1.02] transition-transform"
                            onClick={() => item.croppedUrl && onView(item.croppedUrl, `${item.name} - 裁剪结果`)}
                        />
                    ) : isError ? (
                        <div className="flex flex-col items-center text-red-400">
                            <AlertCircle className="w-6 h-6 mb-1" />
                            <span className="text-[10px]">失败</span>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center text-slate-300">
                            {item.status === 'cropping' ? (
                                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                            ) : (
                                <div className="w-8 h-12 border-2 border-dashed border-slate-200 rounded-sm"></div>
                            )}
                        </div>
                    )}
                </div>
                 
                {item.croppedUrl && (
                    <button 
                        onClick={() => item.croppedUrl && onView(item.croppedUrl, `${item.name} - 裁剪结果`)}
                        className="absolute bottom-2 right-2 p-1 bg-white/90 rounded shadow-sm text-slate-400 hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <ZoomIn className="w-3 h-3" />
                    </button>
                )}
            </div>

        </div>
    </div>
  );
};

export default ResultList;
