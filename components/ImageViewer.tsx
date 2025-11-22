
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, Download, RotateCcw, Move } from 'lucide-react';

interface Props {
  url: string;
  title?: string;
  onClose: () => void;
}

const ImageViewer: React.FC<Props> = ({ url, title, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  
  // Refs for drag calculations to avoid closure staleness during event listeners
  const dragStartRef = useRef({ x: 0, y: 0 });
  const positionRef = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Enter animation
    requestAnimationFrame(() => setIsVisible(true));
    
    // Lock body scroll
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalStyle;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Match transition duration
  }, [onClose]);

  // --- Zoom Logic ---

  const updateScale = (newScale: number) => {
    const clamped = Math.min(Math.max(0.1, newScale), 8);
    setScale(clamped);
    // Reset position if zoomed out completely to keep it centered
    if (clamped <= 1) {
        setPosition({ x: 0, y: 0 });
        positionRef.current = { x: 0, y: 0 };
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation(); // Prevent parent scroll
    const delta = e.deltaY * -0.002;
    updateScale(scale + delta * scale);
  };

  const zoomIn = () => updateScale(scale * 1.2);
  const zoomOut = () => updateScale(scale / 1.2);
  const resetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    positionRef.current = { x: 0, y: 0 };
  };

  // --- Drag/Pan Logic ---

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only allow dragging if zoomed in slightly or if image is large
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - positionRef.current.x, y: e.clientY - positionRef.current.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const newX = e.clientX - dragStartRef.current.x;
    const newY = e.clientY - dragStartRef.current.y;
    
    setPosition({ x: newX, y: newY });
    positionRef.current = { x: newX, y: newY };
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div 
      className={`fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-md transition-opacity duration-300 flex flex-col ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      onClick={(e) => {
        // Close if clicking the background (not dragging)
        if (e.target === e.currentTarget && !isDragging) handleClose();
      }}
      onWheel={handleWheel}
    >
      {/* Top Toolbar */}
      <div className="absolute top-0 left-0 right-0 z-50 p-4 flex items-start justify-between bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
        <div className="pointer-events-auto">
           {title && (
             <div className="text-white/90 font-medium text-lg drop-shadow-md px-2">{title}</div>
           )}
        </div>
        <button 
          onClick={handleClose}
          className="pointer-events-auto p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all hover:rotate-90 backdrop-blur-sm"
          title="关闭 (Esc)"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Main Canvas */}
      <div 
        ref={containerRef}
        className={`flex-1 flex items-center justify-center overflow-hidden select-none ${scale > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div 
          className="will-change-transform transition-transform duration-75 ease-linear"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`
          }}
        >
          <img 
            src={url} 
            alt="View" 
            className="max-w-[90vw] max-h-[85vh] object-contain shadow-2xl pointer-events-none"
            draggable={false}
            onDoubleClick={resetZoom}
          />
        </div>
      </div>

      {/* Floating Control Bar */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 animate-fade-in-up">
        <div className="flex items-center gap-1 bg-black/40 backdrop-blur-xl border border-white/10 p-1.5 rounded-2xl shadow-2xl ring-1 ring-white/5">
          
          <button onClick={zoomOut} className="p-2.5 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors" title="缩小">
            <ZoomOut className="w-5 h-5" />
          </button>
          
          <div className="px-2 min-w-[60px] text-center">
            <span className="text-sm font-mono font-medium text-white/90 tabular-nums">
              {Math.round(scale * 100)}%
            </span>
          </div>

          <button onClick={zoomIn} className="p-2.5 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors" title="放大">
            <ZoomIn className="w-5 h-5" />
          </button>

          <div className="w-px h-5 bg-white/20 mx-1.5"></div>

          <button onClick={resetZoom} className="p-2.5 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors" title="重置视图">
            <RotateCcw className="w-5 h-5" />
          </button>

          <a 
            href={url} 
            download="image-export.png"
            className="p-2.5 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
            title="下载原图"
            onClick={(e) => e.stopPropagation()}
          >
            <Download className="w-5 h-5" />
          </a>

        </div>
      </div>

      {/* Hint for pan */}
      {scale > 1.2 && !isDragging && (
         <div className="absolute bottom-24 left-1/2 -translate-x-1/2 text-white/30 text-xs font-medium pointer-events-none animate-pulse">
            拖拽移动
         </div>
      )}
    </div>
  );
};

export default ImageViewer;
