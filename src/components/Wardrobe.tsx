/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect, ChangeEvent, MouseEvent } from 'react';
import { Plus, Trash2, Shirt, Grid, Sparkles, Filter, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { WardrobeItem, WardrobeCategory } from '../types';
import ImageCropper from './ImageCropper';

interface WardrobeProps {
  items: WardrobeItem[];
  onItemsChange: (items: WardrobeItem[]) => void;
  // Callback when user is triggered from Try-On screen to select an item
  onSelectItem?: (item: WardrobeItem) => void;
  selectedItemId?: string | null;
}

export default function Wardrobe({ items, onItemsChange, onSelectItem, selectedItemId }: WardrobeProps) {
  const [activeFilter, setActiveFilter] = useState<'all' | WardrobeCategory>('all');
  const [tempImage, setTempImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories: { key: WardrobeCategory; label: string; icon: string }[] = [
    { key: 'tops', label: '上衣 (Tops)', icon: '👕' },
    { key: 'bottoms', label: '下身 (Bottoms)', icon: '👖' },
    { key: 'fullbody', label: '全身 (Full-body)', icon: '👗' },
    { key: 'others', label: '其他 (Others)', icon: '💼' }
  ];

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

  const handleSaveToCategory = (croppedBase64: string, category: WardrobeCategory) => {
    const newItem: WardrobeItem = {
      id: `garment_${Date.now()}_${Math.random().toString(36).substring(4)}`,
      category,
      image: croppedBase64,
      createdAt: Date.now()
    };
    
    const updated = [newItem, ...items];
    onItemsChange(updated);
    setTempImage(null); // Close cropper
    if (fileInputRef.current) fileInputRef.current.value = '';
    
    // Auto shift filter to the saved category so the user sees their newly added item immediately!
    setActiveFilter(category);
  };

  const handleDeleteItem = (id: string, e: MouseEvent) => {
    e.stopPropagation();
    if (confirm('確定要從衣櫃中刪除此衣物圖片嗎？')) {
      const updated = items.filter(item => item.id !== id);
      onItemsChange(updated);
    }
  };

  const filteredItems = activeFilter === 'all' 
    ? items 
    : items.filter(item => item.category === activeFilter);

  return (
    <div className="relative min-h-[60vh] max-w-6xl mx-auto px-4 py-8">
      {/* Category Navigation filter tabs */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8 border-b border-stone-200 pb-6">
        <div>
          <h2 className="text-3xl font-serif text-stone-900 italic font-bold">我的專屬衣櫃 (My Wardrobe)</h2>
          <p className="text-stone-500 text-xs mt-1">管理您所上傳並完美裁切的各式衣服，可在 AI 虛擬穿衣中直接套用。</p>
        </div>
        
        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-2 bg-stone-100 p-1.5 rounded-2xl border border-stone-200/50">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wider transition-all cursor-pointer ${
              activeFilter === 'all' 
                ? 'bg-stone-800 text-white shadow-md' 
                : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            全部顯示
          </button>
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveFilter(cat.key)}
              className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                activeFilter === cat.key 
                  ? 'bg-stone-800 text-white shadow-md' 
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Grid displaying Wardrobe garments */}
      <AnimatePresence mode="wait">
        {filteredItems.length > 0 ? (
          <motion.div 
            key="grid"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6"
          >
            {filteredItems.map((item) => {
              const matchedCat = categories.find(c => c.key === item.category);
              const isSelected = selectedItemId === item.id;
              
              return (
                <div
                  key={item.id}
                  onClick={() => onSelectItem?.(item)}
                  className={`group relative aspect-[3/4] rounded-2xl overflow-hidden border bg-white shadow-sm transition-all duration-300 flex flex-col justify-between cursor-pointer
                    ${isSelected ? 'ring-4 ring-stone-800 border-transparent scale-[1.02]' : 'border-stone-200 hover:border-stone-400 hover:shadow-md'}
                  `}
                >
                  <div className="w-full h-full relative overflow-hidden bg-stone-50">
                    <img 
                      src={item.image} 
                      alt="Wardrobe Piece" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                    
                    {/* Upper Category Ribbon badge */}
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-[2px] text-[9px] font-bold text-white tracking-widest uppercase z-10">
                      {matchedCat ? `${matchedCat.icon} ${matchedCat.label.split(' ')[0]}` : '其他'}
                    </span>

                    {/* Direct Delete button (always visible and highly mobile-friendly) */}
                    {!onSelectItem && (
                      <button
                        id={`delete-garment-direct-${item.id}`}
                        onClick={(e) => handleDeleteItem(item.id, e)}
                        className="absolute top-3 right-3 p-1.5 rounded-full bg-white/95 backdrop-blur-sm text-rose-600 hover:text-rose-700 shadow-md hover:scale-110 active:scale-95 transition-all z-10 cursor-pointer"
                        title="刪除照片"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Left overlay when clicked to select */}
                    {isSelected && (
                      <div className="absolute inset-0 bg-stone-900/40 flex items-center justify-center p-3">
                        <div className="w-10 h-10 rounded-full bg-stone-800 text-white flex items-center justify-center shadow-lg animate-bounce">
                          <Check className="w-5 h-5 stroke-[3]" />
                        </div>
                      </div>
                    )}

                    {/* Bottom controls overlay */}
                    {!onSelectItem && (
                      <div className="absolute inset-0 bg-stone-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
                        <button
                          id={`delete-garment-${item.id}`}
                          onClick={(e) => handleDeleteItem(item.id, e)}
                          className="px-4 py-2 rounded-xl bg-white text-rose-600 font-bold text-xs tracking-wider uppercase transition-all shadow-xl hover:bg-rose-50 flex items-center gap-1.5 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>刪除此衣物</span>
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
              <Shirt className="w-8 h-8 stroke-[1.2]" />
            </div>
            <h3 className="text-stone-600 font-serif italic text-lg font-bold">衣櫃空空如也</h3>
            <p className="text-stone-400 text-xs mt-2 max-w-xs leading-relaxed uppercase">
              點擊右下角的「+」號上傳並手動裁切，將您的衣服儲存到合適的類別吧！
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
            id="floating-wardrobe-upload"
            onClick={() => fileInputRef.current?.click()}
            className="w-16 h-16 rounded-full bg-stone-800 text-white shadow-2xl hover:bg-stone-900 active:scale-95 hover:scale-105 transition-all flex items-center justify-center group cursor-pointer"
            title="上傳圖片裁切儲存至衣櫃"
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
            onCropComplete={() => {}} // We override with custom saveButtons behavior
            saveButtons={[
              {
                id: 'save-cat-tops',
                label: '👕 儲存為 上衣',
                onClick: (cropped) => handleSaveToCategory(cropped, 'tops'),
                className: 'bg-emerald-600 text-white hover:bg-emerald-700'
              },
              {
                id: 'save-cat-bottoms',
                label: '👖 儲存為 下身',
                onClick: (cropped) => handleSaveToCategory(cropped, 'bottoms'),
                className: 'bg-indigo-600 text-white hover:bg-indigo-700'
              },
              {
                id: 'save-cat-fullbody',
                label: '👗 儲存為 全身',
                onClick: (cropped) => handleSaveToCategory(cropped, 'fullbody'),
                className: 'bg-rose-600 text-white hover:bg-rose-700'
              },
              {
                id: 'save-cat-others',
                label: '💼 儲存為 其他',
                onClick: (cropped) => handleSaveToCategory(cropped, 'others'),
                className: 'bg-stone-600 text-white hover:bg-stone-700'
              }
            ]}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
