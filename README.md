# GeoPrint

**GeoPrint** is a web application that allows users to select a geographical area on a map, generate a 3D terraced terrain model, and export it as an STL file for 3D printing.

[**View Demo**](https://aknow2.github.io/geoprint/)

## Features

- **Map Selection**: Interactively select a rectangular area on a map using MapTiler.
- **3D Terrain Generation**: Automatically fetches elevation data and generates a 3D mesh.
- **Customization**: Adjust base height, vertical scale, and smoothing.
- **Building & Road Integration**: Optionally include 3D buildings and roads in the model.
- **STL Export**: Download the generated 3D model as an STL file ready for slicing and printing.

## Development

### Prerequisites

- Node.js (v20 or later recommended)
- npm

### Setup

1.  Clone the repository:
    ```bash
    git clone https://github.com/aknow2/geoprint.git
    cd geoprint
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Set up Environment Variables:
    Create a `.env` file in the root directory and add your MapTiler API key:
    ```env
    VITE_MAPTILER_KEY=your_maptiler_api_key_here
    ```

### Running Locally

Start the development server:

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Build

To build the application for production:

```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory.

## Deployment

This project is configured to automatically deploy to GitHub Pages via GitHub Actions when changes are pushed to the `main` branch.

Ensure you have set the `VITE_MAPTILER_KEY` in your GitHub Repository Secrets for the build to succeed.
