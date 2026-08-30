# Karwaan — Full-Stack Logistics Platform: Exhaustive Project Documentation

This document provides a highly detailed, file-by-file, code-level breakdown of the entire Karwaan platform. It explains exactly how every component connects, what data is transmitted, the algorithms used, and exactly what the UI looks like.

---

## 1. Project Overview & Core Architecture
Karwaan is a decoupled Full-Stack Agri-Logistics platform optimized for cold-chain consolidation, spoilage risk tracking, and multimodal routing (Road + Rail).
- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS v4, Framer Motion, Leaflet.
- **Backend**: Node.js, Express.js, TypeScript.
- **Database**: Serverless Neon PostgreSQL accessed via Drizzle ORM.

---

## 2. Exhaustive Frontend Breakdown (`/frontend`)

The frontend is a Single Page Application (SPA) structured around React Router.

### A. Routing & Entry (`src/App.tsx`)
- Wrapped in `<AuthProvider>` to inject user state universally.
- **Public Routes**: `/` (`LandingPage`), `/select-role`, `/login/:role`
- **Admin Routes**: Grouped under `/admin` using `<AdminLayout>`. Includes child routes: `AdminDashboard`, `AdminShipments`, `AdminClusters`, `AdminRoutes`, `AdminIncidents`, `AdminMap`.
- **Stakeholder Routes**: `/business` (`BusinessDashboard`), `/agent` (`AgentDashboard`).

### B. Exact UI Appearance & Styling (Tailwind)
The project strictly uses a custom Tailwind color palette to give a premium, agricultural-tech feel:
- **Primary Dark**: `#163832` (Deep Forest Green) - Used for headers, prominent buttons, and map hub markers.
- **Brand Green**: `#5C7A50` (Leaf Green) - Used for primary accents, success states, and optimal freshness indicators.
- **Warning/Risk**: `#D98E2B` (Amber) - Used for moderate spoilage risk.
- **Danger/Incident**: `#B3462C` (Rust Red) - Used for critical spoilage or disrupted routes.
- **Backgrounds**: `#F3F5F2` (Off-white/Grayish green) and `#FFFFFF` (Pure white cards).
- **Borders**: `#D6DCD4`.

### C. The Landing Page (`src/pages/LandingPage.tsx`)
- **Hero Section**: Features a value proposition for "Multimodal Consolidation & Spoilage Intelligence". It includes quantitative proof points hardcoded in the UI: "35-42% lower freight cost", "<1.8% transit spoilage loss", "4.2h saved via re-routing".
- **Visualizer**: embeds `<ConsolidationHeroVisualizer />` to dynamically show AI load pooling.
- **System Pillars**: Three cards using `lucide-react` icons: `Layers` (Consolidation), `ThermometerSnowflake` (Freshness Gauge), `Network` (Re-Routing).

### D. The Map Component (`src/components/KarwaanMap.tsx`)
This is the most complex UI component, built with Leaflet (`L.map`).
- **Configuration**: Hardcoded bounds for India `([6.0, 68.0] to [37.5, 98.0])`. Max zoom 18. Base tile layer is CartoDB Voyager.
- **Routes Layer**: Draws polylines. If the mode is `rail_cold_wagon`, it uses a dashed stroke (`dashArray: '8, 7'`) and color `#245249`. Road reefers use solid `#5C7A50`. If an incident is reported, the line turns `#B3462C`.
- **Shipment Markers**: Origin markers are circular SVG-style HTML divs colored by `getFreshnessColor(shipment.freshnessPercent)`. They contain emoji icons based on cargo type: 🍓 (berries), 🥭 (mangoes), 🍇 (grapes), 🧀 (dairy), 🥬 (vegetables).
- **Hub Markers**: Rectangular dark green tags (`#163832`) for major hubs like Bhubaneswar, Kolkata, and New Delhi.

### E. Data Fetching & Transmission (`src/services/dataService.ts`)
The `dataService` class encapsulates all API calls using an `apiClient` wrapper. Data is transmitted as JSON payloads.
- `getShipments()` calls `GET /api/shipments`.
- `createIncident(data)` posts a JSON payload with `routeId`, `shipmentId`, `type`, `locationName`, etc., to `POST /api/incidents`.
- `recommendRoute(clusterId, origin, dest)` calls `POST /api/recommendations/route` to trigger the backend AI algorithm.

---

## 3. Exhaustive Backend Breakdown (`/backend`)

The backend exposes a REST API via Express running on port `3001` (by default).

### A. API Routing (`server.ts` & `/routes`)
- `app.use(cors)` specifically whitelists `http://localhost:5173` and `3000`.
- Routes are mapped as follows:
  - `/api/health` -> Health checks.
  - `/api/auth` -> Simulated authentication.
  - `/api/shipments` -> CRUD for shipments.
  - `/api/clusters` -> Fetching grouped shipments.
  - `/api/routes` -> Deliveries.
  - `/api/incidents` -> Disruption reporting.
  - `/api/recommendations` -> AI routing and clustering logic.

### B. Database Schema (`db/schema.ts`)
The strict Drizzle ORM PostgreSQL schema mapping:
- **Enums**: `user_role` (admin, business, agent), `route_mode` (road_reefer, rail_cold_wagon, hub_transfer, local_transport), `incident_type` (vehicle_breakdown, temperature_excursion, etc.).
- **shipments**: `id`, `business_id`, `cargo_type`, `target_temp_min/max`, `current_temp`, `total_shelf_life_hours`, `remaining_shelf_life_hours`, `freshness_percent`, `sla_max_delivery_hours`.
- **consolidation_clusters**: Groupings containing `cost_savings_percent` and `co2_saved_kg`.
- **route_legs**: Breakdowns of `delivery_routes` with `sequence`, `mode`, `reliability_score`, `avg_delay_minutes`.

### C. The AI Consolidation Engine (`services/consolidationEngine.ts`)
This file contains the core logic for how the platform saves money and reduces CO2.
- **Route Scoring Algorithm**: Uses weighted multi-objective optimization to pick the best route.
  - `WEIGHT_COST = 0.4`
  - `WEIGHT_DELAY = 0.3`
  - `WEIGHT_SPOILAGE = 0.3`
- **Distance Calculation**: Uses a deterministic string-hashing function `getDeterministicDistance(origin, dest)` to simulate realistic km distances (between 100-1500 km) without needing live Google Maps API calls.
- **Financial/Emissions Math**:
  - **Solo Transport**: Assumes `₹0.05` per km per kg cost and `0.00015 kg` CO2 emissions per km per kg.
  - **Consolidated Transport**: Drops to `₹0.025` per km per kg cost and `0.00008 kg` CO2 emissions per km per kg.
  - The difference calculates the `costSavingsPercent` and `co2SavedKg` shown in the UI.
- **Candidate Generation**: The engine generates up to 3 candidate routes for a delivery:
  1. *Direct Road*: Simple, reliable, higher cost.
  2. *Multimodal*: If distance > 200km, it proposes Hub -> Rail (`rail_cold_wagon`) -> Hub. This massively reduces cost/CO2 but introduces higher avg delay risk.
  3. *Local Transport*: Only if distance <= 50km.
- The candidate with the lowest weighted score that doesn't violate SLA constraints is returned to the frontend.

### D. Risk Prediction (`services/riskPrediction.ts`)
(Called by the consolidation engine)
- Computes `spoilageRiskImpactHours` when an incident occurs.
- Models delay risk based on the historical `reliabilityScore` of specific `route_legs`.

---

## 4. End-to-End Execution Flow (How it all connects)

1. **User Action**: An Admin clicks "Generate Route" on the `AdminClusters.tsx` page for a newly formed cluster.
2. **Frontend Request**: The React component calls `dataService.recommendRoute(clusterId, origin, dest)`.
3. **Network Transmission**: A JSON payload `{ clusterId: "...", originName: "...", destName: "..." }` is sent via Axios `POST` to `http://localhost:3001/api/recommendations/route`.
4. **Backend Processing**: `recommendationsController.ts` parses the request and calls `consolidationEngine.recommendRoute()`.
5. **Algorithmic Math**: The engine calculates the deterministic distance, queries the DB for shipment SLA rules, generates Multimodal vs. Road candidates, scores them using the `0.4/0.3/0.3` weight matrix, and selects the winner.
6. **Database Write**: The backend saves this new Route and its `route_legs` into Neon Postgres via Drizzle ORM.
7. **JSON Response**: The engine returns the populated route object to the controller, which replies with `200 OK` and the JSON data.
8. **UI Update**: The frontend receives the data, updates React State. The `KarwaanMap.tsx` instantly reacts to the state change, drawing a new dashed rail line (`#245249`) or solid road line (`#5C7A50`) across the map interface.
