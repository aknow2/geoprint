# MapTiler Planet / OpenMapTiles Water Layers Research

## 1. Layer Names

The OpenMapTiles schema separates water features into two main layers based on their geometry type and purpose:

*   **`water`**: Contains **polygonal** water features. This covers oceans, lakes, wide rivers, and other water bodies that have an area.
*   **`waterway`**: Contains **linear** water features. This covers rivers, streams, canals, and drains represented as lines (centerlines).
*   **`water_name`**: Contains lake center lines specifically for labelling purposes (not typically used for rendering geometry).

## 2. Attributes for Distinguishing Water Types

### `water` Layer (Polygons)
The `class` attribute is the primary discriminator for the type of water body.

*   **`class`**:
    *   `ocean`: Large bodies of water (from OpenStreetMapData).
    *   `lake`: Lakes and reservoirs.
    *   `river`: Water-covered areas of flowing water bodies (wide rivers).
    *   `dock`: Wet and dry docks.
    *   `pond`: Small water bodies.
    *   `swimming_pool`: Swimming pools.
*   **Other Attributes**:
    *   `intermittent`: `1` if the water body is intermittent (seasonal), `0` otherwise.
    *   `brunnel`: Indicates if the feature is part of a `bridge` or `tunnel`.

### `waterway` Layer (Lines)
The `class` attribute distinguishes the type of waterway.

*   **`class`**:
    *   `river`: Major flowing water bodies.
    *   `stream`: Smaller flowing water bodies.
    *   `canal`: Artificial waterways.
    *   `drain`: Small artificial waterways for drainage.
    *   `ditch`: Small artificial waterways.
*   **Other Attributes**:
    *   `intermittent`: `1` if the waterway is intermittent.
    *   `brunnel`: `bridge` or `tunnel`.

## 3. Distinguishing Linear vs. Polygonal Features

*   **Polygonal Features**: Are exclusively found in the **`water`** layer.
    *   *Note*: A river can appear in *both* layers. In the `water` layer, it appears as a polygon representing the riverbank/width (`class=river`). In the `waterway` layer, it appears as a line representing the flow path (`class=river`).
*   **Linear Features**: Are exclusively found in the **`waterway`** layer.

## 4. Filtering and Styling Considerations

*   **Tiling Artifacts**: Water polygons in the `water` layer are often split into smaller polygons for rendering performance.
    *   *Implication*: Avoid styling borders/strokes on `water` polygons, as the internal tile boundaries will become visible. Use fill colors only.
*   **Overlaps**: The `water` layer excludes covered water areas (`covered=yes`).
*   **Zoom Levels**:
    *   `waterway` features are typically available from zoom level 9+.
    *   Low zoom levels (z3-z8) for waterways use Natural Earth data.
*   **Intermittent Water**: Use the `intermittent=1` attribute to style seasonal water bodies (e.g., dashed outlines or lighter fill).
*   **Bridges/Tunnels**: Use the `brunnel` attribute to handle rendering order (e.g., water under bridges).
