export const MAPTILER_KEY_STORAGE_KEY = 'maptiler_key';

export const getMapTilerKey = (): string | null => {
  const localKey = localStorage.getItem(MAPTILER_KEY_STORAGE_KEY);
  if (localKey) return localKey;
  
  return import.meta.env.VITE_MAPTILER_KEY || null;
};

export const setMapTilerKey = (key: string) => {
  localStorage.setItem(MAPTILER_KEY_STORAGE_KEY, key);
};
