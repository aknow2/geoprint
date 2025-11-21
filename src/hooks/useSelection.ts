import { useState, useCallback } from 'react';
import type { BoundingBox } from '../types';

export const useSelection = () => {
  const [selection, setSelection] = useState<BoundingBox | null>(null);

  const updateSelection = useCallback((bbox: BoundingBox) => {
    setSelection(bbox);
  }, []);

  const clearSelection = useCallback(() => {
    setSelection(null);
  }, []);

  return {
    selection,
    updateSelection,
    clearSelection,
  };
};
