/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, ChangeEvent, MouseEvent } from 'react';
import { Plus, Trash2, User, Check, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ModelItem } from '../types';
import ImageCropper from './ImageCropper';

interface ModelsProps {
  models: ModelItem[];
  onModelsChange: (models: ModelItem[]) => void;
  onSelectItem?: (model: ModelItem) => void;
  selectedItemId?: string | null;
}

export default function Models({ models, onModelsChange, onSelectItem, selectedItemId }: ModelsProps) {
  const [tempImage, setTempImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('請上傳圖片檔案！');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveModel = (croppedBase64: string) => {
    const newModel: ModelItem = {
      id: `model_${Date.now()}_${Math.random().toString(36).substring(4)}`,
      image: croppedBase64,
      createdAt: Date.now()
    };

    onModelsChange([newModel, ...models]);
    setTempImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDeleteModel = (id: string, e: MouseEvent) => {
    e.stopPropagation();
    if (confirm('確定要刪除此模特人像圖片嗎？')) {
      const updated = models.filter(item => item.id !== id);
      onModelsChange(updated);
    }
  };

  return (
    <div className="relative min-h-[60vh] max-w-6xl mx-auto px-4 py-8">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8 border-b border-stone-200 pb-6">
        <div>
          <h2 className="text-3xl font-serif text-stone-900 italic font-bold">模特人像 (Models)</h2>
          <p className="text-stone-500 text-xs mt-1">管理並預存您的人像照片，上傳後可精細拉取最適當的裁切比例，在虛擬試衣中重複套用。</p>
        </div>
      </div>

      {/* Grid displaying Models */}
      <AnimatePresence mode="wait">
        {models.length > 0 ? (
          <motion.div 
            key="grid"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6"
          >
            {models.map((model) => {
              const isSelected = selectedItemId === model.id;
              
              return (
                <div
                  key={model.id}
                  onClick={() => onSelectItem?.(model)}
                  className={`group relative aspect-[3/4] rounded-2xl overflow-hidden border bg-white shadow-sm transition-all duration-300 flex flex-col justify-between cursor-pointer
                    ${isSelected ? 'ring-4 ring-stone-800 border-transparent scale-[1.02]' : 'border-stone-200 hover:border-stone-400 hover:shadow-md'}
                  `}
                >
                  <div className="w-full h-full relative overflow-hidden bg-stone-50">
                    <img 
                      src={model.image} 
                      alt="Model item" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />

                    {/* Direct Delete button (always visible and highly mobile-friendly) */}
                    {!onSelectItem && (
                      <button
                        id={`delete-model-direct-${model.id}`}
                        onClick={(e) => handleDeleteModel(model.id, e)}
                        className="absolute top-3 right-3 p-1.5 rounded-full bg-white/95 backdrop-blur-sm text-rose-600 hover:text-rose-700 shadow-md hover:scale-110 active:scale-95 transition-all z-10 cursor-pointer"
                        title="刪除照片"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Left overlay when clicked to select */}
                    {isSelected && (
                      <div className="absolute inset-0 bg-stone-900/40 flex items-center justify-center p-3">
                        <div className="w-10 h-10 rounded-full bg-stone-800 text-white flex items-center justify-center shadow-lg animate-bounce animate-fade-in">
                          <Check className="w-5 h-5 stroke-[3]" />
                        </div>
                      </div>
                    )}

                    {/* Bottom controls overlay */}
                    {!onSelectItem && (
                      <div className="absolute inset-0 bg-stone-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
                        <button
                          id={`delete-model-${model.id}`}
                          onClick={(e) => handleDeleteModel(model.id, e)}
                          className="px-4 py-2 rounded-xl bg-white text-rose-600 font-bold text-xs tracking-wider uppercase transition-all shadow-xl hover:bg-rose-50 flex items-center gap-1.5 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>刪除此模特</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </motion.div>
        ) : (
          <motion.div 
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white rounded-3xl border border-dashed border-stone-200 shadow-sm"
          >
            <div className="w-16 h-16 rounded-full bg-stone-50 border border-stone-100 flex items-center justify-center mb-4 text-stone-300">
              <User className="w-8 h-8 stroke-[1.2]" />
            </div>
            <h3 className="text-stone-600 font-serif italic text-lg font-bold">即刻預備您的模特</h3>
            <p className="text-stone-400 text-xs mt-2 max-w-xs leading-relaxed uppercase">
              點擊右下角的「+」號上傳並裁切半身或全身的高畫質照片，做為 AI 試衣模特兒！
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FLOATING ACTION BUTTON (FAB) FOR UPLOAD */}
      {!onSelectItem && (
        <div className="fixed bottom-8 right-8 z-30">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
          />
          <button
            id="floating-model-upload"
            onClick={() => fileInputRef.current?.click()}
            className="w-16 h-16 rounded-full bg-stone-800 text-white shadow-2xl hover:bg-stone-900 active:scale-95 hover:scale-105 transition-all flex items-center justify-center group cursor-pointer"
            title="上傳圖片並裁剪為模特"
          >
            <Plus className="w-7 h-7 group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>
      )}

      {/* FULL CROP MODAL INTERACTIVE PORTAL */}
      <AnimatePresence>
        {tempImage && (
          <ImageCropper
            imageSrc={tempImage}
            onCancel={() => {
              setTempImage(null);
              if (fileInputRef.current) fileInputRef.current.value = '';
            }}
            onCropComplete={() => {}} // Handle inside saveButtons array override
            saveButtons={[
              {
                id: 'save-model-submit',
                label: '✨ 裁切並儲存為模特兒 (Save Model)',
                onClick: (cropped) => handleSaveModel(cropped),
                className: 'bg-emerald-600 text-white hover:bg-emerald-700 w-full sm:w-auto px-8'
              }
            ]}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
