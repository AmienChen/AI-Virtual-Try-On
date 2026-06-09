/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Shirt, User, FolderHeart, Sparkles, BookOpen, Loader2 } from 'lucide-react';
import { TabType, WardrobeItem, ModelItem, OutfitItem } from './types';
import VirtualTryOn from './components/VirtualTryOn';
import Wardrobe from './components/Wardrobe';
import Models from './components/Models';
import Outfits from './components/Outfits';
import { getAllFromStore, saveToStore, deleteFromStore } from './lib/db';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('tryon');
  const [wardrobeItems, setWardrobeItems] = useState<WardrobeItem[]>([]);
  const [models, setModels] = useState<ModelItem[]>([]);
  const [outfits, setOutfits] = useState<OutfitItem[]>([]);
  const [isDbLoading, setIsDbLoading] = useState(true);

  // Initialize and migrate localStorage data once on mount
  useEffect(() => {
    async function initDBAndMigrate() {
      try {
        // 1. One-time Migration from localStorage to IndexedDB (if present)
        const oldWardrobe = localStorage.getItem('virtualfit_wardrobe');
        const oldModels = localStorage.getItem('virtualfit_models');
        const oldOutfits = localStorage.getItem('virtualfit_outfits');

        if (oldWardrobe) {
          try {
            const items: WardrobeItem[] = JSON.parse(oldWardrobe);
            for (const item of items) {
              await saveToStore('wardrobe', item);
            }
          } catch (e) {
            console.error('Migration error for wardrobe:', e);
          }
          localStorage.removeItem('virtualfit_wardrobe');
        }

        if (oldModels) {
          try {
            const items: ModelItem[] = JSON.parse(oldModels);
            for (const item of items) {
              await saveToStore('models', item);
            }
          } catch (e) {
            console.error('Migration error for models:', e);
          }
          localStorage.removeItem('virtualfit_models');
        }

        if (oldOutfits) {
          try {
            const items: OutfitItem[] = JSON.parse(oldOutfits);
            for (const item of items) {
              await saveToStore('outfits', item);
            }
          } catch (e) {
            console.error('Migration error for outfits:', e);
          }
          localStorage.removeItem('virtualfit_outfits');
        }

        // 2. Load all active items from IndexedDB
        const [loadedWardrobe, loadedModels, loadedOutfits] = await Promise.all([
          getAllFromStore<WardrobeItem>('wardrobe'),
          getAllFromStore<ModelItem>('models'),
          getAllFromStore<OutfitItem>('outfits')
        ]);

        setWardrobeItems(loadedWardrobe);
        setModels(loadedModels);
        setOutfits(loadedOutfits);
      } catch (err) {
        console.error('Failed to initialize database or migrate datasets:', err);
      } finally {
        setIsDbLoading(false);
      }
    }

    initDBAndMigrate();
  }, []);

  // Handler callbacks with DB persistence Syncing
  const handleWardrobeChange = async (newItems: WardrobeItem[]) => {
    const deleted = wardrobeItems.filter(item => !newItems.some(n => n.id === item.id));
    const added = newItems.filter(item => !wardrobeItems.some(o => o.id === item.id));

    setWardrobeItems(newItems);

    for (const item of deleted) {
      await deleteFromStore('wardrobe', item.id);
    }
    for (const item of added) {
      await saveToStore('wardrobe', item);
    }
  };

  const handleModelsChange = async (newModels: ModelItem[]) => {
    const deleted = models.filter(item => !newModels.some(n => n.id === item.id));
    const added = newModels.filter(item => !models.some(o => o.id === item.id));

    setModels(newModels);

    for (const item of deleted) {
      await deleteFromStore('models', item.id);
    }
    for (const item of added) {
      await saveToStore('models', item);
    }
  };

  const handleOutfitsChange = async (newOutfits: OutfitItem[]) => {
    const deleted = outfits.filter(item => !newOutfits.some(n => n.id === item.id));
    const added = newOutfits.filter(item => !outfits.some(o => o.id === item.id));

    setOutfits(newOutfits);

    for (const item of deleted) {
      await deleteFromStore('outfits', item.id);
    }
    for (const item of added) {
      await saveToStore('outfits', item);
    }
  };

  const handleSaveOutfit = async (resultImage: string) => {
    const newOutfit: OutfitItem = {
      id: `outfit_${Date.now()}_${Math.random().toString(36).substring(4)}`,
      image: resultImage,
      createdAt: Date.now()
    };
    
    setOutfits(prev => [newOutfit, ...prev]);
    await saveToStore('outfits', newOutfit);
  };

  return (
    <div className="min-h-screen bg-[#Fcfbf9] flex flex-col font-sans text-stone-800">
      {/* Navigation Header */}
      <nav className="sticky top-0 z-40 bg-white/75 backdrop-blur-md border-b border-stone-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between py-3 md:h-16 gap-4">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-stone-800 rounded-xl flex items-center justify-center text-white font-serif italic text-xl shadow-md font-bold">V</div>
              <h1 className="text-lg font-bold tracking-tight text-stone-900">
                VIRTUAL <span className="font-light text-stone-500 font-sans">Fit AI</span>
              </h1>
            </div>
            
            {/* Nav Swapping Bar tabs */}
            <div className="flex items-center gap-1 bg-stone-100 p-1.5 rounded-2xl border border-stone-200/50 w-full md:w-auto overflow-x-auto justify-center">
              <button
                id="tab-tryon"
                onClick={() => setActiveTab('tryon')}
                className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wider transition-all duration-300 flex items-center gap-2 cursor-pointer shrink-0
                  ${activeTab === 'tryon' 
                    ? 'bg-stone-800 text-white shadow-md' 
                    : 'text-stone-500 hover:text-stone-900'
                  }
                `}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI 試衣</span>
              </button>
              <button
                id="tab-wardrobe"
                onClick={() => setActiveTab('wardrobe')}
                className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wider transition-all duration-300 flex items-center gap-2 cursor-pointer shrink-0
                  ${activeTab === 'wardrobe' 
                    ? 'bg-stone-800 text-white shadow-md' 
                    : 'text-stone-500 hover:text-stone-900'
                  }
                `}
              >
                <Shirt className="w-3.5 h-3.5" />
                <span>衣櫃</span>
              </button>
              <button
                id="tab-models"
                onClick={() => setActiveTab('models')}
                className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wider transition-all duration-300 flex items-center gap-2 cursor-pointer shrink-0
                  ${activeTab === 'models' 
                    ? 'bg-stone-800 text-white shadow-md' 
                    : 'text-stone-500 hover:text-stone-900'
                  }
                `}
              >
                <User className="w-3.5 h-3.5" />
                <span>模特</span>
              </button>
              <button
                id="tab-outfits"
                onClick={() => setActiveTab('outfits')}
                className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wider transition-all duration-300 flex items-center gap-2 cursor-pointer shrink-0
                  ${activeTab === 'outfits' 
                    ? 'bg-stone-800 text-white shadow-md' 
                    : 'text-stone-500 hover:text-stone-900'
                  }
                `}
              >
                <FolderHeart className="w-3.5 h-3.5" />
                <span>穿搭</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main active layout swap handler */}
      <main className="flex-grow">
        {isDbLoading ? (
          <div className="max-w-4xl mx-auto px-4 py-32 flex flex-col items-center justify-center text-center">
            <Loader2 className="w-10 h-10 animate-spin text-stone-400 mb-4" />
            <p className="text-sm font-bold tracking-widest text-stone-500 uppercase animate-pulse">
              正在讀取相簿與衣櫃 (IndexedDB)
            </p>
            <p className="text-xs text-stone-400 mt-1 italic">
              建立高容量本機無損資料庫中...
            </p>
          </div>
        ) : (
          <div className="w-full">
            <div className={activeTab === 'tryon' ? 'block' : 'hidden'}>
              <VirtualTryOn 
                wardrobeItems={wardrobeItems}
                models={models}
                outfits={outfits}
                onSaveOutfit={handleSaveOutfit}
                onNavigate={setActiveTab}
              />
            </div>
            <div className={activeTab === 'wardrobe' ? 'block' : 'hidden'}>
              <Wardrobe 
                items={wardrobeItems}
                onItemsChange={handleWardrobeChange}
              />
            </div>
            <div className={activeTab === 'models' ? 'block' : 'hidden'}>
              <Models 
                models={models}
                onModelsChange={handleModelsChange}
              />
            </div>
            <div className={activeTab === 'outfits' ? 'block' : 'hidden'}>
              <Outfits 
                outfits={outfits}
                onOutfitsChange={handleOutfitsChange}
              />
            </div>
          </div>
        )}
      </main>

      {/* Elegant minimalist Footer */}
      <footer className="bg-white/40 border-t border-stone-200 mt-16 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-stone-800 rounded-lg flex items-center justify-center text-white font-serif italic text-xs">V</div>
              <span className="font-serif font-bold text-sm tracking-tight text-stone-900">VirtualFit Studio App</span>
            </div>
            <p className="text-stone-400 text-xs italic">
              "Experience the future of personal styling with precision AI-synthesized garment fitting."
            </p>
            <p className="text-[10px] font-bold text-stone-400">
              © {new Date().getFullYear()} VirtualFit. Powered by Kwai-Kolors.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
