import { describe, it, expect } from 'vitest';
import { parseGpx } from './gpxParser';

describe('gpxParser', () => {
  it('should parse a simple GPX file', () => {
    const xml = `
      <gpx>
        <trk>
          <name>Test Track</name>
          <trkseg>
            <trkpt lat="35.0" lon="139.0">
              <ele>100.0</ele>
            </trkpt>
            <trkpt lat="35.1" lon="139.1">
              <ele>105.0</ele>
            </trkpt>
          </trkseg>
        </trk>
      </gpx>
    `;
    const result = parseGpx(xml);
    expect(result.name).toBe('Test Track');
    expect(result.segments.length).toBe(1);
    expect(result.segments[0].length).toBe(2);
    expect(result.segments[0][0]).toEqual({ lat: 35.0, lon: 139.0, ele: 100.0, time: undefined });
  });

  it('should handle multiple segments', () => {
    const xml = `
      <gpx>
        <trk>
          <trkseg>
            <trkpt lat="35.0" lon="139.0"></trkpt>
          </trkseg>
          <trkseg>
            <trkpt lat="35.2" lon="139.2"></trkpt>
          </trkseg>
        </trk>
      </gpx>
    `;
    const result = parseGpx(xml);
    expect(result.segments.length).toBe(2);
  });

  it('should throw error on invalid XML', () => {
    // Note: jsdom's DOMParser might be lenient, but usually produces parsererror for non-xml
    // However, "invalid xml" string might be parsed as text node in some cases.
    // Let's try a malformed tag.
    const xml = `<gpx><trk><name>Unclosed Tag`;
    expect(() => parseGpx(xml)).toThrow('Error parsing GPX file');
  });
});
