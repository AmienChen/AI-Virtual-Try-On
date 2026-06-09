/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect, MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent } from 'react';
import { X, Crop, Move, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface ImageCropperProps {
  imageSrc: string;
  onCropComplete: (croppedBase64: string, category?: string) => void;
  onCancel: () => void;
  saveButtons: {
    label: string;
    id: string;
    onClick: (croppedBase64: string) => void;
    className?: string;
  }[];
}

export default function ImageCropper({ imageSrc, onCropComplete, onCancel, saveButtons }: ImageCropperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  
  // Crop area represented as percentages (0 to 100)
  const [crop, setCrop] = useState({ x: 15, y: 15, w: 70, h: 70 });
  const [isProcessing, setIsProcessing] = useState(false);
  const dragStartRef = useRef<{
    activeHandle: string | null;
    startX: number;
    startY: number;
    startCrop: { x: number; y: number; w: number; h: number };
  }>({
    activeHandle: null,
    startX: 0,
    startY: 0,
    startCrop: { x: 0, y: 0, w: 0, h: 0 }
  });

  // Handle Dragging
  const handleStart = (clientX: number, clientY: number, handle: string) => {
    if (!containerRef.current) return;
    
    dragStartRef.current = {
      activeHandle: handle,
      startX: clientX,
      startY: clientY,
      startCrop: { ...crop }
    };
    
    document.body.style.userSelect = 'none';
  };

  const handleMove = (clientX: number, clientY: number) => {
    const drag = dragStartRef.current;
    if (!drag.activeHandle || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const deltaX = ((clientX - drag.startX) / rect.width) * 100;
    const deltaY = ((clientY - drag.startY) / rect.height) * 100;

    let newCrop = { ...drag.startCrop };

    if (drag.activeHandle === 'move') {
      newCrop.x = Math.max(0, Math.min(100 - newCrop.w, drag.startCrop.x + deltaX));
      newCrop.y = Math.max(0, Math.min(100 - newCrop.h, drag.startCrop.y + deltaY));
    } else {
      // Corner dragging calculations
      const minSize = 10; // min 10% size
      
      if (drag.activeHandle.includes('t')) {
        const bottomY = drag.startCrop.y + drag.startCrop.h;
        const proposedY = Math.max(0, drag.startCrop.y + deltaY);
        if (bottomY - proposedY >= minSize) {
          newCrop.y = proposedY;
          newCrop.h = bottomY - proposedY;
        }
      }
      if (drag.activeHandle.includes('b')) {
        const proposedH = Math.min(100 - drag.startCrop.y, drag.startCrop.h + deltaY);
        if (proposedH >= minSize) {
          newCrop.h = proposedH;
        }
      }
      if (drag.activeHandle.includes('l')) {
        const rightX = drag.startCrop.x + drag.startCrop.w;
        const proposedX = Math.max(0, drag.startCrop.x + deltaX);
        if (rightX - proposedX >= minSize) {
          newCrop.x = proposedX;
          newCrop.w = rightX - proposedX;
        }
      }
      if (drag.activeHandle.includes('r')) {
        const proposedW = Math.min(100 - drag.startCrop.x, drag.startCrop.w + deltaX);
        if (proposedW >= minSize) {
          newCrop.w = proposedW;
        }
      }
    }

    setCrop(newCrop);
  };

  const handleEnd = () => {
    dragStartRef.current.activeHandle = null;
    document.body.style.userSelect = '';
  };

  useEffect(() => {
    const onGlobalMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX, e.clientY);
    };

    const onGlobalTouchMove = (e: TouchEvent) => {
      if (e.touches && e.touches[0]) {
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const onGlobalEnd = () => {
      handleEnd();
    };

    window.addEventListener('mousemove', onGlobalMouseMove);
    window.addEventListener('mouseup', onGlobalEnd);
    window.addEventListener('touchmove', onGlobalTouchMove, { passive: false });
    window.addEventListener('touchend', onGlobalEnd);

    return () => {
      window.removeEventListener('mousemove', onGlobalMouseMove);
      window.removeEventListener('mouseup', onGlobalEnd);
      window.removeEventListener('touchmove', onGlobalTouchMove);
      window.removeEventListener('touchend', onGlobalEnd);
    };
  }, [crop]);

  // Execute actual cropping on Canvas
  const executeCrop = (callback: (base64: string) => void) => {
    if (!imageRef.current) return;
    setIsProcessing(true);

    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not get 2d canvas context');

        // Calculate actual pixel offsets based on image natural resolutions
        const cropX = (crop.x / 100) * img.naturalWidth;
        const cropY = (crop.y / 100) * img.naturalHeight;
        const cropW = (crop.w / 100) * img.naturalWidth;
        const cropH = (crop.h / 100) * img.naturalHeight;

        canvas.width = cropW;
        canvas.height = cropH;

        // Draw cropped section to canvas
        ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

        // Export cropped product
        const base64 = canvas.toDataURL('image/png');
        callback(base64);
      } catch (err) {
        console.error('Failed to crop image:', err);
      } finally {
        setIsProcessing(false);
      }
    };
    img.onerror = () => {
      setIsProcessing(false);
    };
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-[2rem] shadow-2xl border border-stone-200 w-full max-w-3xl my-auto overflow-hidden flex flex-col max-h-[92vh] sm:max-h-none"
        id="cropper-modal"
      >
        {/* Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crop className="w-5 h-5 text-stone-700 animate-pulse" />
            <h3 className="font-serif italic text-base sm:text-lg text-stone-900 font-bold">手動調整裁切範圍</h3>
          </div>
          <button 
            id="cancel-crop-btn"
            onClick={onCancel}
            className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cropping Stage */}
        <div className="p-4 sm:p-6 flex-grow flex items-center justify-center bg-stone-50 overflow-auto min-h-[220px] sm:min-h-[360px] max-h-[50vh] sm:max-h-[60vh] md:max-h-[65vh]">
          <div 
            ref={containerRef}
            className="relative select-none shadow-md overflow-hidden max-w-full max-h-[45vh] sm:max-h-[55vh] md:max-h-[60vh] bg-stone-200"
          >
            {/* The Image */}
            <img 
              ref={imageRef}
              src={imageSrc} 
              alt="To Crop" 
              className="max-w-full max-h-[45vh] sm:max-h-[55vh] md:max-h-[60vh] object-contain block pointer-events-none"
            />

            {/* Shaded mask over crop boundary */}
            <div className="absolute inset-0 bg-black/40 pointer-events-none" />

            {/* Clear active cropping area */}
            <div 
              className="absolute border-2 border-white shadow-[0_0_0_1000px_rgba(0,0,0,0.4)] cursor-move flex items-center justify-center"
              style={{
                left: `${crop.x}%`,
                top: `${crop.y}%`,
                width: `${crop.w}%`,
                height: `${crop.h}%`,
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
                handleStart(e.clientX, e.clientY, 'move');
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
                if (e.touches[0]) handleStart(e.touches[0].clientX, e.touches[0].clientY, 'move');
              }}
            >
              {/* Subtle grid lining inside workspace */}
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-20 pointer-events-none">
                <div className="border-r border-b border-white"></div>
                <div className="border-r border-b border-white"></div>
                <div className="border-b border-white"></div>
                <div className="border-r border-b border-white"></div>
                <div className="border-r border-b border-white"></div>
                <div className="border-b border-white"></div>
                <div className="border-r border-white"></div>
                <div className="border-r border-white"></div>
                <div></div>
              </div>

              {/* Move Indicator Icon overlay */}
              <div className="p-1.5 bg-black/60 backdrop-blur-sm rounded-lg text-white pointer-events-none opacity-80 scale-75">
                <Move className="w-4 h-4" />
              </div>

              {/* Drag Handles Corners */}
              {/* Top-Left */}
              <div 
                className="absolute top-0 left-0 w-5 h-5 -translate-x-1.5 -translate-y-1.5 flex items-center justify-center cursor-nwse-resize group"
                onMouseDown={(e) => { e.stopPropagation(); handleStart(e.clientX, e.clientY, 'tl'); }}
                onTouchStart={(e) => { e.stopPropagation(); if (e.touches[0]) handleStart(e.touches[0].clientX, e.touches[0].clientY, 'tl'); }}
              >
                <div className="w-3.5 h-3.5 bg-white border border-stone-800 rounded-sm shadow-md" />
              </div>

              {/* Top-Right */}
              <div 
                className="absolute top-0 right-0 w-5 h-5 translate-x-1.5 -translate-y-1.5 flex items-center justify-center cursor-nesw-resize"
                onMouseDown={(e) => { e.stopPropagation(); handleStart(e.clientX, e.clientY, 'tr'); }}
                onTouchStart={(e) => { e.stopPropagation(); if (e.touches[0]) handleStart(e.touches[0].clientX, e.touches[0].clientY, 'tr'); }}
              >
                <div className="w-3.5 h-3.5 bg-white border border-stone-800 rounded-sm shadow-md" />
              </div>

              {/* Bottom-Left */}
              <div 
                className="absolute bottom-0 left-0 w-5 h-5 -translate-x-1.5 translate-y-1.5 flex items-center justify-center cursor-nesw-resize"
                onMouseDown={(e) => { e.stopPropagation(); handleStart(e.clientX, e.clientY, 'bl'); }}
                onTouchStart={(e) => { e.stopPropagation(); if (e.touches[0]) handleStart(e.touches[0].clientX, e.touches[0].clientY, 'bl'); }}
              >
                <div className="w-3.5 h-3.5 bg-white border border-stone-800 rounded-sm shadow-md" />
              </div>

              {/* Bottom-Right */}
              <div 
                className="absolute bottom-0 right-0 w-5 h-5 translate-x-1.5 translate-y-1.5 flex items-center justify-center cursor-nwse-resize"
                onMouseDown={(e) => { e.stopPropagation(); handleStart(e.clientX, e.clientY, 'br'); }}
                onTouchStart={(e) => { e.stopPropagation(); if (e.touches[0]) handleStart(e.touches[0].clientX, e.touches[0].clientY, 'br'); }}
              >
                <div className="w-3.5 h-3.5 bg-white border border-stone-800 rounded-sm shadow-md" />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Category Options/Actions */}
        <div className="px-4 sm:px-6 py-4 sm:py-6 border-t border-stone-100 bg-stone-50 flex flex-col gap-3 sm:gap-4">
          <p className="text-stone-500 text-[10px] sm:text-xs font-medium text-center leading-tight">
            請手動拖曳四個角角，或移動整塊透亮框選取範圍。完成後，點擊下方合適按鈕保存：
          </p>
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-center gap-2 sm:gap-3">
            {saveButtons.map((btn) => (
              <button
                key={btn.id}
                id={btn.id}
                disabled={isProcessing}
                onClick={() => executeCrop(btn.onClick)}
                className={`py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl font-bold text-[10px] sm:text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 sm:gap-2 select-none cursor-pointer text-center break-words
                  ${btn.className || 'bg-stone-800 text-white hover:bg-stone-900'} 
                  ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}
                `}
              >
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>{btn.label}</span>
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
