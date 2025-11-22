export const getMapTilerKey = (): string | null => {
  return import.meta.env.VITE_MAPTILER_KEY || null;
};

