import type { GpxPoint, GpxTrack } from "../types";

export const parseGpx = (gpxContent: string): GpxTrack => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(gpxContent, 'text/xml');
  
  const errorNode = xmlDoc.querySelector('parsererror');
  if (errorNode) {
    throw new Error('Error parsing GPX file');
  }

  const trk = xmlDoc.querySelector('trk');
  const name = trk?.querySelector('name')?.textContent || undefined;
  
  const segments: GpxPoint[][] = [];
  const trksegs = xmlDoc.querySelectorAll('trkseg');

  trksegs.forEach(seg => {
    const points: GpxPoint[] = [];
    const trkpts = seg.querySelectorAll('trkpt');
    
    trkpts.forEach(pt => {
      const lat = parseFloat(pt.getAttribute('lat') || '0');
      const lon = parseFloat(pt.getAttribute('lon') || '0');
      const eleNode = pt.querySelector('ele');
      const timeNode = pt.querySelector('time');
      
      const ele = eleNode ? parseFloat(eleNode.textContent || '0') : undefined;
      const time = timeNode ? timeNode.textContent || undefined : undefined;

      points.push({ lat, lon, ele, time });
    });

    if (points.length > 0) {
      segments.push(points);
    }
  });

  return { name, segments };
};
