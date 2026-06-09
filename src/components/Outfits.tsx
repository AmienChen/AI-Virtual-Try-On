/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MouseEvent } from 'react';
import { Trash2, Sparkles, Download, Check, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { OutfitItem } from '../types';

interface OutfitsProps {
  outfits: OutfitItem[];
  onOutfitsChange: (outfits: OutfitItem[]) => void;
  onSelectItem?: (outfit: OutfitItem) => void;
  selectedItemId?: string | null;
}

export default function Outfits({ outfits, onOutfitsChange, onSelectItem, selectedItemId }: OutfitsProps) {
  const handleDeleteOutfit = (id: string, e: MouseEvent) => {
    e.stopPropagation();
    if (confirm('確定要自「我的穿搭」中刪除此張穿搭照片嗎？')) {
      const updated = outfits.filter(o => o.id !== id);
      onOutfitsChange(updated);
    }
  };

  const handleDownload = (image: string, id: string, e: MouseEvent) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = image;
    link.download = `fit-outfit-${id}.png`;
    link.click();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 min-h-[60vh]">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8 border-b border-stone-200 pb-6">
        <div>
          <h2 className="text-3xl font-serif text-stone-900 italic font-bold">我的經典穿搭 (My Outfits)</h2>
          <p className="text-stone-500 text-xs mt-1">保存您進行 AI 虛擬試穿後最滿意的效果，亦可選擇已試穿之照片再繼續試搭其他衣物。</p>
        </div>
      </div>

      {/* Grid displaying outfits */}
      <AnimatePresence mode="wait">
        {outfits.length > 0 ? (
          <motion.div 
            key="grid"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6"
          >
            {outfits.map((outfit) => {
              const isSelected = selectedItemId === outfit.id;
              
              return (
                <div
                  key={outfit.id}
                  onClick={() => onSelectItem?.(outfit)}
                  className={`group relative aspect-[3/4] rounded-2xl overflow-hidden border bg-white shadow-sm transition-all duration-300 flex flex-col justify-between cursor-pointer
                    ${isSelected ? 'ring-4 ring-stone-800 border-transparent scale-[1.02]' : 'border-stone-200 hover:border-stone-400 hover:shadow-md'}
                  `}
                >
                  <div className="w-full h-full relative overflow-hidden bg-stone-50">
                    <img 
                      src={outfit.image} 
                      alt="My Outfit" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />

                    {/* Direct Download button (always visible and highly mobile-friendly) */}
                    {!onSelectItem && (
                      <button
                        id={`download-outfit-direct-${outfit.id}`}
                        onClick={(e) => handleDownload(outfit.image, outfit.id, e)}
                        className="absolute top-3 left-3 p-1.5 rounded-full bg-white/95 backdrop-blur-sm text-stone-700 hover:text-stone-900 shadow-md hover:scale-110 active:scale-95 transition-all z-10 cursor-pointer"
                        title="下載穿搭"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Direct Delete button (always visible and highly mobile-friendly) */}
                    {!onSelectItem && (
                      <button
                        id={`delete-outfit-direct-${outfit.id}`}
                        onClick={(e) => handleDeleteOutfit(outfit.id, e)}
                        className="absolute top-3 right-3 p-1.5 rounded-full bg-white/95 backdrop-blur-sm text-rose-600 hover:text-rose-700 shadow-md hover:scale-110 active:scale-95 transition-all z-10 cursor-pointer"
                        title="刪除穿搭"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Checkbox item select check */}
                    {isSelected && (
                      <div className="absolute inset-0 bg-stone-900/40 flex items-center justify-center p-3 animate-fade-in z-20">
                        <div className="w-10 h-10 rounded-full bg-stone-800 text-white flex items-center justify-center shadow-lg animate-bounce">
                          <Check className="w-5 h-5 stroke-[3]" />
                        </div>
                      </div>
                    )}

                    {/* Hover controls info bar overlay */}
                    <div className="absolute inset-0 bg-stone-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4 gap-2">
                      <div className="flex items-center gap-1.5 justify-center">
                        <button
                          id={`download-outfit-${outfit.id}`}
                          onClick={(e) => handleDownload(outfit.image, outfit.id, e)}
                          className="flex-grow py-2 rounded-xl bg-white text-stone-900 font-bold text-[10px] tracking-wider uppercase transition-all shadow-md hover:bg-stone-50 flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Download className="w-3 h-3" />
                          <span>下載</span>
                        </button>
                        <button
                          id={`delete-outfit-${outfit.id}`}
                          onClick={(e) => handleDeleteOutfit(outfit.id, e)}
                          className="p-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition-all shadow-md flex items-center justify-center cursor-pointer"
                          title="刪除穿搭"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
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
              <Sparkles className="w-8 h-8 stroke-[1.2]" />
            </div>
            <h3 className="text-stone-600 font-serif italic text-lg font-bold">一鍵保存完美穿搭</h3>
            <p className="text-stone-400 text-xs mt-2 max-w-xs leading-relaxed uppercase">
              在「虛擬穿衣」點擊生成後，可以點選「儲存此穿搭」即可在此收藏並在之後用於疊加試衣！
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
