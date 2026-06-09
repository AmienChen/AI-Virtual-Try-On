/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Download, Sparkles, AlertCircle, CheckCircle2, Loader2, Shirt, User, FolderHeart, BookOpen, ChevronRight, Bookmark } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import { TryOnState, WardrobeItem, ModelItem, OutfitItem } from '../types';

interface VirtualTryOnProps {
  wardrobeItems: WardrobeItem[];
  models: ModelItem[];
  outfits: OutfitItem[];
  onSaveOutfit: (image: string) => void;
  onNavigate: (tab: 'tryon' | 'wardrobe' | 'models' | 'outfits') => void;
}

export default function VirtualTryOn({ 
  wardrobeItems, 
  models, 
  outfits, 
  onSaveOutfit, 
  onNavigate 
}: VirtualTryOnProps) {
  const [state, setState] = useState<TryOnState>({
    selectedPersonId: null,
    selectedPersonInOutfit: false, // false = models, true = outfits
    selectedGarmentId: null,
    resultImage: null,
    isLoading: false,
    error: null,
  });

  const [personSource, setPersonSource] = useState<'models' | 'outfits'>('models');
  const [garmentCategoryFilter, setGarmentCategoryFilter] = useState<'all' | 'tops' | 'bottoms' | 'fullbody' | 'others'>('all');
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' | 'info' } | null>(null);

  // 同步刪除：當選取的人像在其他分頁被刪除時，自動清除選取狀態
  useEffect(() => {
    if (state.selectedPersonId) {
      const exists = state.selectedPersonInOutfit 
        ? outfits.some(o => o.id === state.selectedPersonId)
        : models.some(m => m.id === state.selectedPersonId);
      if (!exists) {
        setState(prev => ({ ...prev, selectedPersonId: null }));
      }
    }
  }, [models, outfits, state.selectedPersonId, state.selectedPersonInOutfit]);

  // 同步刪除：當選取的衣物在其他分頁被刪除時，自動清除選取狀態
  useEffect(() => {
    if (state.selectedGarmentId) {
      const exists = wardrobeItems.some(w => w.id === state.selectedGarmentId);
      if (!exists) {
        setState(prev => ({ ...prev, selectedGarmentId: null }));
      }
    }
  }, [wardrobeItems, state.selectedGarmentId]);

  const showToast = (message: string, type: 'error' | 'success' | 'info' = 'info') => {
    setToast({ message, type });
    const duration = type === 'error' ? 10000 : (message.includes('進行試穿') ? 12000 : 4000);
    setTimeout(() => setToast(null), duration);
  };

  // Retrieve current active images based on selected IDs
  const getSelectedPersonImage = () => {
    if (!state.selectedPersonId) return null;
    if (state.selectedPersonInOutfit) {
      const outfit = outfits.find(o => o.id === state.selectedPersonId);
      return outfit ? outfit.image : null;
    } else {
      const model = models.find(m => m.id === state.selectedPersonId);
      return model ? model.image : null;
    }
  };

  const getSelectedGarmentImage = () => {
    if (!state.selectedGarmentId) return null;
    const item = wardrobeItems.find(w => w.id === state.selectedGarmentId);
    return item ? item.image : null;
  };

  const handleGenerate = async () => {
    const personImage = getSelectedPersonImage();
    const garmentImage = getSelectedGarmentImage();

    if (!personImage) {
      showToast('請先選擇一個模特兒人像首選 (從「模特」列表或「我的穿搭」)。', 'error');
      return;
    }
    if (!garmentImage) {
      showToast('請先到「衣櫃」中點擊並選擇想套用的衣服。', 'error');
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      showToast('AI 正在連線進行試穿，約需 1 分鐘左右，請稍候...', 'info');
      
      const response = await fetch('/api/try-on', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personImage,
          garmentImage,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '伺服器繁忙，請稍候重試');
      }

      const data = await response.json();
      setState(prev => ({ ...prev, resultImage: data.resultImage, isLoading: false }));
      showToast('試衣成功！趕快儲存此穿搭！', 'success');
    } catch (err: any) {
      console.error(err);
      setState(prev => ({ ...prev, isLoading: false, error: err.message || '目前伺服器繁忙，請稍後再試' }));
      showToast(err.message || '伺服器端連結失敗，請重新嘗試', 'error');
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleSaveToMyOutfits = () => {
    if (!state.resultImage) return;
    onSaveOutfit(state.resultImage);
    showToast('已成功將此張試衣照儲存至「穿搭」！', 'success');
  };

  const handleDownload = () => {
    if (!state.resultImage) return;
    const link = document.createElement('a');
    link.href = state.resultImage;
    link.download = `ai-try-on-${Date.now()}.png`;
    link.click();
  };

  const activePersonImage = getSelectedPersonImage();
  const activeGarmentImage = getSelectedGarmentImage();

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
      <div className="flex flex-col items-center mb-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-stone-200 text-stone-500 text-[10px] font-bold tracking-[0.2em] uppercase mb-4 shadow-sm"
        >
          <Sparkles className="w-3 h-3 text-amber-500" />
          Kwai-Kolors AI System
        </motion.div>
        <h1 className="text-4xl md:text-5xl font-serif text-stone-900 mb-4 italic leading-tight font-bold">
          AI 試衣 <span className="font-sans not-italic font-light text-stone-400">Try-On</span>
        </h1>
        <p className="text-stone-500 max-w-xl text-sm leading-relaxed">
          先到「模特」與「衣櫃」上傳裁切精美的素材。在此直接挑選並一鍵生成專屬穿搭效果！
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Interactive Pick Columns */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="p-6 md:p-8 rounded-[2rem] bg-white border border-stone-200/60 shadow-sm relative overflow-hidden flex flex-col gap-8">
            <div className="absolute top-0 left-0 w-full h-1 bg-stone-800" />
            
            {/* 1. SELECT PERSON SECTION */}
            <div className="flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
                <span className="text-xs font-bold uppercase tracking-[0.15em] text-stone-400 flex items-center gap-2">
                  <User className="w-4 h-4 text-stone-700" />
                  步驟 1: 選擇人像 / 模特兒
                </span>
                
                {/* Person pool tabs */}
                <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl">
                  <button
                    onClick={() => {
                      setPersonSource('models');
                      setState(prev => ({ ...prev, selectedPersonId: null }));
                    }}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all cursor-pointer ${
                      personSource === 'models' 
                        ? 'bg-white text-stone-900 shadow-sm' 
                        : 'text-stone-500 hover:text-stone-900'
                    }`}
                  >
                    選擇【模特列表】({models.length})
                  </button>
                  <button
                    onClick={() => {
                      setPersonSource('outfits');
                      setState(prev => ({ ...prev, selectedPersonId: null }));
                    }}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all cursor-pointer ${
                      personSource === 'outfits' 
                        ? 'bg-white text-stone-900 shadow-sm' 
                        : 'text-stone-500 hover:text-stone-900'
                    }`}
                  >
                    選擇【穿搭列表】({outfits.length})
                  </button>
                </div>
              </div>

              {/* Pool display */}
              {personSource === 'models' ? (
                models.length > 0 ? (
                  <div className="flex gap-4 overflow-x-auto pb-3 pt-1 scrollbar-thin">
                    {models.map(m => (
                      <div
                        key={m.id}
                        id={`select-model-item-${m.id}`}
                        onClick={() => setState(prev => ({ ...prev, selectedPersonId: m.id, selectedPersonInOutfit: false }))}
                        className={`relative w-20 h-24 sm:w-24 sm:h-32 shrink-0 rounded-xl overflow-hidden border cursor-pointer transition-all duration-300
                          ${state.selectedPersonId === m.id && !state.selectedPersonInOutfit
                            ? 'ring-3 ring-stone-800 border-transparent scale-95 shadow-md' 
                            : 'border-stone-200 hover:border-stone-400'
                          }
                        `}
                      >
                        <img src={m.image} className="w-full h-full object-cover" alt="Model option" />
                        {state.selectedPersonId === m.id && !state.selectedPersonInOutfit && (
                          <div className="absolute inset-0 bg-stone-900/30 flex items-center justify-center">
                            <span className="w-6 h-6 rounded-full bg-stone-800 text-white text-[10px] font-bold flex items-center justify-center">✓</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 px-4 border border-dashed border-stone-200 rounded-2xl bg-stone-50 flex flex-col items-center justify-center text-center">
                    <p className="text-xs text-stone-400 italic">目前尚未上傳任何模特人像喔！</p>
                    <button
                      id="goto-models-btn"
                      onClick={() => onNavigate('models')}
                      className="mt-3 py-1.5 px-4 rounded-lg bg-stone-800 hover:bg-stone-900 text-white font-bold text-[10px] tracking-wider uppercase transition-all cursor-pointer"
                    >
                      立刻前往人像模特上傳 ➜
                    </button>
                  </div>
                )
              ) : (
                outfits.length > 0 ? (
                  <div className="flex gap-4 overflow-x-auto pb-3 pt-1 scrollbar-thin">
                    {outfits.map(o => (
                      <div
                        key={o.id}
                        id={`select-outfit-item-${o.id}`}
                        onClick={() => setState(prev => ({ ...prev, selectedPersonId: o.id, selectedPersonInOutfit: true }))}
                        className={`relative w-20 h-24 sm:w-24 sm:h-32 shrink-0 rounded-xl overflow-hidden border cursor-pointer transition-all duration-300
                          ${state.selectedPersonId === o.id && state.selectedPersonInOutfit
                            ? 'ring-3 ring-stone-800 border-transparent scale-95 shadow-md' 
                            : 'border-stone-200 hover:border-stone-400'
                          }
                        `}
                      >
                        <img src={o.image} className="w-full h-full object-cover" alt="Outfit option" />
                        {state.selectedPersonId === o.id && state.selectedPersonInOutfit && (
                          <div className="absolute inset-0 bg-stone-900/30 flex items-center justify-center">
                            <span className="w-6 h-6 rounded-full bg-stone-800 text-white text-[10px] font-bold flex items-center justify-center">✓</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 px-4 border border-dashed border-stone-200 rounded-2xl bg-stone-50 flex flex-col items-center justify-center text-center">
                    <p className="text-xs text-stone-400 italic">您目前穿搭相簿也是空空的喔！可以使用上方【模特列表】為基底進行試衣</p>
                  </div>
                )
              )}
            </div>

            {/* 2. SELECT GARMENT SECTION */}
            <div className="flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
                <span className="text-xs font-bold uppercase tracking-[0.15em] text-stone-400 flex items-center gap-2">
                  <Shirt className="w-4 h-4 text-stone-700" />
                  步驟 2: 選擇衣物
                </span>

                {/* Wardrobe filters */}
                <div className="flex items-center gap-1 bg-stone-100 p-0.5 rounded-lg flex-wrap">
                  {(['all', 'tops', 'bottoms', 'fullbody', 'others'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setGarmentCategoryFilter(f)}
                      className={`px-2 py-1 rounded-md text-[9px] font-bold tracking-wider uppercase transition-all cursor-pointer ${
                        garmentCategoryFilter === f 
                          ? 'bg-white text-stone-900 shadow-sm' 
                          : 'text-stone-500 hover:text-stone-900'
                      }`}
                    >
                      {f === 'all' ? '全部' : f === 'tops' ? '上衣' : f === 'bottoms' ? '下身' : f === 'fullbody' ? '全身' : '其他'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Garments pool display */}
              {wardrobeItems.length > 0 ? (
                (() => {
                  const filtered = garmentCategoryFilter === 'all' 
                    ? wardrobeItems 
                    : wardrobeItems.filter(item => item.category === garmentCategoryFilter);

                  return filtered.length > 0 ? (
                    <div className="flex gap-4 overflow-x-auto pb-3 pt-1 scrollbar-thin">
                      {filtered.map(w => (
                        <div
                          key={w.id}
                          id={`select-wardrobe-item-${w.id}`}
                          onClick={() => setState(prev => ({ ...prev, selectedGarmentId: w.id }))}
                          className={`relative w-20 h-24 sm:w-24 sm:h-32 shrink-0 rounded-xl overflow-hidden border cursor-pointer transition-all duration-300
                            ${state.selectedGarmentId === w.id
                              ? 'ring-3 ring-stone-800 border-transparent scale-95 shadow-md' 
                              : 'border-stone-200 hover:border-stone-400'
                            }
                          `}
                        >
                          <img src={w.image} className="w-full h-full object-cover" alt="Garment option" />
                          <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/60 rounded text-[8px] text-white">
                            {w.category === 'tops' ? '上衣' : w.category === 'bottoms' ? '下身' : w.category === 'fullbody' ? '全身' : '其他'}
                          </span>
                          {state.selectedGarmentId === w.id && (
                            <div className="absolute inset-0 bg-stone-900/30 flex items-center justify-center">
                              <span className="w-6 h-6 rounded-full bg-stone-800 text-white text-[10px] font-bold flex items-center justify-center">✓</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 px-4 border border-stone-100 rounded-2xl bg-stone-50 flex flex-col justify-center items-center text-center">
                      <p className="text-xs text-stone-400 italic">在此類別下，尚未有已裁剪的衣服圖片喔！</p>
                    </div>
                  );
                })()
              ) : (
                <div className="py-8 px-4 border border-dashed border-stone-200 rounded-2xl bg-stone-50 flex flex-col items-center justify-center text-center">
                  <p className="text-xs text-stone-400 italic">您衣櫃裡目前沒有裁切後的乾淨衣物照喔！</p>
                  <button
                    id="goto-wardrobe-btn"
                    onClick={() => onNavigate('wardrobe')}
                    className="mt-3 py-1.5 px-4 rounded-lg bg-stone-800 hover:bg-stone-900 text-white font-bold text-[10px] tracking-wider uppercase transition-all cursor-pointer"
                  >
                    立刻前往衣櫃新增衣服 ➜
                  </button>
                </div>
              )}
            </div>

            {/* PREVIEW SELECTIONS BEFORE GENERATING */}
            <div className="grid grid-cols-2 gap-4 mt-2 bg-stone-50 p-4 rounded-2xl border border-stone-200/40">
              <div className="flex flex-col items-center justify-center p-3 text-center rounded-xl bg-white border border-stone-100 aspect-square relative overflow-hidden group">
                {activePersonImage ? (
                  <>
                    <img src={activePersonImage} className="absolute inset-0 w-full h-full object-cover" alt="Selected model" />
                    <span className="absolute bottom-2 left-2 bg-black/50 text-white text-[8px] font-bold tracking-widest px-2 py-0.5 rounded uppercase">已選人像</span>
                  </>
                ) : (
                  <div className="text-stone-300 flex flex-col items-center gap-1">
                    <User className="w-8 h-8 stroke-[1.2]" />
                    <span className="text-[10px] tracking-wide font-medium mt-1">未選人像</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col items-center justify-center p-3 text-center rounded-xl bg-white border border-stone-100 aspect-square relative overflow-hidden group">
                {activeGarmentImage ? (
                  <>
                    <img src={activeGarmentImage} className="absolute inset-0 w-full h-full object-cover" alt="Selected garment" />
                    <span className="absolute bottom-2 left-2 bg-black/50 text-white text-[8px] font-bold tracking-widest px-2 py-0.5 rounded uppercase">已選衣物</span>
                  </>
                ) : (
                  <div className="text-stone-300 flex flex-col items-center gap-1">
                    <Shirt className="w-8 h-8 stroke-[1.2]" />
                    <span className="text-[10px] tracking-wide font-medium mt-1">未選衣服</span>
                  </div>
                )}
              </div>
            </div>

          </div>
          
          {/* GENERATE RUN TRIGGER BUTTON */}
          <button
            id="generate-button"
            onClick={handleGenerate}
            disabled={state.isLoading}
            className={`w-full h-16 rounded-2xl font-bold tracking-widest uppercase transition-all duration-300 flex items-center justify-center gap-4 text-xs select-none cursor-pointer
              ${state.isLoading 
                ? 'bg-stone-100 cursor-not-allowed text-stone-400' 
                : 'bg-stone-800 text-white hover:bg-stone-900 shadow-xl" shadow-stone-200 active:scale-[0.99]'
              }
            `}
          >
            {state.isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-stone-400" />
                <span>AI 正在合成中，請稍候...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
                <span>開始 AI 虛擬穿搭 (GENERATE TRY-ON)</span>
              </>
            )}
          </button>
        </div>

        {/* Right Result Preview Action Segment */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="flex justify-between items-end px-2">
            <h2 className="text-xl font-serif text-stone-800 italic font-bold">預覽試穿結果</h2>
            <span className="text-[10px] font-bold text-stone-400 bg-stone-200/50 px-3 py-1 rounded-full uppercase tracking-tighter">
              Try-on Result
            </span>
          </div>
          
          <div className="aspect-[3/4] rounded-[2.5rem] bg-white border border-stone-200 overflow-hidden relative shadow-sm p-4">
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
            
            <div className="w-full h-full rounded-[2rem] overflow-hidden bg-stone-50 border border-stone-100 flex flex-col">
              <AnimatePresence mode="wait">
                {state.resultImage ? (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="w-full h-full relative group"
                  >
                    <img src={state.resultImage} alt="Try-on Result" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-stone-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-6 gap-3">
                      <button
                        id="save-outfit-btn"
                        onClick={handleSaveToMyOutfits}
                        className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 text-white font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all font-sans cursor-pointer"
                      >
                        <Bookmark className="w-4 h-4 fill-white" />
                        儲存至穿搭
                      </button>
                      <button
                        id="download-button"
                        onClick={handleDownload}
                        className="w-full py-3.5 px-4 rounded-xl bg-white text-stone-900 font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-2 hover:bg-stone-100 transition-all font-sans cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                        下載此張照片
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="placeholder"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="w-full h-full flex flex-col items-center justify-center p-8 text-center"
                  >
                    <div className="w-20 h-20 rounded-full border border-stone-100 flex items-center justify-center mb-6 text-stone-200">
                      <Shirt className="w-10 h-10 stroke-[1]" />
                    </div>
                    <h3 className="text-stone-400 font-serif font-bold text-base leading-tight mb-3">等待合成指令</h3>
                    <p className="text-stone-400 text-[11px] mt-2 max-w-[200px] mx-auto leading-relaxed italic">
                      「右側選擇完 Model 與 Garment 後點擊開始試穿，AI 魔幻穿搭隨即為您展出。」
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {state.isLoading && (
              <div className="absolute inset-4 rounded-[2rem] bg-white/80 backdrop-blur-[2px] flex items-center justify-center z-10 border border-stone-100 shadow-inner">
                <div className="flex flex-col items-center gap-6">
                  <div className="w-16 h-16 rounded-full border-2 border-stone-100 border-t-stone-800 animate-spin" />
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-xs font-bold tracking-[0.3em] uppercase text-stone-800 animate-pulse">AI 合成中</p>
                    <p className="text-[10px] text-stone-400 italic">正在融合衣物與人物褶皺...</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Persistent Save and Download Action Panel (Highly Mobile and Desktop friendly) */}
          {state.resultImage && !state.isLoading && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-2.5 p-4 rounded-3xl bg-emerald-50/50 border border-emerald-100 animate-fade-in"
            >
              <button
                id="save-outfit-direct-btn"
                onClick={handleSaveToMyOutfits}
                className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-2 shadow-lg shadow-emerald-200/50 transition-all active:scale-[0.98] cursor-pointer"
              >
                <Bookmark className="w-4 h-4 fill-white animate-pulse" />
                <span>儲存至穿搭 (SAVE TO OUTFITS)</span>
              </button>
              <button
                id="download-direct-btn"
                onClick={handleDownload}
                className="w-full py-3 px-4 rounded-2xl bg-white border border-stone-200 text-stone-700 font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-2 shadow-sm hover:bg-stone-50 transition-all active:scale-[0.98] cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>下載合成本機照片</span>
              </button>
            </motion.div>
          )}

          {/* Quick instructions/credits log box */}
          <div className="flex items-center gap-4 text-[10px] font-bold text-stone-400 bg-stone-100 px-6 py-4 rounded-2xl tracking-wider uppercase">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <span>API ACTIVE</span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <AlertCircle className="w-3 h-3 text-stone-400" />
              <span>STABLE SYNC</span>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification Container */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-16 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-50 pointer-events-none max-w-sm mx-auto"
          >
            <div className={`px-5 sm:px-6 py-3 sm:py-4 rounded-xl shadow-2xl border flex items-center gap-3 backdrop-blur-md pointer-events-auto w-full sm:min-w-[320px]
              ${toast.type === 'error' ? 'bg-white border-red-100 text-red-900 shadow-red-100' : 
                toast.type === 'success' ? 'bg-white border-emerald-100 text-emerald-900 shadow-emerald-100' : 
                'bg-white border-stone-200 text-stone-900 shadow-stone-200'}
            `}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0
                ${toast.type === 'error' ? 'bg-red-50' : 
                  toast.type === 'success' ? 'bg-emerald-50' : 
                  'bg-stone-50'}
              `}>
                {toast.type === 'error' ? <AlertCircle className="w-4 h-4 text-red-500" /> : 
                 toast.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : 
                 <Sparkles className="w-4 h-4 text-stone-500" />}
              </div>
              <span className="text-xs font-bold leading-relaxed break-words flex-1">{toast.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
