import React, { useState } from 'react';
import './App.css';
import Scene3D from './components/Scene3D';
import MapSelector from './components/MapSelector';
import { useSelection } from './hooks/useSelection';
import { fetchContourTiles, fetchVectorTiles } from './services/tileService';
import { parseTiles, parseBuildings, parseRoads, parseWaterFeatures } from './utils/tileParser';
import type { ContourSegment } from './utils/tileParser';
import type { BuildingFeature, RoadFeature, WaterFeature, GpxTrack } from './types';
import { generateTerrainGeometry, createBuildingGeometries, createRoadGeometries, createWaterGeometries, createGpxGeometries } from './utils/geometryGenerator';
import { exportToSTL } from './utils/stlExporter';
import * as THREE from 'three';

function App() {
  const { selection, updateSelection } = useSelection();
  const [terrainGeometry, setTerrainGeometry] = useState<THREE.BufferGeometry | null>(null);
  const [buildingFeatures, setBuildingFeatures] = useState<BuildingFeature[]>([]);
  const [roadFeatures, setRoadFeatures] = useState<RoadFeature[]>([]);
  const [waterFeatures, setWaterFeatures] = useState<WaterFeature[]>([]);
  const [gpxTrack, setGpxTrack] = useState<GpxTrack | null>(null);
  const [buildingsGroup, setBuildingsGroup] = useState<THREE.Group | null>(null);
  const [roadsGroup, setRoadsGroup] = useState<THREE.Group | null>(null);
  const [waterGroup, setWaterGroup] = useState<THREE.Group | null>(null);
  const [gpxGroup, setGpxGroup] = useState<THREE.Group | null>(null);
  const [showBuildings, setShowBuildings] = useState(true);
  const [showRoads, setShowRoads] = useState(true);
  const [showWater, setShowWater] = useState(true);
  const [showGpx, setShowGpx] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Parameters
  const [baseHeight, setBaseHeight] = useState(2);
  const [verticalScale, setVerticalScale] = useState(1.5);
  const [buildingVerticalScale, setBuildingVerticalScale] = useState(1.5);
  const [buildingHorizontalScale, setBuildingHorizontalScale] = useState(1.0);
  const [roadScale, setRoadScale] = useState(1.0);
  const [roadHeightScale, setRoadHeightScale] = useState(1.0);
  const [waterDepth, setWaterDepth] = useState(2.0);
  const [gpxRadius, setGpxRadius] = useState(1.0);
  const [gpxOffset, setGpxOffset] = useState(0.0);
  const [smoothing, setSmoothing] = useState(0);
  const [maxHeight, setMaxHeight] = useState(200);
  const [isUnlimitedHeight, setIsUnlimitedHeight] = useState(false);
  const [hideTerrain, setHideTerrain] = useState(false);
  
  // Selection and Overrides
  const [selectedRoadId, setSelectedRoadId] = useState<string | null>(null);
  const [roadOverrides, setRoadOverrides] = useState<{[key: string]: { widthScale: number, heightScale: number }}>({});

  // Cache segments to allow parameter updates without re-fetching
  const [segments, setSegments] = useState<ContourSegment[] | null>(null);

  // Effect for Terrain
  React.useEffect(() => {
    if (segments && selection) {
      console.log("Generating terrain geometry...");
      const geometry = generateTerrainGeometry(segments, selection, 100, {
        baseHeight,
        verticalScale,
        maxHeight: isUnlimitedHeight ? Infinity : maxHeight,
        smoothing,
        waterFeatures: waterFeatures,
        waterDepth,
        hideTerrain
      });
      setTerrainGeometry(geometry);
    }
  }, [segments, selection, baseHeight, verticalScale, maxHeight, isUnlimitedHeight, smoothing, waterFeatures, waterDepth, hideTerrain]);

  // Effect for Buildings
  React.useEffect(() => {
    if (buildingFeatures.length > 0 && terrainGeometry) {
      console.log("Generating building geometries...");
      const group = createBuildingGeometries(buildingFeatures, terrainGeometry, { 
        verticalScale: buildingVerticalScale,
        horizontalScale: buildingHorizontalScale
      });
      setBuildingsGroup(group);
    } else {
      setBuildingsGroup(null);
    }
  }, [buildingFeatures, terrainGeometry, buildingVerticalScale, buildingHorizontalScale]);

  // Effect for Roads
  React.useEffect(() => {
    if (roadFeatures.length > 0 && terrainGeometry) {
      console.log("Generating road geometries...");
      const group = createRoadGeometries(roadFeatures, terrainGeometry, { 
        widthScale: roadScale, 
        heightScale: roadHeightScale,
        overrides: roadOverrides
      });
      setRoadsGroup(group);
    } else {
      setRoadsGroup(null);
    }
  }, [roadFeatures, terrainGeometry, roadScale, roadHeightScale, roadOverrides]);

  // Effect for Water
  React.useEffect(() => {
    if (waterFeatures.length > 0 && terrainGeometry) {
      console.log("Generating water geometries...");
      const group = createWaterGeometries(waterFeatures, terrainGeometry, { widthScale: roadScale });
      setWaterGroup(group);
    } else {
      setWaterGroup(null);
    }
  }, [waterFeatures, terrainGeometry, roadScale]);

  // Effect for GPX
  React.useEffect(() => {
    if (gpxTrack && terrainGeometry) {
      console.log("Generating GPX geometries...");
      const group = createGpxGeometries(gpxTrack, terrainGeometry, { radius: gpxRadius, minClearance: 5.0, offset: gpxOffset });
      setGpxGroup(group);
    } else {
      setGpxGroup(null);
    }
  }, [gpxTrack, terrainGeometry, gpxRadius, gpxOffset]);

  const handleObjectSelected = (id: string | null, type: string | null) => {
    if (type === 'road' && id) {
      setSelectedRoadId(id);
    } else {
      setSelectedRoadId(null);
    }
  };

  const getSelectedRoadOverrides = () => {
    if (!selectedRoadId) return { widthScale: roadScale, heightScale: roadHeightScale };
    return roadOverrides[selectedRoadId] || { widthScale: roadScale, heightScale: roadHeightScale };
  };

  const updateSelectedRoadOverrides = (width: number, height: number) => {
    if (!selectedRoadId) return;
    setRoadOverrides(prev => ({
      ...prev,
      [selectedRoadId]: { widthScale: width, heightScale: height }
    }));
  };

  const handleGenerate = async () => {
    if (!selection) return;
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch tiles
      const [tiles, buildingTiles] = await Promise.all([
        fetchContourTiles(selection),
        fetchVectorTiles(selection)
      ]);
      
      // 2. Parse tiles
      const center = {
        lat: (selection.north + selection.south) / 2,
        lng: (selection.east + selection.west) / 2
      };
      const parsedSegments = parseTiles(tiles, center);
      setSegments(parsedSegments);

      const parsedBuildings = parseBuildings(buildingTiles, center);
      console.log(`Parsed ${parsedBuildings.length} buildings.`);
      setBuildingFeatures(parsedBuildings);

      const parsedRoads = parseRoads(buildingTiles, center);
      console.log(`Parsed ${parsedRoads.length} roads.`);
      setRoadFeatures(parsedRoads);

      const parsedWater = parseWaterFeatures(buildingTiles, center);
      console.log(`Parsed ${parsedWater.length} water features.`);
      setWaterFeatures(parsedWater);
      
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
    
    const exportGroup = new THREE.Group();
    const terrainMesh = new THREE.Mesh(terrainGeometry);
    exportGroup.add(terrainMesh);
    
    if (buildingsGroup && showBuildings) {
      exportGroup.add(buildingsGroup.clone());
    }
    
    if (roadsGroup && showRoads) {
      exportGroup.add(roadsGroup.clone());
    }

    if (waterGroup && showWater) {
      exportGroup.add(waterGroup.clone());
    }

    if (gpxGroup && showGpx) {
      exportGroup.add(gpxGroup.clone());
    }

    const blob = exportToSTL(exportGroup);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'terrain.stl';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>GeoPrint: Map to STL</h1>
      </header>
      <main className="app-main">
        <div className="map-container">
          <MapSelector onSelectionChange={updateSelection} onGpxLoaded={setGpxTrack} />
        </div>
        <div className="scene-container">
          <Scene3D 
            terrainGeometry={terrainGeometry} 
            buildingsGroup={showBuildings ? buildingsGroup : null} 
            roadsGroup={showRoads ? roadsGroup : null}
            waterGroup={showWater ? waterGroup : null}
            gpxGroup={showGpx ? gpxGroup : null}
            onObjectSelected={handleObjectSelected}
          />
          
          {selectedRoadId && (
            <div style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              backgroundColor: 'white',
              padding: '15px',
              borderRadius: '8px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
              zIndex: 20,
              width: '250px',
              color: '#333'
            }}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px'}}>
                <h4 style={{margin: 0}}>Selected Road</h4>
                <button 
                  onClick={() => setSelectedRoadId(null)}
                  style={{border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.2rem'}}
                >×</button>
              </div>
              
              <div style={{marginBottom: '10px'}}>
                <label style={{display: 'block', fontSize: '0.8rem', marginBottom: '2px'}}>
                  Width Scale: {getSelectedRoadOverrides().widthScale.toFixed(1)}x
                </label>
                <input 
                  type="range" 
                  min="0.1" 
                  max="10.0" 
                  step="0.1" 
                  value={getSelectedRoadOverrides().widthScale}
                  onChange={(e) => updateSelectedRoadOverrides(parseFloat(e.target.value), getSelectedRoadOverrides().heightScale)}
                  style={{width: '100%'}}
                />
              </div>

              <div style={{marginBottom: '10px'}}>
                <label style={{display: 'block', fontSize: '0.8rem', marginBottom: '2px'}}>
                  Height Scale: {getSelectedRoadOverrides().heightScale.toFixed(1)}x
                </label>
                <input 
                  type="range" 
                  min="0.1" 
                  max="10.0" 
                  step="0.1" 
                  value={getSelectedRoadOverrides().heightScale}
                  onChange={(e) => updateSelectedRoadOverrides(getSelectedRoadOverrides().widthScale, parseFloat(e.target.value))}
                  style={{width: '100%'}}
                />
              </div>
            </div>
          )}

          {selection && (
            <div style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              bottom: '10px',
              width: '320px',
              backgroundColor: 'rgba(255,255,255,0.95)',
              padding: '15px',
              borderRadius: '8px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
              color: '#333',
              textAlign: 'left',
              zIndex: 10,
              display: 'flex',
              flexDirection: 'column',
              maxHeight: 'calc(100vh - 100px)'
            }}>
              <div style={{ flexShrink: 0 }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '1.1rem' }}>Settings</h3>
                <div style={{ fontSize: '0.85rem', marginBottom: '10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                  <span>N: {selection.north.toFixed(4)}</span>
                  <span>S: {selection.south.toFixed(4)}</span>
                  <span>E: {selection.east.toFixed(4)}</span>
                  <span>W: {selection.west.toFixed(4)}</span>
                </div>
                {error && <p style={{ color: 'red', fontSize: '0.8rem' }}>{error}</p>}
              </div>

              <div style={{ overflowY: 'auto', flexGrow: 1, paddingRight: '5px' }}>
              
                              {/* Terrain Section */}
                <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: '4px' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', borderBottom: '1px solid #ddd', paddingBottom: '4px' }}>Terrain</h4>
                  
                  <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '2px' }}>Base Height: {baseHeight}m</label>
                  <input type="range" min="0" max="100" step="1" value={baseHeight} onChange={(e) => setBaseHeight(Number(e.target.value))} style={{ width: '100%' }} />
                  
                  {!hideTerrain && (
                    <>
                      <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '2px' }}>Vertical Scale: {verticalScale}x</label>
                      <input type="range" min="0.1" max="5" step="0.1" value={verticalScale} onChange={(e) => setVerticalScale(Number(e.target.value))} style={{ width: '100%' }} />

                      <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '2px' }}>Smoothing: {smoothing}</label>
                      <input type="range" min="0" max="10" step="1" value={smoothing} onChange={(e) => setSmoothing(Number(e.target.value))} style={{ width: '100%' }} />

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '5px' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem' }}>Max Height: {isUnlimitedHeight ? 'Unlimited' : `${maxHeight}m`}</label>
                        <label style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                          <input type="checkbox" checked={isUnlimitedHeight} onChange={(e) => setIsUnlimitedHeight(e.target.checked)} style={{ marginRight: '4px' }} />
                          No Limit
                        </label>
                      </div>
                      <input type="range" min="50" max="1000" step="50" value={maxHeight} disabled={isUnlimitedHeight} onChange={(e) => setMaxHeight(Number(e.target.value))} style={{ width: '100%', opacity: isUnlimitedHeight ? 0.5 : 1 }} />
                    </>
                  )}
                  
                  <div style={{ marginTop: '10px', borderTop: '1px solid #eee', paddingTop: '5px' }}>
                    <label style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', cursor: 'pointer', fontWeight: 'bold' }}>
                      <input type="checkbox" checked={hideTerrain} onChange={(e) => setHideTerrain(e.target.checked)} style={{ marginRight: '4px' }} />
                      Hide Terrain (Flat Base)
                    </label>
                    <p style={{ fontSize: '0.7rem', color: '#666', margin: '2px 0 0 20px' }}>
                      Replaces elevation data with a flat plane. Useful for printing road networks or GPX tracks only.
                    </p>
                  </div>
                </div>

                {/* Buildings Section */}
                <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #ddd', paddingBottom: '4px', marginBottom: '8px' }}>
                    <h4 style={{ margin: '0', fontSize: '0.9rem' }}>Buildings</h4>
                    <input type="checkbox" checked={showBuildings} onChange={(e) => setShowBuildings(e.target.checked)} />
                  </div>
                  {showBuildings && (
                    <>
                      <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '2px' }}>Vertical Scale: {buildingVerticalScale}x</label>
                      <input type="range" min="0.1" max="5" step="0.1" value={buildingVerticalScale} onChange={(e) => setBuildingVerticalScale(Number(e.target.value))} style={{ width: '100%' }} />
                      
                      <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '2px' }}>Horizontal Scale: {buildingHorizontalScale}x</label>
                      <input type="range" min="0.1" max="2.0" step="0.1" value={buildingHorizontalScale} onChange={(e) => setBuildingHorizontalScale(Number(e.target.value))} style={{ width: '100%' }} />
                    </>
                  )}
                </div>

                {/* Roads Section */}
                <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #ddd', paddingBottom: '4px', marginBottom: '8px' }}>
                    <h4 style={{ margin: '0', fontSize: '0.9rem' }}>Roads</h4>
                    <input type="checkbox" checked={showRoads} onChange={(e) => setShowRoads(e.target.checked)} />
                  </div>
                  {showRoads && (
                    <>
                      <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '2px' }}>Width Scale: {roadScale}x</label>
                      <input type="range" min="0.1" max="10" step="0.1" value={roadScale} onChange={(e) => setRoadScale(Number(e.target.value))} style={{ width: '100%' }} />
                      
                      <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '2px' }}>Height Scale: {roadHeightScale}x</label>
                      <input type="range" min="0.1" max="5" step="0.1" value={roadHeightScale} onChange={(e) => setRoadHeightScale(Number(e.target.value))} style={{ width: '100%' }} />
                    </>
                  )}
                </div>

                {/* Water Section */}
                <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #ddd', paddingBottom: '4px', marginBottom: '8px' }}>
                    <h4 style={{ margin: '0', fontSize: '0.9rem' }}>Water</h4>
                    <input type="checkbox" checked={showWater} onChange={(e) => setShowWater(e.target.checked)} />
                  </div>
                  {showWater && (
                    <>
                      <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '2px' }}>Depth: {waterDepth}m</label>
                      <input type="range" min="0" max="10" step="0.5" value={waterDepth} onChange={(e) => setWaterDepth(Number(e.target.value))} style={{ width: '100%' }} />
                    </>
                  )}
                </div>

                {/* GPX Section */}
                <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #ddd', paddingBottom: '4px', marginBottom: '8px' }}>
                    <h4 style={{ margin: '0', fontSize: '0.9rem' }}>GPX Track</h4>
                    <input type="checkbox" checked={showGpx} onChange={(e) => setShowGpx(e.target.checked)} />
                  </div>
                  {showGpx && (
                    <>
                      <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '2px' }}>Tube Radius: {gpxRadius}m</label>
                      <input type="range" min="0.5" max="30.0" step="0.5" value={gpxRadius} onChange={(e) => setGpxRadius(Number(e.target.value))} style={{ width: '100%' }} />
                      
                      <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '2px' }}>Height Offset: {gpxOffset}m</label>
                      <input type="range" min="-100" max="100" step="1" value={gpxOffset} onChange={(e) => setGpxOffset(Number(e.target.value))} style={{ width: '100%' }} />
                    </>
                  )}
                </div>

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
        <p>&copy; 2025 GeoPrint</p>
      </footer>
    </div>
  );
}

export default App;
