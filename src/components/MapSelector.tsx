import React, { useEffect, useRef, useState } from 'react';
import * as maptilersdk from '@maptiler/sdk';
import '@maptiler/sdk/dist/maptiler-sdk.css';
import { getMapTilerKey } from '../config';
import type { BoundingBox } from '../types';

interface MapSelectorProps {
  onSelectionChange: (bbox: BoundingBox) => void;
}

const MapSelector: React.FC<MapSelectorProps> = ({ onSelectionChange }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maptilersdk.Map | null>(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const isSelectionModeRef = useRef(false);
  const startPoint = useRef<maptilersdk.LngLat | null>(null);
  const isDragging = useRef(false);
  const onSelectionChangeRef = useRef(onSelectionChange);

  useEffect(() => {
    onSelectionChangeRef.current = onSelectionChange;
  }, [onSelectionChange]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const createPolygon = (p1: maptilersdk.LngLat, p2: maptilersdk.LngLat): any => {
    const minLng = Math.min(p1.lng, p2.lng);
    const maxLng = Math.max(p1.lng, p2.lng);
    const minLat = Math.min(p1.lat, p2.lat);
    const maxLat = Math.max(p1.lat, p2.lat);

    return {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [minLng, maxLat],
          [maxLng, maxLat],
          [maxLng, minLat],
          [minLng, minLat],
          [minLng, maxLat]
        ]]
      },
      properties: {}
    };
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateSelectionPolygon = (feature: any) => {
    if (!map.current) return;
    const source = map.current.getSource('selection') as maptilersdk.GeoJSONSource;
    if (source) {
      source.setData({
        type: 'FeatureCollection',
        features: feature ? [feature] : []
      });
    }
  };

  useEffect(() => {
    isSelectionModeRef.current = isSelectionMode;
    if (map.current) {
      if (isSelectionMode) {
        map.current.dragPan.disable();
        map.current.getCanvas().style.cursor = 'crosshair';
      } else {
        map.current.dragPan.enable();
        map.current.getCanvas().style.cursor = '';
      }
    }
  }, [isSelectionMode]);

  useEffect(() => {
    if (map.current) return;

    const apiKey = getMapTilerKey();
    if (!apiKey) return;

    maptilersdk.config.apiKey = apiKey;

    if (mapContainer.current) {
      map.current = new maptilersdk.Map({
        container: mapContainer.current,
        style: maptilersdk.MapStyle.TOPO,
        center: [139.6917, 35.6895],
        zoom: 12,
        geolocate: maptilersdk.GeolocationType.POINT
      });

      map.current.on('load', () => {
        if (!map.current) return;

        map.current.addSource('selection', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: []
          }
        });

        map.current.addLayer({
          id: 'selection-fill',
          type: 'fill',
          source: 'selection',
          paint: {
            'fill-color': '#088',
            'fill-opacity': 0.4
          }
        });

        map.current.addLayer({
          id: 'selection-outline',
          type: 'line',
          source: 'selection',
          paint: {
            'line-color': '#088',
            'line-width': 2
          }
        });
      });

      map.current.on('mousedown', (e) => {
        if (!isSelectionModeRef.current) return;
        isDragging.current = true;
        startPoint.current = e.lngLat;
        
        // Clear previous selection visual
        updateSelectionPolygon(null);
      });

      map.current.on('mousemove', (e) => {
        if (!isSelectionModeRef.current || !isDragging.current || !startPoint.current) return;
        
        const currentPoint = e.lngLat;
        updateSelectionPolygon(createPolygon(startPoint.current, currentPoint));
      });

      map.current.on('mouseup', (e) => {
        if (!isSelectionModeRef.current || !isDragging.current || !startPoint.current) return;
        
        isDragging.current = false;
        const endPoint = e.lngLat;
        
        // Finalize selection
        const bbox: BoundingBox = {
          north: Math.max(startPoint.current.lat, endPoint.lat),
          south: Math.min(startPoint.current.lat, endPoint.lat),
          east: Math.max(startPoint.current.lng, endPoint.lng),
          west: Math.min(startPoint.current.lng, endPoint.lng),
        };
        
        if (onSelectionChangeRef.current) {
            onSelectionChangeRef.current(bbox);
        }
        
        // Keep selection mode enabled for adjustments
        setIsSelectionMode(false); 
      });
    }
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
      <button
        onClick={() => setIsSelectionMode(!isSelectionMode)}
        style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          zIndex: 1,
          padding: '10px',
          backgroundColor: isSelectionMode ? '#088' : 'white',
          color: isSelectionMode ? 'white' : 'black',
          border: '1px solid #ccc',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        {isSelectionMode ? 'Cancel Selection' : 'Select Area'}
      </button>
    </div>
  );
};

export default MapSelector;
