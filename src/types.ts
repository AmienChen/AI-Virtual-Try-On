/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type WardrobeCategory = 'tops' | 'bottoms' | 'fullbody' | 'others';

export interface WardrobeItem {
  id: string;
  category: WardrobeCategory;
  image: string;
  createdAt: number;
}

export interface ModelItem {
  id: string;
  image: string;
  createdAt: number;
}

export interface OutfitItem {
  id: string;
  image: string;
  createdAt: number;
}

export interface TryOnState {
  selectedPersonId: string | null;
  selectedPersonInOutfit: boolean; // whether chosen from models (false) or from my outfits (true)
  selectedGarmentId: string | null;
  resultImage: string | null;
  isLoading: boolean;
  error: string | null;
}

export type TabType = 'tryon' | 'wardrobe' | 'models' | 'outfits';
