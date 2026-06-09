/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useRef, useState, ChangeEvent, DragEvent } from 'react';

interface ImageUploadProps {
  label: string;
  description: string;
  image: string | null;
  onImageChange: (base64: string | null) => void;
  disabled?: boolean;
  id: string;
}

export default function ImageUpload({ 
  label, 
  description, 
  image, 
  onImageChange, 
  disabled,
  id 
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      onImageChange(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const onDragOver = (e: DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 mb-2">{label}</label>
      <div
        id={id}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => !disabled && !image && fileInputRef.current?.click()}
        className={`relative aspect-[3/4] rounded-2xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center cursor-pointer overflow-hidden
          ${isDragging ? 'border-stone-800 bg-stone-50' : 'border-stone-200 hover:border-stone-400 bg-white'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
          disabled={disabled}
        />

        <AnimatePresence mode="wait">
          {image ? (
            <motion.div
              key="preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 group"
            >
              <img src={image} alt={label} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-stone-900/0 group-hover:bg-stone-900/20 transition-all duration-300" />
              {!disabled && (
                <button
                  id={`${id}-clear`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onImageChange(null);
                  }}
                  className="absolute top-4 right-4 p-2 rounded-full bg-white text-stone-900 shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 active:scale-95"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="placeholder"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center p-8 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-stone-50 flex items-center justify-center mb-6 text-stone-300 border border-stone-100">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-stone-600 tracking-tight">Click or drag image</p>
              <p className="text-[10px] text-stone-400 px-4 mt-2 leading-relaxed uppercase tracking-widest">{description}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
