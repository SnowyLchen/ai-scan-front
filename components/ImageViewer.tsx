
import React, { useEffect, useState } from 'react';
import { X, ZoomIn, Download, Maximize2 } from 'lucide-react';

interface Props {
  url: string;
  title?: string;
  onClose: () => void;
}

const ImageViewer: React.FC<Props> = ({ url, title, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    setIsVisible(true);
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Wait for exit animation
  };

  return (
    <div 
      className={`fixed inset-0 z-[100] flex items-center justify-center transition-all duration-300 ${
        isVisible ? 'bg-slate-950/80 backdrop-blur-md' : 'bg-transparent opacity-0 pointer-events-none'
      }`}
      onClick={handleClose}
    >
      {/* Close Button - Floating Top Right */}
      <button 
        onClick={handleClose}
        className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all hover:rotate-90 z-50 group"
      >
        <X className="w-6 h-6 opacity-80 group-hover:opacity-100" />
      </button>

      {/* Main Content Container */}
      <div 
        className={`relative max-w-[90vw] max-h-[85vh] flex flex-col items-center transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1) ${
          isVisible ? 'scale-100 opacity-100 translate-y-0' : 'scale-90 opacity-0 translate-y-8'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Image Wrapper */}
        <div className="relative group rounded-xl overflow-hidden shadow-2xl shadow-black/50 ring-1 ring-white/10 bg-slate-900">
          <img 
            src={url} 
            alt={title || "Full view"} 
            className="max-w-full max-h-[80vh] object-contain block" 
          />
          
          {/* Hover Overlay for Title */}
          {title && (
            <div className="absolute top-0 inset-x-0 p-4 bg-gradient-to-b from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <p className="text-white/90 font-medium text-sm tracking-wide text-center">{title}</p>
            </div>
          )}
        </div>

        {/* Bottom Toolbar */}
        <div className="mt-6 flex items-center gap-4 bg-white/10 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 shadow-lg animate-fade-in-up" style={{animationDelay: '100ms'}}>
          <span className="text-white/60 text-xs font-medium uppercase tracking-wider border-r border-white/20 pr-4 mr-1">
            Preview Mode
          </span>
          
          <a 
            href={url}
            download={`image_export.png`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-2 text-white/80 hover:text-white hover:bg-white/10 px-3 py-1.5 rounded-lg transition-all text-sm font-medium"
            title="下载原图"
          >
            <Download className="w-4 h-4" />
            下载
          </a>

          <button
             onClick={(e) => {
               e.stopPropagation();
               window.open(url, '_blank');
             }}
             className="flex items-center gap-2 text-white/80 hover:text-white hover:bg-white/10 px-3 py-1.5 rounded-lg transition-all text-sm font-medium"
             title="在新标签页打开"
          >
             <Maximize2 className="w-4 h-4" />
             新窗口打开
          </button>
        </div>

      </div>
    </div>
  );
};

export default ImageViewer;
