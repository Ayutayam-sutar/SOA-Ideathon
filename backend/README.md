# Karwaan Backend Services

This is the backend for the Karwaan Cold-Chain Consolidation platform, utilizing Node.js, Express, Drizzle ORM, and Neon Postgres (Serverless).

## Database Schema (ERD)

The database schema tightly mirrors the frontend's `types.ts` to seamlessly persist AI and business logic operations:

- **Users (`users`)**: Manages authentication and RBAC roles (`admin`, `business`, `agent`). Links optional `business_id`.
- **Businesses (`businesses`)**: Represents the Shippers/Agro-businesses utilizing the platform.
- **Shipments (`shipments`)**: Core perishable cargo records containing SLA bounds, active telemetry fields (`current_temp`, `freshness_percent`), and AI-derived predictive thresholds. Belongs to a Business.
- **IoT Telemetry (`temperature_log_entries`)**: Time-series log containing location and temperature pings for each shipment.
- **AI Groupings (`consolidation_clusters`)**: The core bin-packing entity created by the Consolidation Engine, storing predicted savings and aggregate capacities.
- **Cluster Mappings (`cluster_shipments`)**: Many-to-many join table mapping `shipments` securely into `consolidation_clusters`.
- **Delivery Routes (`delivery_routes`)**: The physical execution plan for a given `cluster_id`.
- **Route Legs (`route_legs`)**: Breakdown of a `delivery_route` into multimodal components (e.g., `road_reefer` to `rail_cold_wagon`).
- **Disruptions (`incident_reports`)**: Tracks disruptions (e.g., `temperature_excursion`) tied to specific `shipments` with AI-predicted impact risks.

## Developer Setup

1. Copy `.env.example` to `.env` and paste your Neon Serverless Postgres `DATABASE_URL`.
2. Generate schema migrations based on `db/schema.ts`:
   ```bash
   npm run db:generate
   ```
3. Push schema to your Neon Postgres database:
   ```bash
   npm run db:push
   ```
