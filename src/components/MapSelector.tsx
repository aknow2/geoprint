import React, { useEffect, useRef, useState } from 'react';
import * as maptilersdk from '@maptiler/sdk';
import '@maptiler/sdk/dist/maptiler-sdk.css';
import { getMapTilerKey } from '../config';
import { parseGpx } from '../utils/gpxParser';
import type { BoundingBox, GpxTrack } from '../types';

interface MapSelectorProps {
  onSelectionChange: (bbox: BoundingBox) => void;
  onGpxLoaded?: (track: GpxTrack) => void;
}

const MapSelector: React.FC<MapSelectorProps> = ({ onSelectionChange, onGpxLoaded }) => {
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

  const renderGpxTrack = (track: GpxTrack) => {
    if (!map.current) return;
    
    const features = track.segments.map(segment => ({
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: segment.map(pt => [pt.lon, pt.lat])
      },
      properties: {}
    }));

    const source = map.current.getSource('gpx-track') as maptilersdk.GeoJSONSource;
    if (source) {
      source.setData({
        type: 'FeatureCollection',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        features: features as any
      });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const track = parseGpx(text);
      
      if (onGpxLoaded) {
        onGpxLoaded(track);
      }

      renderGpxTrack(track);
      
      if (track.segments.length > 0 && track.segments[0].length > 0) {
        const firstPoint = track.segments[0][0];
        map.current?.flyTo({
          center: [firstPoint.lon, firstPoint.lat],
          zoom: 14
        });
      }
    } catch (error) {
      console.error('Failed to parse GPX', error);
      alert('Failed to parse GPX file');
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

        // Add GPX track source and layer
        map.current.addSource('gpx-track', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: []
          }
        });

        map.current.addLayer({
          id: 'gpx-track-line',
          type: 'line',
          source: 'gpx-track',
          paint: {
            'line-color': '#ff0000',
            'line-width': 4
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
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '150px',
        zIndex: 1
      }}>
        <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', backgroundColor: 'rgba(255,255,255,0.7)', padding: '5px', borderRadius: '4px', color: 'black' }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>GPX:</span>
          <input
            type="file"
            accept=".gpx"
            onChange={handleFileUpload}
            style={{ fontSize: '0.8rem' }}
          />
        </label>
      </div>
    </div>
  );
};

export default MapSelector;
