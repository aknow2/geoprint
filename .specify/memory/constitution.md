# PrintGeo Constitution

## Core Principles

### I. MVP First
Focus strictly on the core value proposition: selecting a map area and generating a printable STL. Avoid feature creep (e.g., complex terrain smoothing, user accounts, backend storage) until the core loop is solid.

### II. Component-Based Architecture
Build small, reusable React components. Logic should be separated from presentation using custom hooks. State should be local where possible, lifted only when necessary.

### III. Testability
Business logic (tile parsing, geometry generation) must be pure functions where possible and covered by unit tests. UI components should be tested for interaction.

### IV. Client-Side Only
The application must run entirely in the browser. No backend services are to be developed. All data fetching must happen directly from the client to third-party APIs (MapTiler).

## Technical Constraints

- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite
- **3D Engine**: Three.js (via @react-three/fiber is optional, but plain Three.js is specified in plan)
- **Styling**: CSS Modules or Tailwind (standard CSS specified in tasks)
- **Linting**: ESLint + Prettier

## Governance

**Version**: 1.0.0 | **Ratified**: 2025-11-21

<!-- Example: Version: 2.1.1 | Ratified: 2025-06-13 | Last Amended: 2025-07-16 -->
