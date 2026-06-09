/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WardrobeItem, ModelItem, OutfitItem } from '../types';

const DB_NAME = 'VirtualFitDatabase';
const DB_VERSION = 1;

export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    // Open indexedDB connection
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('indexedDB.open error:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = () => {
      const db = request.result;
      
      // Store wardrobe categories with custom keys
      if (!db.objectStoreNames.contains('wardrobe')) {
        db.createObjectStore('wardrobe', { keyPath: 'id' });
      }
      
      // Store model human images
      if (!db.objectStoreNames.contains('models')) {
        db.createObjectStore('models', { keyPath: 'id' });
      }

      // Store generated outfit images
      if (!db.objectStoreNames.contains('outfits')) {
        db.createObjectStore('outfits', { keyPath: 'id' });
      }
    };
  });
}

/**
 * Generic query to retrieve all elements in a designated store
 */
export async function getAllFromStore<T>(storeName: 'wardrobe' | 'models' | 'outfits'): Promise<T[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        const results = request.result as any[];
        // Always sort descending by createdAt timestamp so newer uploads take priority on display grids
        results.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        resolve(results as T[]);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (err) {
    console.error(`Failed to get items from store '${storeName}':`, err);
    return [];
  }
}

/**
 * Persist or update an item in IndexedDB
 */
export async function saveToStore<T extends { id: string }>(
  storeName: 'wardrobe' | 'models' | 'outfits', 
  item: T
): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(item);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error(`Failed to write to store '${storeName}':`, err);
    throw err;
  }
}

/**
 * Delete a specific record from the database
 */
export async function deleteFromStore(
  storeName: 'wardrobe' | 'models' | 'outfits', 
  id: string
): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error(`Failed to delete '${id}' from store '${storeName}':`, err);
    throw err;
  }
}

/**
 * Clear the store
 */
export async function clearStore(storeName: 'wardrobe' | 'models' | 'outfits'): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error(`Failed to clear store '${storeName}':`, err);
    throw err;
  }
}
