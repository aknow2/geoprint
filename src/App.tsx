import React, { useState } from 'react';
import './App.css';
import Scene3D from './components/Scene3D';
import ApiKeyInput from './components/ApiKeyInput';
import MapSelector from './components/MapSelector';
import { useSelection } from './hooks/useSelection';
import { fetchContourTiles } from './services/tileService';
import { parseTiles } from './utils/tileParser';
import type { ContourSegment } from './utils/tileParser';
import { generateTerrainGeometry } from './utils/geometryGenerator';
import { exportToSTL } from './utils/stlExporter';
import * as THREE from 'three';

function App() {
  const { selection, updateSelection } = useSelection();
  const [terrainGeometry, setTerrainGeometry] = useState<THREE.BufferGeometry | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Parameters
  const [baseHeight, setBaseHeight] = useState(2);
  const [verticalScale, setVerticalScale] = useState(1.5);
  const [maxHeight, setMaxHeight] = useState(200);
  const [isUnlimitedHeight, setIsUnlimitedHeight] = useState(false);
  
  // Cache segments to allow parameter updates without re-fetching
  const [segments, setSegments] = useState<ContourSegment[] | null>(null);

  // Effect to update geometry when parameters change
  React.useEffect(() => {
    if (segments && selection) {
      const geometry = generateTerrainGeometry(segments, selection, 100, {
        baseHeight,
        verticalScale,
        maxHeight: isUnlimitedHeight ? Infinity : maxHeight
      });
      setTerrainGeometry(geometry);
    }
  }, [baseHeight, verticalScale, maxHeight, isUnlimitedHeight, segments, selection]);

  const handleGenerate = async () => {
    if (!selection) return;
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch tiles
      const tiles = await fetchContourTiles(selection);
      
      // 2. Parse tiles
      const center = {
        lat: (selection.north + selection.south) / 2,
        lng: (selection.east + selection.west) / 2
      };
      const parsedSegments = parseTiles(tiles, center);
      setSegments(parsedSegments);
      
      // Geometry generation is handled by the useEffect
      
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!terrainGeometry) return;
    const blob = exportToSTL(terrainGeometry);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'terrain.stl';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="app-container">
      <ApiKeyInput />
      <header className="app-header">
        <h1>PrintGeo: Map to STL</h1>
      </header>
      <main className="app-main">
        <div className="map-container">
          <MapSelector onSelectionChange={updateSelection} />
        </div>
        <div className="scene-container">
          <Scene3D terrainGeometry={terrainGeometry} />
          {selection && (
            <div style={{
              position: 'absolute',
              bottom: '10px',
              left: '10px',
              backgroundColor: 'rgba(255,255,255,0.9)',
              padding: '15px',
              borderRadius: '8px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
              color: 'black',
              textAlign: 'left',
              zIndex: 10
            }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem' }}>Selected Area</h3>
              <div style={{ fontSize: '0.9rem', marginBottom: '10px' }}>
                <p style={{ margin: '2px 0' }}>N: {selection.north.toFixed(4)}</p>
                <p style={{ margin: '2px 0' }}>S: {selection.south.toFixed(4)}</p>
                <p style={{ margin: '2px 0' }}>E: {selection.east.toFixed(4)}</p>
                <p style={{ margin: '2px 0' }}>W: {selection.west.toFixed(4)}</p>
              </div>
              
              {error && <p style={{ color: 'red', fontSize: '0.8rem' }}>{error}</p>}
              
              <div style={{ marginBottom: '10px', borderTop: '1px solid #eee', paddingTop: '10px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '2px' }}>
                  Base Height: {baseHeight}m
                </label>
                <input 
                  type="range" 
                  min="0" 
                  max="20" 
                  step="1" 
                  value={baseHeight} 
                  onChange={(e) => setBaseHeight(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
                
                <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '2px' }}>
                  Vertical Scale: {verticalScale}x
                </label>
                <input 
                  type="range" 
                  min="0.1" 
                  max="5" 
                  step="0.1" 
                  value={verticalScale} 
                  onChange={(e) => setVerticalScale(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '2px' }}>
                    Max Height: {isUnlimitedHeight ? 'Unlimited' : `${maxHeight}m`}
                  </label>
                  <label style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={isUnlimitedHeight} 
                      onChange={(e) => setIsUnlimitedHeight(e.target.checked)}
                      style={{ marginRight: '4px' }}
                    />
                    No Limit
                  </label>
                </div>
                <input 
                  type="range" 
                  min="50" 
                  max="1000" 
                  step="50" 
                  value={maxHeight} 
                  disabled={isUnlimitedHeight}
                  onChange={(e) => setMaxHeight(Number(e.target.value))}
                  style={{ width: '100%', opacity: isUnlimitedHeight ? 0.5 : 1 }}
                />
              </div>

              <button 
                onClick={handleGenerate}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '8px',
                  backgroundColor: loading ? '#ccc' : '#4caf50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold'
                }}
              >
                {loading ? 'Generating...' : 'Generate 3D Model'}
              </button>

              {terrainGeometry && (
                <button 
                  onClick={handleDownload}
                  style={{
                    width: '100%',
                    marginTop: '10px',
                    padding: '8px',
                    backgroundColor: '#2196f3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  Download STL
                </button>
              )}
            </div>
          )}
        </div>
      </main>
      <footer className="app-footer">
        <p>&copy; 2025 PrintGeo</p>
      </footer>
    </div>
  );
}

export default App;
