# Karwaan Technical Handover Runbook

This is the definitive technical handover document for the **Karwaan** AI-powered multimodal freight consolidation and cold-chain risk prediction platform. It provides a complete reference for installing, seeding, running, retraining, and auditing the system.

---

## PART 0 — 5-MINUTE QUICK START

### 1. Prerequisites
*   **Node.js**: Version `v18.x` or `v20.x`
*   **Python**: Version `v3.10.x` or `v3.11.x` (with `pip` and virtual environment support)
*   **Database**: PostgreSQL connection URI (Neon PostgreSQL cloud instance recommended)
*   **Git**: CLI installed

### 2. Fast Setup Commands

From the workspace root directory (`d:\HACKATHON PROJECTS 2026\SIH 2026\SOA-Ideathon`):

```bash
# 1. Install Workspace Root & Frontend Dependencies
npm install
cd frontend
npm install
cd ../backend
npm install

# 2. Configure Environment Variables
# Copy template and fill DATABASE_URL and JWT_SECRET
cp .env.example .env

# 3. Apply Schema Migrations
npx drizzle-kit push:pg

# 4. Import & Seed CSV Data
npx ts-node db/seed.ts

# 5. Set up Python ML Subprocesses
# Install Pandas, Scikit-Learn, Joblib
cd models
python -m venv venv
venv\Scripts\activate
pip install pandas numpy scikit-learn joblib

# 6. Train Random Forest Models (Generates .pkl files)
python train_delay_model.py
python train_spoilage_model.py
cd ../..
```

### 3. Running the Application
Open two separate terminal windows:

*   **Terminal 1 (Backend Server)**:
    ```bash
    cd backend
    npm run dev
    ```
    *Listens on `http://localhost:3001`*

*   **Terminal 2 (Vite Frontend)**:
    ```bash
    cd frontend
    npm run dev
    ```
    *Vite server opens at `http://localhost:5173`*

### 4. Backdoor Demo Credentials
*   **Admin Mode**: `admin@karwaan.in` / `demo-access-2026`
*   **Business Mode**: `logistics@sahyadri.in` / `demo-access-2026` (Linked to `BIZ-01`)
*   **Agent/Driver Mode**: `agent1@karwaan.in` / `demo-access-2026`

---

## PART 1 — PROJECT AUDIT SUMMARY

An audit of the active codebase confirms:
1.  **Frontend**: Built on React, TypeScript, and Vite. Uses TailwindCSS for utility classes. Map component implements Leaflet hooks.
2.  **Backend**: Powered by Express + tsx watcher. Integrates Neon PostgreSQL via Drizzle ORM. Spawns Python subprocesses dynamically for machine learning scoring.
3.  **Data Models**: Database stores normalized entries (businesses, shipments, clusters, vehicles, routes, route_legs, incidents). Python ML models (`delay_rf_model.pkl`, `spoilage_rf_model.pkl`) load Random Forest classifiers built from historical CSV tables.
4.  **Decision Engine**: A rules-based spatial-temperature filter groups shipments before applying a multi-objective weighted utility optimizer.

---

## PART 2 — EXACT PROJECT DIRECTORY TREE

```
.
├── backend/
│   ├── controllers/
│   │   ├── authController.ts         # User logins and session token issuance
│   │   ├── demoController.ts         # Seed resetting endpoints
│   │   ├── recommendationsController.ts # Optimizing candidate plans
│   │   └── shipmentsController.ts    # Validating and logging shipment intake
│   ├── db/
│   │   ├── index.ts                  # PostgreSQL connection pooled driver
│   │   ├── schema.ts                 # Drizzle relational schemas
│   │   └── seed.ts                   # CSV mapping ingestion scripts
│   ├── middleware/
│   │   ├── auth.ts                   # JWT checks
│   │   └── fieldMasking.ts           # Tenant boundary data filters
│   ├── models/
│   │   ├── predict_delay.py          # Python delay classifier wrapper
│   │   ├── predict_spoilage.py       # Python spoilage classifier wrapper
│   │   ├── train_delay_model.py      # Delay trainer
│   │   └── train_spoilage_model.py   # Spoilage labeler & trainer
│   ├── services/
│   │   ├── consolidationEngine.ts    # Grouping matching and legs generation
│   │   ├── locationHelper.ts         # Geographical coordinates library
│   │   └── riskPrediction.ts         # Subprocess ML caller
│   ├── package.json
│   └── server.ts                     # Main entry port binding
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── MapView.tsx           # Leaflet path renderer
│   │   ├── pages/
│   │   │   ├── LandingPage.tsx       # Public branding landing portal
│   │   │   ├── RoleSelectionPage.tsx # Backdoor credentials autofills
│   │   │   ├── BusinessDashboard.tsx # MSME shipment logs and planner
│   │   │   └── AdminDashboard.tsx    # System telemetries and metrics
│   │   └── App.tsx                   # Routes definitions
│   └── package.json
├── hubs_clean.csv                    # Locations catalog
├── vehicles_clean.csv                # Fleet parameters
└── current_shipments_clean.csv       # Active shipment states
```

---

## PART 3 — WHAT IS KARWAAN?

Karwaan addresses **SOAIDEATHON-S17: AI-Based Multimodal Freight Consolidation and Cold-Chain Risk Prediction for MSME and Agri Logistics**.

### Real-World Problems Solved:
1.  **High Logistics Overhead**: MSME agri-shippers frequently pay full-truckload (FTL) rates for less-than-truckload (LTL) shipments. Karwaan matches compatible shippers to consolidate cargo.
2.  **Cold-Chain Decay**: Spoilage is common during multi-hour transits. Karwaan predicts spoilage risk using target temperature bounds.
3.  **Multimodal Utilization**: Integrating road transits with Kisan Rail lines reduces shipping costs and CO₂ emissions.

### Security Boundaries:
*   **MSMEs** only see their own cargo details and explainable recommendations. Raw scores and competitor pricing are masked.
*   **Admins** view system-wide coordinates, incidents, fleet metrics, and raw scoring details.

---

## PART 4 — SYSTEM ARCHITECTURE

```
                                +---------------------------+
                                |  MSME / Admin Browser UI  |
                                +---------------------------+
                                              |
                                              v (HTTP Request)
                                +---------------------------+
                                |  Express Backend Server   |
                                +---------------------------+
                                 /            |            \
                                /             |             \
                               v              v              v
                   +---------------+  +---------------+  +------------------------+
                   |  Drizzle ORM  |  | Consolidation |  | Python subprocess ML   |
                   |  (PostgreSQL) |  |   Engine      |  | (RandomForest Models)  |
                   +---------------+  +---------------+  +------------------------+
```

---

## PART 5 — FRONTEND DOCUMENTATION

### 1. Landing Page
*   **Route**: `/`
*   **Filename**: `frontend/src/pages/LandingPage.tsx`
*   **Access**: Public.
*   **Details**: Displays the value proposition: *"AI-powered multimodal freight consolidation and cold-chain risk intelligence for MSMEs."*
*   **Action**: Clicking "Launch Portal" routes users to `/roles`.

### 2. Role Selection Page
*   **Route**: `/roles`
*   **Filename**: `frontend/src/pages/RoleSelectionPage.tsx`
*   **Details**: Provides autofill selectors for Admin, Business (`logistics@sahyadri.in`), and Driver roles with the universal password (`demo-access-2026`). Routes to corresponding dashboards upon success.

### 3. Business Dashboard
*   **Route**: `/dashboard`
*   **Filename**: `frontend/src/pages/BusinessDashboard.tsx`
*   **Details**:
    *   Allows creating a shipment with strict temp limits and SLA parameters.
    *   "Find Best Plan" triggers the AI planning modal.
    *   Displays alternative routes, Leaflet leg coordinate maps, risk percentages, and explanations.

### 4. Admin Dashboard
*   **Route**: `/admin`
*   **Filename**: `frontend/src/pages/AdminDashboard.tsx`
*   **Details**: Monitor all consolidated clusters, system-wide delay alerts, active incidents, and raw multi-objective cost/time trade-off scores.

---

## PART 6 — MSME USER JOURNEY

```
[Create Shipment Form] -> POST /api/shipments -> Written to Drizzle table "shipments"
                               |
                               v
                     POST /api/recommendations/plan
                               |
       +-----------------------+-----------------------+
       |                                               |
       v                                               v
[consolidationEngine.recommendGrouping]      [riskPredictionService.predictCombinedRisk]
Check temp/route/capacity compatibility      Execute predict_spoilage/predict_delay python script
       |                                               |
       +-----------------------+-----------------------+
                               |
                               v
                     [recommendRoute Optimizer]
                Apply Weighted Multi-Objective Score
                               |
                               v
                     [Response JSON Payload]
               Mask internal scores; Return plans
```

---

## PART 7 — DATABASE DATA DICTIONARY

```
+------------------------+-------------------+------------------------------+
| Table Name             | Primary Key       | Foreign Keys                 |
+------------------------+-------------------+------------------------------+
| businesses             | id (varchar)      | None                         |
| users                  | id (varchar)      | businessId -> businesses.id  |
| hubs                   | id (varchar)      | None                         |
| vehicles               | id (varchar)      | None                         |
| shipments              | id (varchar)      | businessId -> businesses.id  |
| temperature_log_entries| id (uuid)         | shipmentId -> shipments.id   |
| consolidation_clusters | id (varchar)      | None                         |
| cluster_shipments      | (cluster,shipment)| clusterId, shipmentId        |
| delivery_routes        | id (varchar)      | clusterId -> clusters.id     |
| route_legs             | id (varchar)      | routeId -> routes.id         |
| incident_reports       | id (varchar)      | shipmentId -> shipments.id   |
+------------------------+-------------------+------------------------------+
```

---

## PART 8 — CSV DATA REFERENCE

The application seeds its initial database constraints using raw CSV files located at the workspace root:

1.  **`hubs_clean.csv`**: Contains physical hub names, coordinates, and rail access details.
2.  **`vehicles_clean.csv`**: Contains fleet capacity limits and temperature ranges.
3.  **`current_shipments_clean.csv`**: Contains baseline shipper requirements.

These files are parsed and uploaded to the database during seeding. They are not read at runtime.

---

## PART 9 — MACHINE LEARNING DETAILS

Karwaan uses two Random Forest classifiers to predict transportation risks:

### 1. Spoilage Prediction Model (`spoilage_rf_model.pkl`)
*   **Features**: `product_type`, `required_min_temp_c`, `required_max_temp_c`, `observed_avg_temp`, `observed_max_temp`, `observed_min_temp`, `temperature_excursion_minutes`, `observed_excursion_count`, `base_transit_hr`, `delay_minutes`, `transfer_count`, `weight_kg`.
*   **Target**: `spoiled_synthetic` (Boolean).
*   **Algorithm**: `RandomForestClassifier` (100 estimators, max depth 10).

### 2. Delay Prediction Model (`delay_rf_model.pkl`)
*   **Features**: `product_type`, `weight_kg`, `transport_mode`, `base_transit_hr`, `required_min_temp_c`, `required_max_temp_c`, `pickup_hour`, `delivery_deadline_hr`, `transfer_count`, `rain_flag`, `congestion_index`, `historical_route_reliability`, `route_reliability_feature`.
*   **Target**: `delayed` (Boolean).

---

## PART 10 — RETRAINING THE ML MODELS

To retrain both classifiers from scratch, run the following commands:

```bash
# 1. Navigate to backend models directory
cd backend/models

# 2. Activate Python Virtual Environment
venv\Scripts\activate

# 3. Run retraining scripts (will overwrite pkl files)
python train_delay_model.py
python train_spoilage_model.py
```

---

## PART 11 — CONSOLIDATION & OPTIMIZATION LOGIC

### Consolidation Matching
Shipments are eligible for grouping if they share an origin/destination and meet compatibility constraints:
```typescript
const tempCompatible = candidate.targetTempMin >= targetMin - 2 && candidate.targetTempMax <= targetMax + 2;
const locCompatible = candidate.origin === baseOrigin && candidate.destination === baseDest;
const fitsCapacity = currentWeight + candWeight <= maxGlobalCapacity;
```

### Multi-Objective Objective Function
Alternative candidate plans are evaluated and scored using a weighted utility function:
$$\text{Score} = (\bar{C} \times W_{\text{cost}}) + (\bar{D} \times W_{\text{delay}}) + (\bar{S} \times W_{\text{spoilage}}) + (\bar{T} \times W_{\text{transfers}})$$

Where:
*   $\bar{C}$ = Normalized Cost
*   $\bar{D}$ = Predicted Delay Probability (from ML model)
*   $\bar{S}$ = Predicted Spoilage Probability (from ML model)
*   $\bar{T}$ = Transfer penalty (0.1 per transfer point)

Weights are dynamically adjusted at runtime based on the user's preference (`lowest_cost`, `fastest`, or `safest`).

---

## PART 12 — TROUBLESHOOTING

| Symptom | Probable Cause | Action |
| :--- | :--- | :--- |
| **Model loading fails** | Missing Python virtual environment dependencies. | Run `pip install pandas numpy scikit-learn joblib` in `backend/models`. |
| **DB connection fails** | Invalid database URI configuration in `.env`. | Verify that the `DATABASE_URL` matches your PostgreSQL connection string. |
| **No feasible plan returned** | The shipment SLA window is shorter than the transit time. | The system returns a fallback road route and appends a warning banner to the explanation. |
