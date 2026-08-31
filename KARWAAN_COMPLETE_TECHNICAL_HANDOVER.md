# KARWAAN - COMPLETE TECHNICAL HANDOVER / RUNBOOK

## QUICK START: 5-MINUTE RUN GUIDE

If you just want to run the Karwaan application locally, follow these steps. For full architecture, ML training, and troubleshooting, read the complete document below.

**Prerequisites:**
- Node.js (v20+ recommended)
- Python (v3.10+ recommended) with pip
- A Neon Serverless Postgres `DATABASE_URL` (or any Postgres DB)

**Environment Setup:**
1. Clone the repository and open the root folder.
2. In `backend/`, copy `.env.example` to `.env` and set your `DATABASE_URL`.
3. In `frontend/`, copy `.env.example` to `.env` (if applicable) or use default local settings.

**Backend Setup (Terminal 1):**
```powershell
cd backend
npm install
npm run db:generate
npm run db:push
npm run seed
npm run dev
```
*(Backend runs on `http://localhost:3001`)*

**Frontend Setup (Terminal 2):**
```powershell
cd frontend
npm install
npm run dev
```
*(Frontend runs on `http://localhost:3000` or `http://localhost:5173` depending on Vite binding)*

**ML Setup (Terminal 3 - Optional if models already exist):**
```powershell
cd backend/models
pip install pandas numpy scikit-learn joblib
python train_delay_model.py
python train_spoilage_model.py
```
*(This generates `delay_rf_model.pkl` and `spoilage_rf_model.pkl` required for ML predictions)*

**Demo Login:**
Open the frontend URL. Click "Login".
- **Admin**: `admin@karwaan.in`
- **Business**: `logistics@sahyadri.in`
- (Password is standard/mocked by the backend for all demo users, e.g., anything or default if bypassed by frontend).

---

## PART 1 & 2: COMPLETE SYSTEM ARCHITECTURE & PROJECT STRUCTURE

Karwaan is split into a React (Vite) Frontend and a Node.js (Express) Backend. Machine learning is integrated via Python scripts called by the Node.js backend using subprocess execution. Data is stored in PostgreSQL via Drizzle ORM.

### Actual Folder Structure
```
root/
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── src/
│   │   ├── App.tsx             (Main routing)
│   │   ├── lib/apiClient.ts    (Fetch wrapper with Auth)
│   │   ├── pages/              (RoleSelection, Login, Business, Agent)
│   │   └── pages/admin/        (Admin dashboards)
├── backend/
│   ├── package.json
│   ├── server.ts               (Express entry point)
│   ├── db/
│   │   ├── schema.ts           (Drizzle table definitions)
│   │   └── seed.ts             (CSV parsing and database seeder)
│   ├── routes/                 (Express API routing definitions)
│   ├── controllers/            (API logic and service delegation)
│   ├── services/
│   │   ├── consolidationEngine.ts (Core grouping and routing logic)
│   │   └── riskPrediction.ts      (Python subprocess caller & physics heuristic)
│   └── models/
│       ├── train_delay_model.py
│       ├── train_spoilage_model.py
│       ├── predict_delay.py
│       └── predict_spoilage.py
└── *.csv                       (Raw cleaned datasets used by db/seed.ts)
```

**Architecture Flow:**
```
USER
  ↓
FRONTEND (React/Vite)
  ↓
API CLIENT (fetch)
  ↓
BACKEND (Express/Node.js) -> PYTHON SUBPROCESS (Scikit-Learn inference)
  ↓
SERVICES (Consolidation Engine, Risk Prediction)
  ↓
DATABASE (PostgreSQL via Drizzle ORM)
```

---

## PART 3: WHAT IS KARWAAN?

Karwaan solves the real-world logistics problem of fragmented, sub-optimal perishable goods transport (SOAIDEATHON-S17). 
MSMEs (Micro, Small & Medium Enterprises) often cannot afford dedicated refrigerated trucks. Karwaan pools their shipments together (Consolidation), selects the most optimal multimodal transport routes, and predicts delay and spoilage risks using AI.

- **MSMEs / Businesses** use Karwaan to submit shipments and get optimal route recommendations.
- **Admins / Operations** use Karwaan to monitor the entire network, view incidents, and manage the fleet.
- **Why AI?** To predict non-obvious risks (delays based on weather/traffic features, and spoilage based on thermal physics and past excursions).
- **Why Explainability?** Logistics managers won't trust an AI blindly. Karwaan explains *why* a route was chosen (e.g. "Multimodal rail achieved the lowest combined risk/cost score").

---

## PART 5: FRONTEND DOCUMENTATION

The frontend uses standard React Router (`src/App.tsx`).

### Core Pages
- **Landing Page** (`/`): `LandingPage.tsx`. Marketing and entry point.
- **Role Selection** (`/select-role`): `RoleSelectionPage.tsx`. User chooses Admin, Business, or Agent.
- **Login** (`/login/:role`): `LoginPage.tsx`. Authenticates and redirects.
- **Business Dashboard** (`/business`): `BusinessDashboard.tsx`. MSME view. Shows their active shipments, allows creating new shipments, viewing consolidation recommendations, and confirming plans.
- **Admin Dashboard** (`/admin`): `AdminDashboard.tsx`. Network overview.
- **Admin Sub-pages**: `/admin/shipments`, `/admin/clusters`, `/admin/routes`, `/admin/incidents`, `/admin/map`. Dedicated pages for operations managers.

---

## PART 6 & 7: USER JOURNEYS

### MSME User Journey
1. **Login**: Business user logs in.
2. **Dashboard**: Sees active shipments fetched via `apiClient.get('/shipments')`.
3. **Recommendation**: User clicks to see AI recommendations for a shipment.
4. **Backend Flow**: `recommendationsController.ts` calls `consolidationEngine.ts`. The engine matches the shipment with others (based on location/temp), generates routes (Road, Multimodal, Express), scores them by calling `riskPrediction.ts` (which spawns Python), and returns the ranked list.
5. **Selection**: User reviews the explanation and selects a route.

### Admin User Journey
1. **Login**: Admin logs in.
2. **Admin Dashboard**: Fetches network aggregates.
3. **Map**: `AdminMap.tsx` displays live vehicle positions and hubs (simulated based on DB data).
4. **Incidents**: `AdminIncidents.tsx` shows active alerts (e.g., temperature excursions) and allows managing them.

---

## PART 8: DATABASE COMPLETE REFERENCE

Managed by Drizzle ORM in `backend/db/schema.ts`.

- **users**: Stores authentication info. PK `id` (varchar).
- **businesses**: Represents MSMEs. PK `id`.
- **shipments**: Core cargo records. PK `id`. Tracks `cargo_type`, `targetTempMin/Max`, `weightKg`, `slaMaxDeliveryHours`. FK `business_id`.
- **hubs**: Physical cross-docking/rail terminals. Tracks `latitude`, `longitude`, `railAccess`.
- **vehicles**: Fleet information. Tracks `capacityKg`, `costPerKmInr`.
- **consolidation_clusters**: Groupings of compatible shipments.
- **cluster_shipments**: Many-to-many join table for clusters and shipments.
- **delivery_routes**: Physical transit plans assigned to clusters.
- **route_legs**: The segments (road -> rail -> road) of a route.
- **incident_reports**: Disruptions linked to shipments.
- **temperature_log_entries**: Time-series telemetry logs.

*Relationships are direct and defined strictly via Drizzle foreign keys.*

---

## PART 9 & 10: CSV DATA & INGESTION

### CSV Datasets (Located in root)
- `vehicles_clean.csv`: Base fleet.
- `routes_clean.csv`: Historical/known physical routes.
- `hubs_clean.csv`: Warehouse locations.
- `current_shipments_clean.csv`: Live operational shipments.
- `historical_shipments_clean.csv`: Past data used for training.
- `temperature_history_clean.csv`: Telemetry for historical shipments.

### Seeding Process (`backend/db/seed.ts`)
Run via `npm run seed`. 
The script reads the CSVs directly from the root directory using `csv-parse/sync`.
It is **idempotent** because it uses `onConflictDoNothing()` for batch inserts.
The script inserts hardcoded default users and businesses, then parses the CSVs to populate hubs, vehicles, routes, route_legs, vehicle_availability, and shipments.
*Important:* Data is copied into PostgreSQL. The application reads from Postgres at runtime, NOT from the CSVs.

---

## PART 11, 12, 13: MACHINE LEARNING REFERENCE

### 1. Delay Risk Model
- **Algorithm**: Random Forest Classifier (`sklearn.ensemble.RandomForestClassifier`)
- **Training Script**: `backend/models/train_delay_model.py`
- **Data Source**: `delay_training_ready.csv` (derived from historical shipments).
- **Features**: `product_type`, `transport_mode`, `weight_kg`, `base_transit_hr`, `required_min_temp_c`, etc.
- **Target**: `delayed` (boolean).
- **Artifact**: `delay_rf_model.pkl`

### 2. Spoilage Risk Model
- **Algorithm**: Random Forest Classifier
- **Training Script**: `backend/models/train_spoilage_model.py`
- **Data Source**: Synthetically generated during training (`historical_shipments_clean.csv` joined with `temperature_shipment_aggregates_AUDIT_ONLY.csv`).
- **Features**: `temperature_excursion_minutes`, `observed_max_temp`, `delay_minutes`, `transfer_count`, etc.
- **Target**: `spoiled_synthetic` (probabilistically generated based on physics heuristics).
- **Artifact**: `spoilage_rf_model.pkl`

### Retraining
To retrain from scratch:
1. Replace root CSVs.
2. `cd backend/models`
3. `python train_delay_model.py`
4. `python train_spoilage_model.py`
The `.pkl` files will be overwritten. Restart the backend to ensure no caching issues, though the subprocess loads the pickle file fresh on every request.

---

## PART 14 & 15: CONSOLIDATION & OPTIMIZATION ENGINE

Located in `backend/services/consolidationEngine.ts`.

**Algorithm Behavior:**
1. **Selection**: Iterates over unassigned shipments.
2. **Compatibility**: Checks if origin and destination are within a 50km radius (using an internal Haversine distance function with a 1.18 circuity factor).
3. **Temperature Rules**: Groups shipments if their required temperature bands overlap (±2°C).
4. **Capacity**: Ensures sum of `weightKg` does not exceed global vehicle maximum.
5. **Route Generation**: Generates 3 candidates:
   - *Direct Road*: Simple, reliable, standard cost.
   - *Multimodal*: Generated if distance > 200km and hubs have `railAccess`. Adds 2 transfers. High base cost but cheaper per km.
   - *Express*: Premium road transport for SLAs.
6. **Scoring / Optimization**: Computes a weighted score based on:
   `Cost (30%) + Duration (30%) + Delay Risk (20%) + Spoilage Risk (15%) + Transfers (5%)`.
   (Weights change dynamically if the user requests 'fastest' or 'lowest_cost').
7. The plan with the lowest score wins.

---

## PART 16 & 18: RISK PREDICTION & EXPLAINABILITY

Located in `backend/services/riskPrediction.ts`.

**Delay Risk**: Submits features to `predict_delay.py`. If python fails, falls back to a rule-based 30% heuristic.
**Spoilage Risk**: Combines an Arrhenius physics baseline (calculating kinetic shelf life lost based on Q10=2.5) with the ML risk probability from `predict_spoilage.py`.

**Explainability**:
The consolidation engine generates human-readable text based on the math.
For example, if multimodal wins: `"Multimodal rail achieved the lowest combined risk/cost score for this {distance}km corridor, offsetting intermediate transfer penalties."`

---

## PART 19 & 20: API REFERENCE

**Base URL**: `/api`

| Endpoint | Method | Purpose | Controller/Service |
|----------|--------|---------|--------------------|
| `/auth/login` | POST | Authenticates user | `authController.ts` |
| `/shipments` | GET | List user's shipments | `shipmentsController.ts` |
| `/shipments` | POST | Create shipment | `shipmentsController.ts` |
| `/recommendations/grouping` | GET/POST | Get consolidation clusters | `consolidationEngine.ts` |
| `/recommendations/route` | POST | Get route for cluster | `consolidationEngine.ts` |
| `/recommendations/plan` | POST | Unified engine output | `consolidationEngine.ts` |
| `/clusters` | GET | List clusters | `clustersController.ts` |
| `/incidents` | GET | List disruptions | `incidentsController.ts` |

**Connection Map Example:**
`BusinessDashboard.tsx` -> `apiClient.post('/recommendations/route')` -> `routes/recommendations.ts` -> `recommendationsController.recommendRoute` -> `consolidationEngine.recommendRoute` -> `riskPredictionService` -> `predict_delay.py` (Subprocess) -> Returns JSON to Frontend.

---

## PART 21: ENVIRONMENT VARIABLES

**Backend (`backend/.env`)**
- `DATABASE_URL`: Connection string for Postgres (Neon). (REQUIRED)
- `PORT`: (Optional) Default is 3001.

**Frontend (`frontend/.env`)**
- None strictly required. `apiClient.ts` hardcodes `http://localhost:3001/api`.

---

## PART 27: TROUBLESHOOTING

| Issue | Possible Cause | Fix |
|-------|---------------|-----|
| Frontend won't start / UI blank | Vite port conflict | Ensure port 3000/5173 is free. |
| Backend won't start | Missing `.env` | Create `.env` and set `DATABASE_URL`. |
| Database migration fails | Drizzle config error | Run `npm run db:generate` before `push`. |
| Seed script fails | CSV paths | Ensure terminal is inside the `backend/` folder when running `npm run seed`. |
| Recommendations return 500 | Python not installed / ML missing | Ensure Python 3 is in PATH. Run training scripts to generate `.pkl` files. |
| Models predict 'medium' always | Python subprocess failed | The engine is falling back to heuristics. Check backend terminal for Python traceback logs. |

---

## PART 28: COMMON DEVELOPMENT TASKS

- **Change DB Schema**: Edit `backend/db/schema.ts`, then run `npm run db:generate` and `npm run db:push`.
- **Change Optimization Weights**: Edit `DEFAULT_SCORE_WEIGHTS` in `backend/services/consolidationEngine.ts`.
- **Replace CSVs**: Overwrite files in the root directory, then run `npm run seed` inside `backend/`.

---

## PART 29 & 30: SECURITY & LIMITATIONS

**Security:**
Implemented simple JWT/Bcrypt authentication (`authController.ts`). 
*Not production grade.* Role-based access is present, but missing strict tenant isolation in all queries.

**Current Limitations / Simulations:**
- **Simulated Maps**: GPS coordinates and hubs map to hardcoded `KNOWN_COORDINATES` in `consolidationEngine.ts` to ensure Indian geography renders correctly.
- **Simulated Live Tracking**: Temperature logs are historical or mocked at runtime; there is no real IoT webhook currently ingesting data.
- **Python Subprocess**: Spawning Python for every API request is highly inefficient and not production-ready. A dedicated FastAPI/Flask inference server should be built for production.

---

## PART 31: JUDGE REQUIREMENT TRACEABILITY

| SOAIDEATHON REQUIREMENT | KARWAAN IMPLEMENTATION | STATUS |
|-------------------------|------------------------|--------|
| Shipment consolidation | `consolidationEngine.ts` grouping logic | IMPLEMENTED |
| Road/Rail/Local | `route_legs` and multimodal candidate generation | IMPLEMENTED |
| Spoilage prediction | `predict_spoilage.py` + Arrhenius physics | IMPLEMENTED |
| Delay prediction | `predict_delay.py` | IMPLEMENTED |
| Capacity/SLA | Checked during grouping and scoring | IMPLEMENTED |
| Explainability | Human-readable reasoning strings attached to plans | IMPLEMENTED |

---
*Generated based on actual source code state.*
