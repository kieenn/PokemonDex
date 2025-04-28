// context/LoveContext.tsx
import React, { createContext, useState, useEffect, useContext, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOVE_STORAGE_KEY = '@lovedPokemonList';

interface LoveContextType {
  lovedNames: Set<string>; // Use a Set for efficient lookups
  toggleLove: (name: string) => Promise<void>;
  isLoadingLove: boolean;
}

// Create context with a default value (or undefined and check in hook)
const LoveContext = createContext<LoveContextType | undefined>(undefined);

interface LoveProviderProps {
  children: ReactNode;
}

export const LoveProvider: React.FC<LoveProviderProps> = ({ children }) => {
  const [lovedNames, setLovedNames] = useState<Set<string>>(new Set());
  const [isLoadingLove, setIsLoadingLove] = useState(true); // Start loading initially

  // Load loved list from AsyncStorage on mount
  useEffect(() => {
    const loadLovedPokemon = async () => {
      setIsLoadingLove(true);
      try {
        const storedValue = await AsyncStorage.getItem(LOVE_STORAGE_KEY);
        if (storedValue !== null) {
          const parsedList: string[] = JSON.parse(storedValue);
          setLovedNames(new Set(parsedList));
          console.log('[LoveContext] Loaded loved Pokémon:', parsedList);
        } else {
          console.log('[LoveContext] No loved Pokémon found in storage.');
          setLovedNames(new Set()); // Ensure it's an empty set if nothing is stored
        }
      } catch (error) {
        console.error('[LoveContext] Failed to load loved Pokémon from storage:', error);
        // Optionally set an error state here
      } finally {
        setIsLoadingLove(false);
      }
    };

    loadLovedPokemon();
  }, []); // Empty dependency array ensures this runs only once on mount

  // Function to toggle love status and save to AsyncStorage
  const toggleLove = useCallback(async (name: string) => {
    if (!name) return; // Avoid issues with empty names

    // Optimistic UI update first
    const newSet = new Set(lovedNames);
    let isCurrentlyLoved: boolean;

    if (newSet.has(name)) {
      newSet.delete(name);
      isCurrentlyLoved = false;
      console.log(`[LoveContext] Unloving ${name}`);
    } else {
      newSet.add(name);
      isCurrentlyLoved = true;
      console.log(`[LoveContext] Loving ${name}`);
    }
    setLovedNames(newSet); // Update state immediately

    // Persist the change to AsyncStorage
    try {
      const arrayToStore = Array.from(newSet);
      const stringifiedValue = JSON.stringify(arrayToStore);
      await AsyncStorage.setItem(LOVE_STORAGE_KEY, stringifiedValue);
      console.log(`[LoveContext] Saved updated list (${arrayToStore.length} items) to storage.`);
    } catch (error) {
      console.error(`[LoveContext] Failed to save updated loved list for ${name}:`, error);
      // Optional: Revert optimistic UI update on error
      // You might want to reload from storage or revert the setLovedNames call
      // For simplicity, we'll leave the optimistic update for now.
    }
  }, [lovedNames]); // Depend on lovedNames so the function always has the latest set

  const value = {
    lovedNames,
    toggleLove,
    isLoadingLove,
  };

  return <LoveContext.Provider value={value}>{children}</LoveContext.Provider>;
};

// Custom hook to use the LoveContext
export const useLove = (): LoveContextType => {
  const context = useContext(LoveContext);
  if (context === undefined) {
    throw new Error('useLove must be used within a LoveProvider');
  }
  return context;
};
