import {
  User,
  Shipment,
  ConsolidationCluster,
  DeliveryRoute,
  IncidentReport,
  BusinessEntity,
  IncidentType,
  ShipmentStatus,
  RouteCorridor,
  TransportLegOption,
} from '../types';
import { riskPredictionService } from './riskPredictionService';



// Mock Businesses
export const INITIAL_BUSINESSES: BusinessEntity[] = [
  {
    id: 'BIZ-01',
    name: 'Sahyadri Agro Farms',
    category: 'Fresh Berries & Stone Fruits',
    region: 'Mahabaleshwar & Satara, Maharashtra',
    contactEmail: 'contact@sahyadriagro.in',
    contactPhone: '+91 98220 41230',
    activeShipmentsCount: 5,
    totalSavingsINR: 148500,
    totalCO2SavedKg: 420.5,
  },
  {
    id: 'BIZ-02',
    name: 'Konkan Coast Orchards',
    category: 'Alphonso Mangoes & Cashews',
    region: 'Ratnagiri, Maharashtra',
    contactEmail: 'ops@konkanorchards.com',
    contactPhone: '+91 98231 88402',
    activeShipmentsCount: 4,
    totalSavingsINR: 192000,
    totalCO2SavedKg: 512.0,
  },
  {
    id: 'BIZ-03',
    name: 'Nashik Valley Greens & Grapes',
    category: 'Table Grapes & Hydroponic Greens',
    region: 'Nashik, Maharashtra',
    contactEmail: 'logistics@nashikvalley.in',
    contactPhone: '+91 94222 71099',
    activeShipmentsCount: 5,
    totalSavingsINR: 164000,
    totalCO2SavedKg: 388.2,
  },
  {
    id: 'BIZ-04',
    name: 'Deccan Highlands Dairy & Fungi',
    category: 'Artisanal Cheese & Button Mushrooms',
    region: 'Baramati & Pune, Maharashtra',
    contactEmail: 'supply@deccanhighlands.in',
    contactPhone: '+91 97654 32100',
    activeShipmentsCount: 4,
    totalSavingsINR: 118200,
    totalCO2SavedKg: 295.8,
  },
];

// Mock Users
export const INITIAL_USERS: User[] = [
  {
    id: 'USR-ADMIN-01',
    name: 'Ananya Deshmukh',
    email: 'admin@karwaan.in',
    role: 'admin',
    title: 'Platform Logistics Operations Director',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'USR-BIZ-01',
    name: 'Rohit Kulkarni',
    email: 'contact@sahyadriagro.in',
    role: 'business',
    businessId: 'BIZ-01',
    businessName: 'Sahyadri Agro Farms',
    title: 'Supply Chain & Cold Chain Lead',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'USR-AGENT-01',
    name: 'Vikram Kadam',
    email: 'vikram.k@karwaan-logistics.in',
    role: 'agent',
    assignedRouteId: 'RT-MAHA-901',
    title: 'Reefer Route Fleet Captain',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  },
];

// 18 Initial Shipments
export const INITIAL_SHIPMENTS: Shipment[] = [
  {
    id: 'SHP-8821',
    code: 'SHP-8821',
    businessId: 'BIZ-01',
    businessName: 'Sahyadri Agro Farms',
    cargoType: 'Fresh Strawberries (Grade A)',
    category: 'berries',
    weightKg: 420,
    volumeCbm: 2.1,
    origin: {
      name: 'Sahyadri Farm Packhouse, Mahabaleshwar',
      lat: 17.9237,
      lng: 73.6586,
      address: 'Plot 14, Strawberry Valley Road, Mahabaleshwar, MH',
      hubCode: 'MHB-01',
    },
    destination: {
      name: 'Vashi APMC Premium Cold Hub, Navi Mumbai',
      lat: 19.0759,
      lng: 72.9984,
      address: 'Sector 19, Vashi Wholesale Terminal, Navi Mumbai',
      hubCode: 'VSH-HUB',
    },
    targetTempRange: { min: 1.5, max: 4.0 },
    currentTemp: 2.8,
    humidityPercent: 92,
    createdAt: '2026-08-15T06:30:00Z',
    dispatchTime: '2026-08-15T08:00:00Z',
    deliveryDeadline: '2026-08-16T12:00:00Z',
    totalShelfLifeHours: 72,
    remainingShelfLifeHours: 54,
    freshnessPercent: 75,
    status: 'in_transit',
    clusterId: 'CLST-MAHA-01',
    routeId: 'RT-MAHA-901',
    estimatedSoloCostINR: 19500,
    consolidatedCostINR: 12400,
    costSavingsPercent: 36,
    co2SavedKg: 48.2,
    assignedAgent: 'Vikram Kadam',
    consolidationReason: 'Consolidated into Western Ghats Reefer Corridors with Baramati Dairy and Mahabaleshwar Raspberries at 2-4°C thermal band.',
  },
  {
    id: 'SHP-8822',
    code: 'SHP-8822',
    businessId: 'BIZ-01',
    businessName: 'Sahyadri Agro Farms',
    cargoType: 'Organic Raspberries & Blueberries',
    category: 'berries',
    weightKg: 280,
    volumeCbm: 1.4,
    origin: {
      name: 'Panchgani High-Elevation Polyhouse',
      lat: 17.9240,
      lng: 73.8010,
      address: 'Survey 88, Table Land Rd, Panchgani, MH',
      hubCode: 'PNG-02',
    },
    destination: {
      name: 'Vashi APMC Premium Cold Hub, Navi Mumbai',
      lat: 19.0759,
      lng: 72.9984,
      address: 'Sector 19, Vashi Wholesale Terminal, Navi Mumbai',
      hubCode: 'VSH-HUB',
    },
    targetTempRange: { min: 1.0, max: 3.5 },
    currentTemp: 2.2,
    humidityPercent: 94,
    createdAt: '2026-08-15T07:00:00Z',
    dispatchTime: '2026-08-15T08:30:00Z',
    deliveryDeadline: '2026-08-16T10:00:00Z',
    totalShelfLifeHours: 60,
    remainingShelfLifeHours: 46,
    freshnessPercent: 76,
    status: 'in_transit',
    clusterId: 'CLST-MAHA-01',
    routeId: 'RT-MAHA-901',
    estimatedSoloCostINR: 16800,
    consolidatedCostINR: 10200,
    costSavingsPercent: 39,
    co2SavedKg: 38.5,
    assignedAgent: 'Vikram Kadam',
  },
  {
    id: 'SHP-8823',
    code: 'SHP-8823',
    businessId: 'BIZ-04',
    businessName: 'Deccan Highlands Dairy & Fungi',
    cargoType: 'Artisanal Goat & Buffalo Cheese',
    category: 'dairy',
    weightKg: 350,
    volumeCbm: 1.8,
    origin: {
      name: 'Baramati Micro-Creamery',
      lat: 18.1517,
      lng: 74.5775,
      address: 'MIDC Phase II, Baramati, MH',
      hubCode: 'BRM-01',
    },
    destination: {
      name: 'Bandra-Kurla Gourmet Distribution Centre',
      lat: 19.0607,
      lng: 72.8642,
      address: 'G-Block, BKC, Mumbai',
      hubCode: 'MUM-BKC',
    },
    targetTempRange: { min: 2.0, max: 5.0 },
    currentTemp: 3.4,
    humidityPercent: 80,
    createdAt: '2026-08-15T06:00:00Z',
    dispatchTime: '2026-08-15T09:15:00Z',
    deliveryDeadline: '2026-08-16T14:00:00Z',
    totalShelfLifeHours: 120,
    remainingShelfLifeHours: 102,
    freshnessPercent: 85,
    status: 'in_transit',
    clusterId: 'CLST-MAHA-01',
    routeId: 'RT-MAHA-901',
    estimatedSoloCostINR: 18200,
    consolidatedCostINR: 11500,
    costSavingsPercent: 37,
    co2SavedKg: 42.0,
    assignedAgent: 'Vikram Kadam',
  },
  {
    id: 'SHP-8824',
    code: 'SHP-8824',
    businessId: 'BIZ-02',
    businessName: 'Konkan Coast Orchards',
    cargoType: 'GI Alphonso Mangoes (Export Batch)',
    category: 'mangoes',
    weightKg: 1200,
    volumeCbm: 5.5,
    origin: {
      name: 'Pawapuri Coastal Orchards, Ratnagiri',
      lat: 16.9902,
      lng: 73.3120,
      address: 'Mirya Port Road, Ratnagiri, MH',
      hubCode: 'RTN-01',
    },
    destination: {
      name: 'Nagpur Central Multi-Modal Cold Hub',
      lat: 21.1458,
      lng: 79.0882,
      address: 'MIHAN SEZ Rail Freight Terminal, Nagpur',
      hubCode: 'NGP-RLH',
    },
    targetTempRange: { min: 11.0, max: 14.0 },
    currentTemp: 12.1,
    humidityPercent: 88,
    createdAt: '2026-08-15T05:00:00Z',
    dispatchTime: '2026-08-15T07:30:00Z',
    deliveryDeadline: '2026-08-17T18:00:00Z',
    totalShelfLifeHours: 144,
    remainingShelfLifeHours: 118,
    freshnessPercent: 82,
    status: 'in_transit',
    clusterId: 'CLST-MAHA-02',
    routeId: 'RT-MAHA-902',
    estimatedSoloCostINR: 48000,
    consolidatedCostINR: 28500,
    costSavingsPercent: 41,
    co2SavedKg: 142.0,
    assignedAgent: 'Suresh Patil',
    consolidationReason: 'Loaded onto Pune-Nagpur Dedicated Rail Kisan Cold Rake at Daund Junction, cutting transit friction by 18 hours vs solo highway trucking.',
  },
  {
    id: 'SHP-8825',
    code: 'SHP-8825',
    businessId: 'BIZ-02',
    businessName: 'Konkan Coast Orchards',
    cargoType: 'Semi-Ripe Alphonso Crates',
    category: 'mangoes',
    weightKg: 950,
    volumeCbm: 4.2,
    origin: {
      name: 'Deogad Taluka Packhouse, Sindhudurg',
      lat: 16.3768,
      lng: 73.3762,
      address: 'Harbour Road, Deogad, MH',
      hubCode: 'DGD-01',
    },
    destination: {
      name: 'Nagpur Central Multi-Modal Cold Hub',
      lat: 21.1458,
      lng: 79.0882,
      address: 'MIHAN SEZ Rail Freight Terminal, Nagpur',
      hubCode: 'NGP-RLH',
    },
    targetTempRange: { min: 11.0, max: 14.0 },
    currentTemp: 12.4,
    humidityPercent: 87,
    createdAt: '2026-08-15T05:30:00Z',
    dispatchTime: '2026-08-15T07:45:00Z',
    deliveryDeadline: '2026-08-17T20:00:00Z',
    totalShelfLifeHours: 160,
    remainingShelfLifeHours: 132,
    freshnessPercent: 83,
    status: 'in_transit',
    clusterId: 'CLST-MAHA-02',
    routeId: 'RT-MAHA-902',
    estimatedSoloCostINR: 42500,
    consolidatedCostINR: 25000,
    costSavingsPercent: 41,
    co2SavedKg: 128.5,
    assignedAgent: 'Suresh Patil',
  },
  {
    id: 'SHP-8826',
    code: 'SHP-8826',
    businessId: 'BIZ-03',
    businessName: 'Nashik Valley Greens & Grapes',
    cargoType: 'Thompson Seedless Export Grapes',
    category: 'grapes',
    weightKg: 1800,
    volumeCbm: 6.8,
    origin: {
      name: 'Dindori Vineyard Agro Hub, Nashik',
      lat: 20.2014,
      lng: 73.8340,
      address: 'Vani Road, Dindori, Nashik, MH',
      hubCode: 'NSK-01',
    },
    destination: {
      name: 'JNPT Port Reefer Terminal, Nhava Sheva',
      lat: 18.9499,
      lng: 72.9515,
      address: 'Container Freight Station 4, JNPT, MH',
      hubCode: 'JNPT-PORT',
    },
    targetTempRange: { min: -0.5, max: 1.5 },
    currentTemp: 0.8,
    humidityPercent: 95,
    createdAt: '2026-08-15T04:00:00Z',
    dispatchTime: '2026-08-15T06:15:00Z',
    deliveryDeadline: '2026-08-16T08:00:00Z',
    totalShelfLifeHours: 180,
    remainingShelfLifeHours: 160,
    freshnessPercent: 89,
    status: 'in_transit',
    clusterId: 'CLST-MAHA-03',
    routeId: 'RT-MAHA-903',
    estimatedSoloCostINR: 31000,
    consolidatedCostINR: 19800,
    costSavingsPercent: 36,
    co2SavedKg: 84.0,
    assignedAgent: 'Mahesh Jadhav',
  },
  {
    id: 'SHP-8827',
    code: 'SHP-8827',
    businessId: 'BIZ-03',
    businessName: 'Nashik Valley Greens & Grapes',
    cargoType: 'Hydroponic English Spinach & Kale',
    category: 'leafy_greens',
    weightKg: 290,
    volumeCbm: 2.6,
    origin: {
      name: 'Pimpalgaon Hydro Farm',
      lat: 20.1706,
      lng: 73.9872,
      address: 'Highway 84, Pimpalgaon Baswant, MH',
      hubCode: 'NSK-02',
    },
    destination: {
      name: 'South Mumbai Cloud Kitchen Network',
      lat: 18.9986,
      lng: 72.8258,
      address: 'Lower Parel Logistics Hub, Mumbai',
      hubCode: 'MUM-LPR',
    },
    targetTempRange: { min: 2.0, max: 4.5 },
    currentTemp: 3.1,
    humidityPercent: 96,
    createdAt: '2026-08-15T08:00:00Z',
    dispatchTime: '2026-08-15T09:30:00Z',
    deliveryDeadline: '2026-08-15T23:00:00Z',
    totalShelfLifeHours: 36,
    remainingShelfLifeHours: 22,
    freshnessPercent: 61,
    status: 'in_transit',
    clusterId: 'CLST-MAHA-03',
    routeId: 'RT-MAHA-903',
    estimatedSoloCostINR: 14500,
    consolidatedCostINR: 8800,
    costSavingsPercent: 39,
    co2SavedKg: 34.2,
    assignedAgent: 'Mahesh Jadhav',
  },
  {
    id: 'SHP-8828',
    code: 'SHP-8828',
    businessId: 'BIZ-04',
    businessName: 'Deccan Highlands Dairy & Fungi',
    cargoType: 'Fresh White Button Mushrooms',
    category: 'mushrooms',
    weightKg: 210,
    volumeCbm: 1.7,
    origin: {
      name: 'Talegaon Climate-Controlled Sheds',
      lat: 18.7351,
      lng: 73.6757,
      address: 'Old Pune-Mumbai Highway, Talegaon, MH',
      hubCode: 'TLG-01',
    },
    destination: {
      name: 'Vashi APMC Premium Cold Hub, Navi Mumbai',
      lat: 19.0759,
      lng: 72.9984,
      address: 'Sector 19, Vashi Wholesale Terminal, Navi Mumbai',
      hubCode: 'VSH-HUB',
    },
    targetTempRange: { min: 2.0, max: 4.0 },
    currentTemp: 5.6, // Mild temp excursion
    humidityPercent: 90,
    createdAt: '2026-08-15T07:30:00Z',
    dispatchTime: '2026-08-15T08:45:00Z',
    deliveryDeadline: '2026-08-16T04:00:00Z',
    totalShelfLifeHours: 40,
    remainingShelfLifeHours: 14,
    freshnessPercent: 35, // Low freshness - At risk!
    status: 'disrupted',
    clusterId: 'CLST-MAHA-01',
    routeId: 'RT-MAHA-901',
    estimatedSoloCostINR: 12500,
    consolidatedCostINR: 7600,
    costSavingsPercent: 39,
    co2SavedKg: 28.0,
    activeIncidentId: 'INC-4091',
    assignedAgent: 'Vikram Kadam',
    notes: 'Mild reefer compressor throttling reported near Lonavala ghat section.',
  },
  {
    id: 'SHP-8829',
    code: 'SHP-8829',
    businessId: 'BIZ-01',
    businessName: 'Sahyadri Agro Farms',
    cargoType: 'Mulberries & Cape Gooseberries',
    category: 'berries',
    weightKg: 160,
    volumeCbm: 0.9,
    origin: {
      name: 'Wai Foothills Nursery',
      lat: 17.9472,
      lng: 73.8938,
      address: 'Wai-Surur Road, Wai, MH',
      hubCode: 'WAI-01',
    },
    destination: {
      name: 'Pune Hadapsar Regional Cold Depot',
      lat: 18.5089,
      lng: 73.9259,
      address: 'Magarpatta Road, Hadapsar, Pune',
      hubCode: 'PUN-HDP',
    },
    targetTempRange: { min: 2.0, max: 5.0 },
    currentTemp: 3.0,
    humidityPercent: 91,
    createdAt: '2026-08-15T09:00:00Z',
    dispatchTime: '2026-08-15T11:00:00Z',
    deliveryDeadline: '2026-08-16T06:00:00Z',
    totalShelfLifeHours: 48,
    remainingShelfLifeHours: 42,
    freshnessPercent: 88,
    status: 'pending_consolidation',
    estimatedSoloCostINR: 9200,
    consolidatedCostINR: 5900,
    costSavingsPercent: 36,
    co2SavedKg: 19.5,
  },
  {
    id: 'SHP-8830',
    code: 'SHP-8830',
    businessId: 'BIZ-03',
    businessName: 'Nashik Valley Greens & Grapes',
    cargoType: 'Hydroponic Cherry Tomatoes',
    category: 'tomatoes',
    weightKg: 520,
    volumeCbm: 2.3,
    origin: {
      name: 'Sinnar Agro Tech Park',
      lat: 19.8456,
      lng: 73.9984,
      address: 'MIDC Malegaon, Sinnar, Nashik, MH',
      hubCode: 'SNR-01',
    },
    destination: {
      name: 'Indore Wholesale Agri Terminal',
      lat: 22.7196,
      lng: 75.8577,
      address: 'Chhotigwaltoli Road, Indore, MP',
      hubCode: 'IDR-TER',
    },
    targetTempRange: { min: 8.0, max: 12.0 },
    currentTemp: 9.8,
    humidityPercent: 85,
    createdAt: '2026-08-15T08:30:00Z',
    dispatchTime: '2026-08-15T12:00:00Z',
    deliveryDeadline: '2026-08-17T12:00:00Z',
    totalShelfLifeHours: 120,
    remainingShelfLifeHours: 108,
    freshnessPercent: 90,
    status: 'consolidated',
    clusterId: 'CLST-MAHA-04',
    routeId: 'RT-MAHA-904',
    estimatedSoloCostINR: 28000,
    consolidatedCostINR: 17200,
    costSavingsPercent: 38,
    co2SavedKg: 78.0,
    assignedAgent: 'Kiran Shinde',
  },
  {
    id: 'SHP-8831',
    code: 'SHP-8831',
    businessId: 'BIZ-02',
    businessName: 'Konkan Coast Orchards',
    cargoType: 'Organic Cashew Apples (Cold Press)',
    category: 'mangoes',
    weightKg: 440,
    volumeCbm: 1.9,
    origin: {
      name: 'Vengurla Research Station Hub',
      lat: 15.8606,
      lng: 73.6375,
      address: 'Camp Road, Vengurla, Sindhudurg, MH',
      hubCode: 'VNG-01',
    },
    destination: {
      name: 'Pune Hadapsar Regional Cold Depot',
      lat: 18.5089,
      lng: 73.9259,
      address: 'Magarpatta Road, Hadapsar, Pune',
      hubCode: 'PUN-HDP',
    },
    targetTempRange: { min: 4.0, max: 7.0 },
    currentTemp: 4.9,
    humidityPercent: 89,
    createdAt: '2026-08-15T06:15:00Z',
    dispatchTime: '2026-08-15T08:30:00Z',
    deliveryDeadline: '2026-08-16T18:00:00Z',
    totalShelfLifeHours: 64,
    remainingShelfLifeHours: 52,
    freshnessPercent: 81,
    status: 'in_transit',
    clusterId: 'CLST-MAHA-02',
    routeId: 'RT-MAHA-902',
    estimatedSoloCostINR: 24000,
    consolidatedCostINR: 14600,
    costSavingsPercent: 39,
    co2SavedKg: 64.0,
    assignedAgent: 'Suresh Patil',
  },
  {
    id: 'SHP-8832',
    code: 'SHP-8832',
    businessId: 'BIZ-04',
    businessName: 'Deccan Highlands Dairy & Fungi',
    cargoType: 'Fresh Mozzarella & Ricotta Curds',
    category: 'dairy',
    weightKg: 310,
    volumeCbm: 1.3,
    origin: {
      name: 'Baramati Micro-Creamery',
      lat: 18.1517,
      lng: 74.5775,
      address: 'MIDC Phase II, Baramati, MH',
      hubCode: 'BRM-01',
    },
    destination: {
      name: 'Vashi APMC Premium Cold Hub, Navi Mumbai',
      lat: 19.0759,
      lng: 72.9984,
      address: 'Sector 19, Vashi Wholesale Terminal, Navi Mumbai',
      hubCode: 'VSH-HUB',
    },
    targetTempRange: { min: 1.5, max: 3.5 },
    currentTemp: 2.1,
    humidityPercent: 82,
    createdAt: '2026-08-15T06:45:00Z',
    dispatchTime: '2026-08-15T09:15:00Z',
    deliveryDeadline: '2026-08-16T08:00:00Z',
    totalShelfLifeHours: 48,
    remainingShelfLifeHours: 38,
    freshnessPercent: 79,
    status: 'in_transit',
    clusterId: 'CLST-MAHA-01',
    routeId: 'RT-MAHA-901',
    estimatedSoloCostINR: 17500,
    consolidatedCostINR: 10800,
    costSavingsPercent: 38,
    co2SavedKg: 39.0,
    assignedAgent: 'Vikram Kadam',
  },
  {
    id: 'SHP-8833',
    code: 'SHP-8833',
    businessId: 'BIZ-01',
    businessName: 'Sahyadri Agro Farms',
    cargoType: 'Premium Table Strawberries (Punnets)',
    category: 'berries',
    weightKg: 380,
    volumeCbm: 1.9,
    origin: {
      name: 'Sahyadri Farm Packhouse, Mahabaleshwar',
      lat: 17.9237,
      lng: 73.6586,
      address: 'Plot 14, Strawberry Valley Road, Mahabaleshwar, MH',
      hubCode: 'MHB-01',
    },
    destination: {
      name: 'Pune Hadapsar Regional Cold Depot',
      lat: 18.5089,
      lng: 73.9259,
      address: 'Magarpatta Road, Hadapsar, Pune',
      hubCode: 'PUN-HDP',
    },
    targetTempRange: { min: 2.0, max: 4.0 },
    currentTemp: 2.9,
    humidityPercent: 93,
    createdAt: '2026-08-14T18:00:00Z',
    dispatchTime: '2026-08-15T05:00:00Z',
    deliveryDeadline: '2026-08-15T14:00:00Z',
    totalShelfLifeHours: 50,
    remainingShelfLifeHours: 39,
    freshnessPercent: 78,
    status: 'delivered',
    clusterId: 'CLST-MAHA-01',
    routeId: 'RT-MAHA-901',
    estimatedSoloCostINR: 14000,
    consolidatedCostINR: 8900,
    costSavingsPercent: 36,
    co2SavedKg: 31.0,
  },
  {
    id: 'SHP-8834',
    code: 'SHP-8834',
    businessId: 'BIZ-03',
    businessName: 'Nashik Valley Greens & Grapes',
    cargoType: 'Organic Roman Lettuce & Arugula',
    category: 'leafy_greens',
    weightKg: 240,
    volumeCbm: 2.2,
    origin: {
      name: 'Dindori Vineyard Agro Hub, Nashik',
      lat: 20.2014,
      lng: 73.8340,
      address: 'Vani Road, Dindori, Nashik, MH',
      hubCode: 'NSK-01',
    },
    destination: {
      name: 'Indore Wholesale Agri Terminal',
      lat: 22.7196,
      lng: 75.8577,
      address: 'Chhotigwaltoli Road, Indore, MP',
      hubCode: 'IDR-TER',
    },
    targetTempRange: { min: 2.0, max: 4.0 },
    currentTemp: 2.7,
    humidityPercent: 96,
    createdAt: '2026-08-15T09:30:00Z',
    dispatchTime: '2026-08-15T12:00:00Z',
    deliveryDeadline: '2026-08-16T18:00:00Z',
    totalShelfLifeHours: 42,
    remainingShelfLifeHours: 37,
    freshnessPercent: 88,
    status: 'consolidated',
    clusterId: 'CLST-MAHA-04',
    routeId: 'RT-MAHA-904',
    estimatedSoloCostINR: 19000,
    consolidatedCostINR: 11400,
    costSavingsPercent: 40,
    co2SavedKg: 46.0,
    assignedAgent: 'Kiran Shinde',
  },
  {
    id: 'SHP-8835',
    code: 'SHP-8835',
    businessId: 'BIZ-04',
    businessName: 'Deccan Highlands Dairy & Fungi',
    cargoType: 'Portobello & Oyster Mushrooms',
    category: 'mushrooms',
    weightKg: 190,
    volumeCbm: 1.5,
    origin: {
      name: 'Talegaon Climate-Controlled Sheds',
      lat: 18.7351,
      lng: 73.6757,
      address: 'Old Pune-Mumbai Highway, Talegaon, MH',
      hubCode: 'TLG-01',
    },
    destination: {
      name: 'Indore Wholesale Agri Terminal',
      lat: 22.7196,
      lng: 75.8577,
      address: 'Chhotigwaltoli Road, Indore, MP',
      hubCode: 'IDR-TER',
    },
    targetTempRange: { min: 2.0, max: 4.0 },
    currentTemp: 2.8,
    humidityPercent: 91,
    createdAt: '2026-08-15T10:00:00Z',
    dispatchTime: '2026-08-15T12:00:00Z',
    deliveryDeadline: '2026-08-16T22:00:00Z',
    totalShelfLifeHours: 50,
    remainingShelfLifeHours: 44,
    freshnessPercent: 88,
    status: 'consolidated',
    clusterId: 'CLST-MAHA-04',
    routeId: 'RT-MAHA-904',
    estimatedSoloCostINR: 18500,
    consolidatedCostINR: 11200,
    costSavingsPercent: 39,
    co2SavedKg: 44.5,
    assignedAgent: 'Kiran Shinde',
  },
  {
    id: 'SHP-8836',
    code: 'SHP-8836',
    businessId: 'BIZ-01',
    businessName: 'Sahyadri Agro Farms',
    cargoType: 'Frozen Organic Berry Pulp',
    category: 'berries',
    weightKg: 650,
    volumeCbm: 1.8,
    origin: {
      name: 'Sahyadri Farm Packhouse, Mahabaleshwar',
      lat: 17.9237,
      lng: 73.6586,
      address: 'Plot 14, Strawberry Valley Road, Mahabaleshwar, MH',
      hubCode: 'MHB-01',
    },
    destination: {
      name: 'Nagpur Central Multi-Modal Cold Hub',
      lat: 21.1458,
      lng: 79.0882,
      address: 'MIHAN SEZ Rail Freight Terminal, Nagpur',
      hubCode: 'NGP-RLH',
    },
    targetTempRange: { min: -18.0, max: -12.0 },
    currentTemp: -16.2,
    humidityPercent: 70,
    createdAt: '2026-08-15T10:30:00Z',
    dispatchTime: '2026-08-15T14:00:00Z',
    deliveryDeadline: '2026-08-18T12:00:00Z',
    totalShelfLifeHours: 720,
    remainingShelfLifeHours: 710,
    freshnessPercent: 98,
    status: 'pending_consolidation',
    estimatedSoloCostINR: 36000,
    consolidatedCostINR: 21500,
    costSavingsPercent: 40,
    co2SavedKg: 95.0,
    notes: 'Requires sub-zero blast freezer container; held for next deep-freeze rail rake consolidation.',
  },
  {
    id: 'SHP-8837',
    code: 'SHP-8837',
    businessId: 'BIZ-02',
    businessName: 'Konkan Coast Orchards',
    cargoType: 'Fresh Kokum & Cashew Fruit Fresh Juice',
    category: 'mangoes',
    weightKg: 300,
    volumeCbm: 1.1,
    origin: {
      name: 'Pawapuri Coastal Orchards, Ratnagiri',
      lat: 16.9902,
      lng: 73.3120,
      address: 'Mirya Port Road, Ratnagiri, MH',
      hubCode: 'RTN-01',
    },
    destination: {
      name: 'South Mumbai Cloud Kitchen Network',
      lat: 18.9986,
      lng: 72.8258,
      address: 'Lower Parel Logistics Hub, Mumbai',
      hubCode: 'MUM-LPR',
    },
    targetTempRange: { min: 2.0, max: 5.0 },
    currentTemp: 3.2,
    humidityPercent: 88,
    createdAt: '2026-08-15T11:00:00Z',
    dispatchTime: '2026-08-15T13:30:00Z',
    deliveryDeadline: '2026-08-16T12:00:00Z',
    totalShelfLifeHours: 48,
    remainingShelfLifeHours: 44,
    freshnessPercent: 92,
    status: 'pending_consolidation',
    estimatedSoloCostINR: 15500,
    consolidatedCostINR: 9800,
    costSavingsPercent: 37,
    co2SavedKg: 36.0,
  },
  {
    id: 'SHP-8838',
    code: 'SHP-8838',
    businessId: 'BIZ-03',
    businessName: 'Nashik Valley Greens & Grapes',
    cargoType: 'Exotic Dutch Red Cabbage & Broccoli',
    category: 'leafy_greens',
    weightKg: 410,
    volumeCbm: 2.5,
    origin: {
      name: 'Sinnar Agro Tech Park',
      lat: 19.8456,
      lng: 73.9984,
      address: 'MIDC Malegaon, Sinnar, Nashik, MH',
      hubCode: 'SNR-01',
    },
    destination: {
      name: 'JNPT Port Reefer Terminal, Nhava Sheva',
      lat: 18.9499,
      lng: 72.9515,
      address: 'Container Freight Station 4, JNPT, MH',
      hubCode: 'JNPT-PORT',
    },
    targetTempRange: { min: 1.0, max: 3.5 },
    currentTemp: 1.8,
    humidityPercent: 95,
    createdAt: '2026-08-15T04:30:00Z',
    dispatchTime: '2026-08-15T06:15:00Z',
    deliveryDeadline: '2026-08-16T08:00:00Z',
    totalShelfLifeHours: 120,
    remainingShelfLifeHours: 104,
    freshnessPercent: 86,
    status: 'in_transit',
    clusterId: 'CLST-MAHA-03',
    routeId: 'RT-MAHA-903',
    estimatedSoloCostINR: 18000,
    consolidatedCostINR: 11200,
    costSavingsPercent: 38,
    co2SavedKg: 42.0,
    assignedAgent: 'Mahesh Jadhav',
  },
];

// Consolidation Clusters
export const INITIAL_CLUSTERS: ConsolidationCluster[] = [
  {
    id: 'CLST-MAHA-01',
    code: 'CLST-MAHA-01',
    name: 'Western Ghats to Mumbai Reefer Corridor',
    originHub: {
      name: 'Shirwal Agro-Consolidation Central Hub',
      lat: 18.1367,
      lng: 73.9856,
      address: 'NH-48 Logistics Corridor, Shirwal, Satara, MH',
      hubCode: 'SHR-HUB',
    },
    destinationHub: {
      name: 'Vashi APMC Perishables Terminal',
      lat: 19.0759,
      lng: 72.9984,
      address: 'Sector 19, Vashi Wholesale Terminal, Navi Mumbai',
      hubCode: 'VSH-HUB',
    },
    shipmentIds: ['SHP-8821', 'SHP-8822', 'SHP-8823', 'SHP-8828', 'SHP-8832', 'SHP-8833'],
    totalWeightKg: 1870,
    maxCapacityKg: 2500,
    cargoCategories: ['berries', 'dairy', 'mushrooms'],
    tempBand: '1.5°C to 4.0°C (Deep Chill)',
    assignedRouteId: 'RT-MAHA-901',
    status: 'in_transit',
    costSavingsPercent: 37.4,
    co2SavedKg: 196.7,
    reeferLoadFactorPercent: 74.8,
    railUtilizationPercent: 0, // 100% Road Reefer direct
  },
  {
    id: 'CLST-MAHA-02',
    code: 'CLST-MAHA-02',
    name: 'Konkan-Nagpur Kisan Rail Cold Rake Corridor',
    originHub: {
      name: 'Chiplun Coastal Consolidation Hub',
      lat: 17.5323,
      lng: 73.5186,
      address: 'Khed Bypass, Chiplun, Ratnagiri, MH',
      hubCode: 'CHP-HUB',
    },
    destinationHub: {
      name: 'Nagpur MIHAN Multi-Modal Rail Terminal',
      lat: 21.1458,
      lng: 79.0882,
      address: 'MIHAN SEZ Rail Freight Terminal, Nagpur',
      hubCode: 'NGP-RLH',
    },
    shipmentIds: ['SHP-8824', 'SHP-8825', 'SHP-8831'],
    totalWeightKg: 2590,
    maxCapacityKg: 3000,
    cargoCategories: ['mangoes'],
    tempBand: '11.0°C to 14.0°C (Controlled Atmosphere Mangoes)',
    assignedRouteId: 'RT-MAHA-902',
    status: 'in_transit',
    costSavingsPercent: 41.0,
    co2SavedKg: 334.5,
    reeferLoadFactorPercent: 86.3,
    railUtilizationPercent: 72.5, // 72.5% distance traveled on Indian Railways cold rake
  },
  {
    id: 'CLST-MAHA-03',
    code: 'CLST-MAHA-03',
    name: 'Nashik Valley Exotics to Port Gateway',
    originHub: {
      name: 'Nashik Ozar Agro Cold Hub',
      lat: 20.0988,
      lng: 73.9189,
      address: 'Airport Road, Ozar, Nashik, MH',
      hubCode: 'OZR-HUB',
    },
    destinationHub: {
      name: 'JNPT Port Container Terminal',
      lat: 18.9499,
      lng: 72.9515,
      address: 'Container Freight Station 4, JNPT, MH',
      hubCode: 'JNPT-PORT',
    },
    shipmentIds: ['SHP-8826', 'SHP-8827', 'SHP-8838'],
    totalWeightKg: 2500,
    maxCapacityKg: 3000,
    cargoCategories: ['grapes', 'leafy_greens'],
    tempBand: '0.0°C to 2.5°C (Ultra-Cold Export)',
    assignedRouteId: 'RT-MAHA-903',
    status: 'in_transit',
    costSavingsPercent: 37.8,
    co2SavedKg: 160.2,
    reeferLoadFactorPercent: 83.3,
    railUtilizationPercent: 0,
  },
  {
    id: 'CLST-MAHA-04',
    code: 'CLST-MAHA-04',
    name: 'Central India Rail Inter-State Agro Corridor',
    originHub: {
      name: 'Manmad Central Rail Transshipment Hub',
      lat: 20.2524,
      lng: 74.4377,
      address: 'Railway Goods Shed Complex, Manmad, MH',
      hubCode: 'MMD-RLH',
    },
    destinationHub: {
      name: 'Indore Wholesale Terminal Rail Siding',
      lat: 22.7196,
      lng: 75.8577,
      address: 'Chhotigwaltoli Road, Indore, MP',
      hubCode: 'IDR-TER',
    },
    shipmentIds: ['SHP-8830', 'SHP-8834', 'SHP-8835'],
    totalWeightKg: 1120,
    maxCapacityKg: 2000,
    cargoCategories: ['tomatoes', 'leafy_greens', 'mushrooms'],
    tempBand: '4.0°C to 8.0°C (Mixed Veggies)',
    assignedRouteId: 'RT-MAHA-904',
    status: 'assembling',
    costSavingsPercent: 39.0,
    co2SavedKg: 168.5,
    reeferLoadFactorPercent: 56.0,
    railUtilizationPercent: 81.0,
  },
];

// Delivery Routes with Multimodal Legs & Stops
export const INITIAL_ROUTES: DeliveryRoute[] = [
  {
    id: 'RT-MAHA-901',
    code: 'RT-MAHA-901',
    clusterId: 'CLST-MAHA-01',
    clusterName: 'Western Ghats to Mumbai Reefer Corridor',
    name: 'Mahabaleshwar-Baramati-Vashi Fast Reefer Express',
    driverAgentId: 'USR-AGENT-01',
    driverAgentName: 'Vikram Kadam',
    driverAgentPhone: '+91 98220 11990',
    vehicleId: 'MH-12-RN-8840 (Tata LPT Reefer 14T)',
    currentLocation: [18.7557, 73.4091], // Currently near Khandala ghats
    currentLocationName: 'Khandala Ghat Descent (NH-48)',
    lastUpdated: '2026-08-15T11:20:00Z',
    status: 'incident_reported',
    activeIncidentId: 'INC-4091',
    legs: [
      {
        id: 'LEG-901-1',
        legNumber: 1,
        mode: 'road_reefer',
        originName: 'Mahabaleshwar Packhouse',
        destinationName: 'Shirwal Agro Hub',
        originCoords: [17.9237, 73.6586],
        destinationCoords: [18.1367, 73.9856],
        coordinates: [
          [17.9237, 73.6586],
          [17.9240, 73.8010],
          [17.9472, 73.8938],
          [18.0500, 73.9500],
          [18.1367, 73.9856],
        ],
        distanceKm: 68,
        durationHours: 2.2,
        vehicleId: 'MH-12-RN-8840',
        vehicleType: 'Reefer Truck (Multi-Temp)',
        carrier: 'Karwaan Fleet Operations',
        status: 'completed',
        avgSpeedKmh: 31,
        tempMonitored: true,
      },
      {
        id: 'LEG-901-2',
        legNumber: 2,
        mode: 'road_reefer',
        originName: 'Shirwal Agro Hub',
        destinationName: 'Talegaon Mushroom Facility',
        originCoords: [18.1367, 73.9856],
        destinationCoords: [18.7351, 73.6757],
        coordinates: [
          [18.1367, 73.9856],
          [18.3500, 73.8500],
          [18.5204, 73.8567],
          [18.6200, 73.7800],
          [18.7351, 73.6757],
        ],
        distanceKm: 86,
        durationHours: 2.4,
        vehicleId: 'MH-12-RN-8840',
        vehicleType: 'Reefer Truck (Multi-Temp)',
        carrier: 'Karwaan Fleet Operations',
        status: 'completed',
        avgSpeedKmh: 36,
        tempMonitored: true,
      },
      {
        id: 'LEG-901-3',
        legNumber: 3,
        mode: 'road_reefer',
        originName: 'Talegaon Mushroom Facility',
        destinationName: 'Vashi APMC Terminal, Navi Mumbai',
        originCoords: [18.7351, 73.6757],
        destinationCoords: [19.0759, 72.9984],
        coordinates: [
          [18.7351, 73.6757],
          [18.7557, 73.4091], // Lonavala / Khandala ghat
          [18.8900, 73.2200], // Khalapur Toll
          [18.9890, 73.1100], // Panvel
          [19.0759, 72.9984], // Vashi
        ],
        distanceKm: 98,
        durationHours: 3.1,
        vehicleId: 'MH-12-RN-8840',
        vehicleType: 'Reefer Truck (Multi-Temp)',
        carrier: 'Karwaan Fleet Operations',
        status: 'delayed',
        avgSpeedKmh: 24,
        tempMonitored: true,
      },
    ],
    stops: [
      {
        id: 'STP-901-1',
        type: 'pickup',
        name: 'Sahyadri Farm Packhouse, Mahabaleshwar',
        coords: [17.9237, 73.6586],
        address: 'Plot 14, Strawberry Valley Road, Mahabaleshwar',
        sequence: 1,
        scheduledTime: '08:00 AM',
        completedTime: '08:12 AM',
        isCompleted: true,
        shipmentIds: ['SHP-8821'],
        actionLabel: 'Loaded 420 kg Strawberries (Temp 2.4°C)',
        contactPerson: 'Kailas Shinde (+91 98220 41230)',
        tempRequirement: '1.5°C to 4.0°C',
      },
      {
        id: 'STP-901-2',
        type: 'pickup',
        name: 'Panchgani High-Elevation Polyhouse',
        coords: [17.9240, 73.8010],
        address: 'Survey 88, Table Land Rd, Panchgani',
        sequence: 2,
        scheduledTime: '08:45 AM',
        completedTime: '08:55 AM',
        isCompleted: true,
        shipmentIds: ['SHP-8822'],
        actionLabel: 'Loaded 280 kg Raspberries/Blueberries (Temp 2.1°C)',
        contactPerson: 'Deepak More (+91 98221 55431)',
        tempRequirement: '1.0°C to 3.5°C',
      },
      {
        id: 'STP-901-3',
        type: 'consolidation_hub',
        name: 'Shirwal Agro-Consolidation Central Hub',
        coords: [18.1367, 73.9856],
        address: 'NH-48 Logistics Corridor, Shirwal',
        sequence: 3,
        scheduledTime: '10:00 AM',
        completedTime: '10:18 AM',
        isCompleted: true,
        shipmentIds: ['SHP-8823', 'SHP-8832'],
        actionLabel: 'Transferred 660 kg Baramati Cheese & Curd crates',
        contactPerson: 'Hub Incharge Sanjay (+91 98220 99401)',
        tempRequirement: '1.5°C to 4.0°C',
      },
      {
        id: 'STP-901-4',
        type: 'pickup',
        name: 'Talegaon Mushroom Facility',
        coords: [18.7351, 73.6757],
        address: 'Old Pune-Mumbai Highway, Talegaon',
        sequence: 4,
        scheduledTime: '11:45 AM',
        completedTime: '12:05 PM',
        isCompleted: true,
        shipmentIds: ['SHP-8828'],
        actionLabel: 'Loaded 210 kg Button Mushrooms',
        contactPerson: 'Anil Date (+91 97654 32100)',
        tempRequirement: '2.0°C to 4.0°C',
        notes: 'Warning: Reefer rear zone recorded 5.6°C spike during loading.',
      },
      {
        id: 'STP-901-5',
        type: 'delivery',
        name: 'Vashi APMC Premium Cold Hub, Navi Mumbai',
        coords: [19.0759, 72.9984],
        address: 'Sector 19, Vashi Wholesale Terminal, Navi Mumbai',
        sequence: 5,
        scheduledTime: '03:30 PM',
        isCompleted: false,
        shipmentIds: ['SHP-8821', 'SHP-8822', 'SHP-8828', 'SHP-8832'],
        actionLabel: 'Deliver 1,220 kg cold cargo into Dock 4A',
        contactPerson: 'Terminal Officer R. Verma (+91 99201 44550)',
        tempRequirement: 'Cold dock intake inspection mandatory',
      },
      {
        id: 'STP-901-6',
        type: 'delivery',
        name: 'Bandra-Kurla Gourmet Distribution Centre',
        coords: [19.0607, 72.8642],
        address: 'G-Block, BKC, Mumbai',
        sequence: 6,
        scheduledTime: '05:00 PM',
        isCompleted: false,
        shipmentIds: ['SHP-8823'],
        actionLabel: 'Deliver 350 kg Artisanal Cheese',
        contactPerson: 'Store Manager Leena (+91 98200 12345)',
        tempRequirement: 'Direct cold room transfer',
      },
    ],
    explanation: {
      summary: 'Aggregated 5 small cold shipments across Mahabaleshwar, Baramati & Talegaon into a unified 14-tonne multi-temp reefer route.',
      multimodalAdvantage: 'Direct road reefer chosen over rail due to sub-200 km distance where road point-to-point transit is 4.5 hours faster than rail terminal handling times, keeping ultra-perishable berries and mushrooms safely within freshness threshold.',
      thermalCompatibility: 'All grouped items share the 1.5°C to 4.0°C cold envelope. Zero volatile ethylene emitters included.',
      timingOptimization: 'Scheduled departures timed to bypass morning Pune bypass congestion and reach Mumbai terminals before afternoon wholesale auction closes.',
      exclusionNotes: 'SHP-8836 (Frozen Berry Pulp at -18°C) was excluded from this cluster because mixing deep-frozen and chilled produce violates HACCP thermal compliance.',
      rerouteHistory: [
        {
          timestamp: '2026-08-15T11:15:00Z',
          trigger: 'INC-4091 (Ghat section traffic bottleneck & mild reefer compressor strain near Khandala)',
          actionTaken: 'Triggered Karwaan Real-Time Re-Route Engine: Diverted from old highway onto Express Highway lane 1 with high-flow aux chill boost.',
          previousETA: '02:45 PM',
          newETA: '03:30 PM',
          savedFreshnessHours: 4.8,
        },
      ],
    },
  },
  {
    id: 'RT-MAHA-902',
    code: 'RT-MAHA-902',
    clusterId: 'CLST-MAHA-02',
    clusterName: 'Konkan-Nagpur Kisan Rail Cold Rake Corridor',
    name: 'Konkan Coast to Nagpur Kisan Rail Multimodal Express',
    driverAgentId: 'USR-AGENT-02',
    driverAgentName: 'Suresh Patil',
    driverAgentPhone: '+91 98223 90812',
    vehicleId: 'Indian Railways Cold Rake #CR-KZN-408 + Feeder Reefer MH-08-AG-3321',
    currentLocation: [18.4632, 74.5821], // Daund Junction Rail Hub
    currentLocationName: 'Daund Junction Kisan Cold Rail Yard',
    lastUpdated: '2026-08-15T10:45:00Z',
    status: 'in_transit',
    legs: [
      {
        id: 'LEG-902-1',
        legNumber: 1,
        mode: 'road_reefer',
        originName: 'Ratnagiri & Deogad Coastal Orchards',
        destinationName: 'Daund Junction Kisan Rail Yard',
        originCoords: [16.9902, 73.3120],
        destinationCoords: [18.4632, 74.5821],
        coordinates: [
          [16.9902, 73.3120],
          [16.3768, 73.3762],
          [17.5323, 73.5186],
          [17.9800, 74.1200],
          [18.4632, 74.5821],
        ],
        distanceKm: 285,
        durationHours: 6.8,
        vehicleId: 'MH-08-AG-3321 (Feeder Reefer)',
        vehicleType: 'Feeder Reefer Truck',
        carrier: 'Konkan Logistics Coop',
        status: 'completed',
        avgSpeedKmh: 42,
        tempMonitored: true,
      },
      {
        id: 'LEG-902-2',
        legNumber: 2,
        mode: 'rail_cold_wagon',
        originName: 'Daund Junction Kisan Rail Siding',
        destinationName: 'Nagpur MIHAN Multi-Modal Rail Terminal',
        originCoords: [18.4632, 74.5821],
        destinationCoords: [21.1458, 79.0882],
        coordinates: [
          [18.4632, 74.5821],
          [19.1000, 75.2000],
          [19.8700, 75.3400],
          [20.5000, 76.2000],
          [20.7000, 77.0000],
          [20.9000, 77.7500],
          [21.1458, 79.0882],
        ],
        distanceKm: 640,
        durationHours: 11.5,
        vehicleId: 'IR Kisan Rail Rake #CR-408',
        vehicleType: 'Refrigerated Rail Wagon (20T)',
        carrier: 'Indian Railways (Kisan Rail Special)',
        status: 'in_progress',
        avgSpeedKmh: 56,
        tempMonitored: true,
      },
    ],
    stops: [
      {
        id: 'STP-902-1',
        type: 'pickup',
        name: 'Pawapuri Coastal Orchards, Ratnagiri',
        coords: [16.9902, 73.3120],
        address: 'Mirya Port Road, Ratnagiri',
        sequence: 1,
        scheduledTime: '05:30 AM',
        completedTime: '05:40 AM',
        isCompleted: true,
        shipmentIds: ['SHP-8824'],
        actionLabel: 'Loaded 1,200 kg Export Alphonso Mangoes',
        tempRequirement: '11.0°C to 14.0°C',
      },
      {
        id: 'STP-902-2',
        type: 'pickup',
        name: 'Deogad Taluka Packhouse',
        coords: [16.3768, 73.3762],
        address: 'Harbour Road, Deogad',
        sequence: 2,
        scheduledTime: '06:45 AM',
        completedTime: '07:02 AM',
        isCompleted: true,
        shipmentIds: ['SHP-8825'],
        actionLabel: 'Loaded 950 kg Semi-Ripe Alphonso Crates',
        tempRequirement: '11.0°C to 14.0°C',
      },
      {
        id: 'STP-902-3',
        type: 'rail_loading',
        name: 'Daund Junction Kisan Rail Yard',
        coords: [18.4632, 74.5821],
        address: 'Railway Cold Siding, Daund, MH',
        sequence: 3,
        scheduledTime: '01:30 PM',
        completedTime: '01:50 PM',
        isCompleted: true,
        shipmentIds: ['SHP-8824', 'SHP-8825', 'SHP-8831'],
        actionLabel: 'Transshipped 2,590 kg onto Kisan Rail Wagon #4',
        tempRequirement: 'Continuous plug-in generator cooling',
      },
      {
        id: 'STP-902-4',
        type: 'rail_unloading',
        name: 'Nagpur MIHAN Multi-Modal Rail Terminal',
        coords: [21.1458, 79.0882],
        address: 'MIHAN SEZ Rail Freight Terminal, Nagpur',
        sequence: 4,
        scheduledTime: '06:00 AM (Next Day)',
        isCompleted: false,
        shipmentIds: ['SHP-8824', 'SHP-8825'],
        actionLabel: 'Offload to Vidarbha Central Cold Storage Docks',
        tempRequirement: '11.0°C to 14.0°C intake',
      },
    ],
    explanation: {
      summary: 'Combined long-distance Alphonso mango shipments from Ratnagiri and Deogad via road feeder into Indian Railways Kisan Cold Rake at Daund.',
      multimodalAdvantage: 'Shifting 640 km of long-haul linehaul from highway trucks to Indian Railways Kisan Cold Rake yields a 41% cost reduction and saves 334.5 kg of CO2 emissions. The stable train ride also reduces crate vibration bruising by 78%.',
      thermalCompatibility: 'All cargo is Alphonso mangoes and cashew derivatives operating in the identical 11°C-14°C Controlled Atmosphere range to prevent chilling injury (blackening of skin below 9°C).',
      timingOptimization: 'Feeder road pickup scheduled early morning to connect directly with the 02:00 PM scheduled Kisan Rail Express departure from Daund.',
      exclusionNotes: 'No chilled dairy or greens mixed into this rake because low temperatures (<5°C) would cause irreversible chilling injury to mangoes.',
    },
  },
  {
    id: 'RT-MAHA-903',
    code: 'RT-MAHA-903',
    clusterId: 'CLST-MAHA-03',
    clusterName: 'Nashik Valley Exotics to Port Gateway',
    name: 'Nashik Agro-Corridor to JNPT Maritime Export Line',
    driverAgentId: 'USR-AGENT-03',
    driverAgentName: 'Mahesh Jadhav',
    driverAgentPhone: '+91 94220 87311',
    vehicleId: 'MH-15-EM-4091 (BharatBenz 16T Reefer)',
    currentLocation: [19.5300, 73.3200], // Kasara Ghats
    currentLocationName: 'Kasara Ghat Descent (NH-160)',
    lastUpdated: '2026-08-15T11:00:00Z',
    status: 'in_transit',
    legs: [
      {
        id: 'LEG-903-1',
        legNumber: 1,
        mode: 'road_reefer',
        originName: 'Dindori Vineyard Agro Hub',
        destinationName: 'Pimpalgaon & Sinnar Hubs',
        originCoords: [20.2014, 73.8340],
        destinationCoords: [20.0988, 73.9189],
        coordinates: [
          [20.2014, 73.8340],
          [20.1706, 73.9872],
          [19.8456, 73.9984],
          [20.0988, 73.9189],
        ],
        distanceKm: 72,
        durationHours: 2.1,
        vehicleId: 'MH-15-EM-4091',
        vehicleType: 'Heavy Reefer',
        carrier: 'Nashik Agro Cold Logistics',
        status: 'completed',
        avgSpeedKmh: 34,
        tempMonitored: true,
      },
      {
        id: 'LEG-903-2',
        legNumber: 2,
        mode: 'road_reefer',
        originName: 'Nashik Ozar Hub',
        destinationName: 'JNPT Port Container Terminal',
        originCoords: [20.0988, 73.9189],
        destinationCoords: [18.9499, 72.9515],
        coordinates: [
          [20.0988, 73.9189],
          [19.8500, 73.6500],
          [19.5300, 73.3200], // Kasara Ghat
          [19.2400, 73.1300], // Kalyan Bypass
          [19.0759, 72.9984], // Navi Mumbai
          [18.9499, 72.9515], // JNPT
        ],
        distanceKm: 188,
        durationHours: 4.8,
        vehicleId: 'MH-15-EM-4091',
        vehicleType: 'Heavy Reefer',
        carrier: 'Nashik Agro Cold Logistics',
        status: 'in_progress',
        avgSpeedKmh: 39,
        tempMonitored: true,
      },
    ],
    stops: [
      {
        id: 'STP-903-1',
        type: 'pickup',
        name: 'Dindori Vineyard Agro Hub, Nashik',
        coords: [20.2014, 73.8340],
        address: 'Vani Road, Dindori, Nashik',
        sequence: 1,
        scheduledTime: '06:00 AM',
        completedTime: '06:15 AM',
        isCompleted: true,
        shipmentIds: ['SHP-8826'],
        actionLabel: 'Loaded 1,800 kg Thompson Seedless Grapes',
        tempRequirement: '-0.5°C to 1.5°C',
      },
      {
        id: 'STP-903-2',
        type: 'pickup',
        name: 'Pimpalgaon Hydro Farm',
        coords: [20.1706, 73.9872],
        address: 'Highway 84, Pimpalgaon Baswant',
        sequence: 2,
        scheduledTime: '07:00 AM',
        completedTime: '07:18 AM',
        isCompleted: true,
        shipmentIds: ['SHP-8827'],
        actionLabel: 'Loaded 290 kg Hydroponic Spinach/Kale',
        tempRequirement: '2.0°C to 4.5°C',
      },
      {
        id: 'STP-903-3',
        type: 'delivery',
        name: 'South Mumbai Cloud Kitchen Network',
        coords: [18.9986, 72.8258],
        address: 'Lower Parel Logistics Hub, Mumbai',
        sequence: 3,
        scheduledTime: '01:30 PM',
        isCompleted: false,
        shipmentIds: ['SHP-8827'],
        actionLabel: 'Offload greens to Lower Parel rapid distribution hub',
        tempRequirement: 'Immediate refrigeration intake',
      },
      {
        id: 'STP-903-4',
        type: 'delivery',
        name: 'JNPT Port Reefer Terminal, Nhava Sheva',
        coords: [18.9499, 72.9515],
        address: 'Container Freight Station 4, JNPT',
        sequence: 4,
        scheduledTime: '03:45 PM',
        isCompleted: false,
        shipmentIds: ['SHP-8826', 'SHP-8838'],
        actionLabel: 'Transfer export grape containers to Maersk Reefer plug-in',
        tempRequirement: '-0.5°C to 1.5°C export protocol',
      },
    ],
    explanation: {
      summary: 'Consolidated high-value export grapes and city-bound hydroponic salad greens along the Nashik-Kasara Ghat-Mumbai freight expressway.',
      multimodalAdvantage: 'Direct heavy multi-zone reefer truck optimizes turnaround to meet evening customs clearance cutoff at JNPT port.',
      thermalCompatibility: 'Utilizes dual-evaporator multi-zone reefer: Zone 1 chilled to 0.5°C for grapes, Zone 2 maintained at 3.0°C for delicate salad greens.',
      timingOptimization: 'Departed pre-dawn from Dindori to cross Kasara Ghat prior to heavy container truck buildup.',
    },
  },
  {
    id: 'RT-MAHA-904',
    code: 'RT-MAHA-904',
    clusterId: 'CLST-MAHA-04',
    clusterName: 'Central India Rail Inter-State Agro Corridor',
    name: 'Manmad-Indore Multi-Modal Inter-State Line',
    driverAgentId: 'USR-AGENT-04',
    driverAgentName: 'Kiran Shinde',
    driverAgentPhone: '+91 94231 44090',
    vehicleId: 'Indian Railways Kisan Reefer #WCR-882 + Shunt Reefer MH-15-DC-9011',
    currentLocation: [20.2524, 74.4377],
    currentLocationName: 'Manmad Central Rail Freight Siding',
    lastUpdated: '2026-08-15T11:10:00Z',
    status: 'scheduled',
    legs: [
      {
        id: 'LEG-904-1',
        legNumber: 1,
        mode: 'road_reefer',
        originName: 'Sinnar & Talegaon Packhouses',
        destinationName: 'Manmad Central Rail Siding',
        originCoords: [19.8456, 73.9984],
        destinationCoords: [20.2524, 74.4377],
        coordinates: [
          [19.8456, 73.9984],
          [20.0000, 74.2000],
          [20.2524, 74.4377],
        ],
        distanceKm: 65,
        durationHours: 1.8,
        vehicleId: 'MH-15-DC-9011',
        vehicleType: 'Feeder Reefer',
        carrier: 'Sinnar Agro Fleet',
        status: 'in_progress',
        avgSpeedKmh: 36,
        tempMonitored: true,
      },
      {
        id: 'LEG-904-2',
        legNumber: 2,
        mode: 'rail_cold_wagon',
        originName: 'Manmad Central Rail Siding',
        destinationName: 'Indore Wholesale Terminal Rail Siding',
        originCoords: [20.2524, 74.4377],
        destinationCoords: [22.7196, 75.8577],
        coordinates: [
          [20.2524, 74.4377],
          [20.8000, 74.8000],
          [21.3000, 75.2000],
          [21.8000, 75.6000],
          [22.7196, 75.8577],
        ],
        distanceKm: 420,
        durationHours: 8.5,
        vehicleId: 'IR Kisan Reefer #WCR-882',
        vehicleType: 'Refrigerated Rail Wagon',
        carrier: 'West Central Railway',
        status: 'pending',
        avgSpeedKmh: 49,
        tempMonitored: true,
      },
    ],
    stops: [
      {
        id: 'STP-904-1',
        type: 'pickup',
        name: 'Sinnar Agro Tech Park, Nashik',
        coords: [19.8456, 73.9984],
        address: 'MIDC Malegaon, Sinnar, Nashik',
        sequence: 1,
        scheduledTime: '12:00 PM',
        isCompleted: false,
        shipmentIds: ['SHP-8830', 'SHP-8834'],
        actionLabel: 'Load 760 kg Tomatoes & Salad Greens',
        tempRequirement: '4.0°C to 8.0°C',
      },
      {
        id: 'STP-904-2',
        type: 'rail_loading',
        name: 'Manmad Central Rail Siding',
        coords: [20.2524, 74.4377],
        address: 'Railway Goods Shed Complex, Manmad',
        sequence: 2,
        scheduledTime: '02:30 PM',
        isCompleted: false,
        shipmentIds: ['SHP-8830', 'SHP-8834', 'SHP-8835'],
        actionLabel: 'Transfer to West Central Railway Cold Rake #882',
        tempRequirement: 'Verify unbroken cold chain telemetry',
      },
      {
        id: 'STP-904-3',
        type: 'delivery',
        name: 'Indore Wholesale Terminal Rail Siding',
        coords: [22.7196, 75.8577],
        address: 'Chhotigwaltoli Road, Indore, MP',
        sequence: 3,
        scheduledTime: '02:00 AM (Next Day)',
        isCompleted: false,
        shipmentIds: ['SHP-8830', 'SHP-8834', 'SHP-8835'],
        actionLabel: 'Final delivery to Madhya Pradesh Cold Grid',
        tempRequirement: '4.0°C to 8.0°C intake',
      },
    ],
    explanation: {
      summary: 'Inter-state rail bridge moving Nashik and Talegaon produce to central India mandi markets.',
      multimodalAdvantage: 'Avoids 450 km of bumpy single-lane border highways, cutting spoilage loss from vibration from 14% to under 1.5%.',
      thermalCompatibility: 'Standard chilled vegetable profile (4-8°C).',
      timingOptimization: 'Direct overnight express arrival ready for 4 AM Indore wholesale trading.',
    },
  },
];

// Initial Incidents
export const INITIAL_INCIDENTS: IncidentReport[] = [
  {
    id: 'INC-4091',
    code: 'INC-4091',
    routeId: 'RT-MAHA-901',
    routeCode: 'RT-MAHA-901',
    shipmentId: 'SHP-8828',
    shipmentCode: 'SHP-8828',
    cargoType: 'Fresh White Button Mushrooms',
    agentId: 'USR-AGENT-01',
    agentName: 'Vikram Kadam',
    type: 'temperature_excursion',
    severity: 'high',
    reportedAt: '2026-08-15T11:05:00Z',
    locationName: 'Khandala Ghat Descent (NH-48 Old Road)',
    locationCoords: [18.7557, 73.4091],
    notes: 'Secondary reefer compressor unit #2 showed mild thermal throttling on steep ghat incline. Rear cabin temp rose to 5.6°C (target max 4.0°C). Traffic congestion at Amrutanjan bridge holding convoy.',
    status: 'open',
    spoilageRiskImpactHours: 12,
    suggestedAction: 'Reroute via Mumbai-Pune Expressway Fast Track Lane 1 and engage auxiliary cryogenic coolant booster.',
  },
  {
    id: 'INC-4089',
    code: 'INC-4089',
    routeId: 'RT-MAHA-903',
    routeCode: 'RT-MAHA-903',
    shipmentId: 'SHP-8827',
    shipmentCode: 'SHP-8827',
    cargoType: 'Hydroponic English Spinach & Kale',
    agentId: 'USR-AGENT-03',
    agentName: 'Mahesh Jadhav',
    type: 'traffic_delay',
    severity: 'moderate',
    reportedAt: '2026-08-15T09:40:00Z',
    locationName: 'Igatpuri-Kasara Tunnel Entrance',
    locationCoords: [19.6980, 73.5520],
    notes: 'Container truck breakdown in tunnel caused 35-minute standstill. Reefer operational and holding 3.1°C.',
    status: 'resolved',
    spoilageRiskImpactHours: 3,
    suggestedAction: 'Resume standard route with priority dock unloading slot at Lower Parel.',
    resolvedAt: '2026-08-15T10:25:00Z',
  },
];

// --- ENRICH MOCK DATA WITH PREDICTIVE FIELDS ---
INITIAL_SHIPMENTS.forEach(shipment => {
  shipment.temperatureHistory = Array.from({ length: 5 }).map((_, i) => ({
    timestamp: new Date(Date.now() - (5 - i) * 3600000).toISOString(),
    temp: Number((shipment.currentTemp + (Math.random() * 2 - 1)).toFixed(1)),
    location: [shipment.origin.lat + (Math.random() * 0.1), shipment.origin.lng + (Math.random() * 0.1)]
  }));
  shipment.slaConstraint = {
    maxDeliveryHours: shipment.totalShelfLifeHours * 0.8,
    maxSpoilagePercent: 15,
    priority: shipment.category === 'berries' || shipment.category === 'leafy_greens' ? 'high' : 'medium'
  };
  shipment.spoilageRiskScore = Math.floor(Math.random() * 40) + (shipment.status === 'disrupted' ? 50 : 10);
  shipment.spoilageRiskLevel = shipment.spoilageRiskScore > 80 ? 'critical' : shipment.spoilageRiskScore > 50 ? 'high' : shipment.spoilageRiskScore > 20 ? 'medium' : 'low';
  shipment.delayRiskScore = Math.floor(Math.random() * 40) + 10;
  shipment.delayRiskLevel = shipment.delayRiskScore > 80 ? 'critical' : shipment.delayRiskScore > 50 ? 'high' : shipment.delayRiskScore > 20 ? 'medium' : 'low';
});

INITIAL_CLUSTERS.forEach(cluster => {
  cluster.slaConstraint = {
    maxDeliveryHours: 72,
    maxSpoilagePercent: 10,
    priority: 'high'
  };
});

INITIAL_ROUTES.forEach(route => {
  route.spoilageRiskScore = Math.floor(Math.random() * 30) + (route.status === 'incident_reported' ? 60 : 10);
  route.spoilageRiskLevel = route.spoilageRiskScore > 80 ? 'critical' : route.spoilageRiskScore > 50 ? 'high' : route.spoilageRiskScore > 20 ? 'medium' : 'low';
  route.delayRiskScore = Math.floor(Math.random() * 30) + (route.status === 'incident_reported' ? 60 : 10);
  route.delayRiskLevel = route.delayRiskScore > 80 ? 'critical' : route.delayRiskScore > 50 ? 'high' : route.delayRiskScore > 20 ? 'medium' : 'low';
});

export const INITIAL_CORRIDORS: RouteCorridor[] = [
  { id: 'CORR-01', originName: 'Mahabaleshwar', destinationName: 'Vashi', mode: 'road_reefer', historicalReliabilityScore: 92, avgDelayMinutes: 45, onTimePercent: 88 },
  { id: 'CORR-02', originName: 'Ratnagiri', destinationName: 'Nagpur', mode: 'rail_cold_wagon', historicalReliabilityScore: 95, avgDelayMinutes: 120, onTimePercent: 91 }
];

export const INITIAL_LEG_OPTIONS: TransportLegOption[] = [
  { mode: 'road_reefer', capacityUnits: 14000, costPerUnit: 22, avgDelayMinutes: 45, reliabilityScore: 88, onTimePercent: 85 },
  { mode: 'rail_cold_wagon', capacityUnits: 20000, costPerUnit: 15, avgDelayMinutes: 120, reliabilityScore: 95, onTimePercent: 92 }
];

// In-Memory Data Store with reactive subscription system
class DataService {
  private businesses: BusinessEntity[] = [...INITIAL_BUSINESSES];
  private users: User[] = [...INITIAL_USERS];
  private shipments: Shipment[] = [...INITIAL_SHIPMENTS];
  private clusters: ConsolidationCluster[] = [...INITIAL_CLUSTERS];
  private routes: DeliveryRoute[] = [...INITIAL_ROUTES];
  private incidents: IncidentReport[] = [...INITIAL_INCIDENTS];
  private activeUser: User | null = INITIAL_USERS[0]; // default admin
  private listeners: Set<() => void> = new Set();

  constructor() {
    // Load from localStorage if present
    this.loadFromStorage();
  }

  private saveToStorage() {
    try {
      localStorage.setItem('karwaan_shipments', JSON.stringify(this.shipments));
      localStorage.setItem('karwaan_clusters', JSON.stringify(this.clusters));
      localStorage.setItem('karwaan_routes', JSON.stringify(this.routes));
      localStorage.setItem('karwaan_incidents', JSON.stringify(this.incidents));
      if (this.activeUser) {
        localStorage.setItem('karwaan_active_user', JSON.stringify(this.activeUser));
      }
    } catch {
      // ignore storage errors
    }
  }

  private loadFromStorage() {
    try {
      const storedShipments = localStorage.getItem('karwaan_shipments');
      if (storedShipments) this.shipments = JSON.parse(storedShipments);

      const storedClusters = localStorage.getItem('karwaan_clusters');
      if (storedClusters) this.clusters = JSON.parse(storedClusters);

      const storedRoutes = localStorage.getItem('karwaan_routes');
      if (storedRoutes) this.routes = JSON.parse(storedRoutes);

      const storedIncidents = localStorage.getItem('karwaan_incidents');
      if (storedIncidents) this.incidents = JSON.parse(storedIncidents);

      const storedUser = localStorage.getItem('karwaan_active_user');
      if (storedUser) this.activeUser = JSON.parse(storedUser);
    } catch {
      // fallback to initial
    }
  }

  public subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.saveToStorage();
    this.listeners.forEach((listener) => listener());
  }

  // --- Auth & User ---
  public getActiveUser(): User {
    if (!this.activeUser) {
      this.activeUser = this.users[0];
    }
    return this.activeUser;
  }

  public setActiveUser(user: User) {
    this.activeUser = user;
    this.notify();
  }

  public authenticate(email: string, _password?: string, role?: string): User {
    // find user by email or by role
    let found = this.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!found && role) {
      found = this.users.find((u) => u.role === role);
    }
    if (!found) {
      // fallback
      found = this.users[0];
    }
    this.activeUser = found;
    this.notify();
    return found;
  }

  public getUsers(): User[] {
    return [...this.users];
  }

  public getBusinesses(): BusinessEntity[] {
    return [...this.businesses];
  }

  public getBusinessById(id: string): BusinessEntity | undefined {
    return this.businesses.find((b) => b.id === id);
  }

  // --- Masking Helpers ---
  private maskShipmentForRole(s: Shipment): Shipment {
    const role = this.activeUser?.role;
    if (role === 'admin') return s;
    
    if (role === 'agent') {
      return {
        ...s,
        estimatedSoloCostINR: 0,
        consolidatedCostINR: 0,
        costSavingsPercent: 0,
        businessName: 'Confidential Shipper',
        origin: { ...s.origin, address: s.origin.address.substring(0, 15) + '...' },
        destination: { ...s.destination, address: s.destination.address.substring(0, 15) + '...' },
      };
    }
    
    if (role === 'business' && s.businessId !== this.activeUser?.id) {
      return {
        ...s,
        estimatedSoloCostINR: 0,
        consolidatedCostINR: 0,
        costSavingsPercent: 0,
        businessName: 'Confidential Shipper',
      };
    }
    
    return s;
  }

  private maskClusterForRole(c: ConsolidationCluster): ConsolidationCluster {
    const role = this.activeUser?.role;
    if (role === 'admin') return c;
    
    if (role === 'agent' || role === 'business') {
      return {
        ...c,
        costSavingsPercent: 0,
      };
    }
    
    return c;
  }

  // --- Enrichment Helpers ---
  private enrichShipment(s: Shipment): Shipment {
    const route = s.routeId ? this.routes.find(r => r.id === s.routeId) : undefined;
    if (route) {
      const combined = riskPredictionService.predictCombinedRisk(s, route);
      return {
        ...s,
        spoilageRiskScore: combined.spoilageRisk.score,
        spoilageRiskLevel: combined.spoilageRisk.level,
        delayRiskScore: combined.delayRisk.score,
        delayRiskLevel: combined.delayRisk.level,
      };
    }
    const spoilageRisk = riskPredictionService.predictSpoilageRisk(s);
    return {
      ...s,
      spoilageRiskScore: spoilageRisk.score,
      spoilageRiskLevel: spoilageRisk.level,
    };
  }

  private enrichRoute(r: DeliveryRoute): DeliveryRoute {
    const risk = riskPredictionService.predictDelayRisk(r, r.legs);
    return {
      ...r,
      delayRiskScore: risk.score,
      delayRiskLevel: risk.level,
    };
  }

  // --- Shipments ---
  public getShipments(): Shipment[] {
    return this.shipments.map((s) => this.maskShipmentForRole(this.enrichShipment(s)));
  }

  public getShipmentById(id: string): Shipment | undefined {
    const s = this.shipments.find((s) => s.id === id || s.code === id);
    return s ? this.maskShipmentForRole(this.enrichShipment(s)) : undefined;
  }

  public getShipmentsByBusiness(businessId: string): Shipment[] {
    return this.shipments.filter((s) => s.businessId === businessId).map((s) => this.maskShipmentForRole(this.enrichShipment(s)));
  }

  public createShipment(data: {
    businessId: string;
    cargoType: string;
    category: Shipment['category'];
    weightKg: number;
    volumeCbm: number;
    originName: string;
    originLat: number;
    originLng: number;
    originAddress: string;
    destinationName: string;
    destinationLat: number;
    destinationLng: number;
    destinationAddress: string;
    targetTempMin: number;
    targetTempMax: number;
    deliveryDeadline: string;
    notes?: string;
  }): Shipment {
    const biz = this.businesses.find((b) => b.id === data.businessId) || this.businesses[0];
    const newId = `SHP-${Math.floor(8840 + Math.random() * 1000)}`;

    const soloCost = Math.round(data.weightKg * 22 + 8500);
    const consolidatedCost = Math.round(soloCost * 0.62);
    const savingsPercent = Math.round(((soloCost - consolidatedCost) / soloCost) * 100);
    const co2Saved = Number((data.weightKg * 0.085).toFixed(1));

    const totalShelfLife = data.category === 'berries' ? 60 : data.category === 'mushrooms' ? 48 : data.category === 'leafy_greens' ? 40 : 120;

    const newShipment: Shipment = {
      id: newId,
      code: newId,
      businessId: biz.id,
      businessName: biz.name,
      cargoType: data.cargoType,
      category: data.category,
      weightKg: data.weightKg,
      volumeCbm: data.volumeCbm,
      origin: {
        name: data.originName,
        lat: data.originLat,
        lng: data.originLng,
        address: data.originAddress,
        hubCode: 'ORIGIN-HUB',
      },
      destination: {
        name: data.destinationName,
        lat: data.destinationLat,
        lng: data.destinationLng,
        address: data.destinationAddress,
        hubCode: 'DEST-HUB',
      },
      targetTempRange: {
        min: data.targetTempMin,
        max: data.targetTempMax,
      },
      currentTemp: Number(((data.targetTempMin + data.targetTempMax) / 2).toFixed(1)),
      humidityPercent: 90,
      createdAt: new Date().toISOString(),
      dispatchTime: new Date(Date.now() + 2 * 3600000).toISOString(),
      deliveryDeadline: data.deliveryDeadline || new Date(Date.now() + 36 * 3600000).toISOString(),
      totalShelfLifeHours: totalShelfLife,
      remainingShelfLifeHours: totalShelfLife,
      freshnessPercent: 100,
      status: 'pending_consolidation',
      estimatedSoloCostINR: soloCost,
      consolidatedCostINR: consolidatedCost,
      costSavingsPercent: savingsPercent,
      co2SavedKg: co2Saved,
      consolidationReason: `Optimal cluster match identified with 3 other ${biz.category} shipments heading towards Western Maharashtra hub corridor.`,
      notes: data.notes,
    };

    this.shipments.unshift(newShipment);
    biz.activeShipmentsCount += 1;
    biz.totalSavingsINR += soloCost - consolidatedCost;
    biz.totalCO2SavedKg += co2Saved;

    this.notify();
    return newShipment;
  }

  // --- Clusters & Routes ---
  public getClusters(): ConsolidationCluster[] {
    return this.clusters.map(c => this.maskClusterForRole(c));
  }

  public getClusterById(id: string): ConsolidationCluster | undefined {
    const c = this.clusters.find((c) => c.id === id || c.code === id);
    return c ? this.maskClusterForRole(c) : undefined;
  }

  public getRoutes(): DeliveryRoute[] {
    return this.routes.map((r) => this.enrichRoute(r));
  }

  public getRouteById(id: string): DeliveryRoute | undefined {
    const r = this.routes.find((r) => r.id === id || r.code === id);
    return r ? this.enrichRoute(r) : undefined;
  }

  public markStopCompleted(routeId: string, stopId: string) {
    const route = this.routes.find((r) => r.id === routeId);
    if (!route) return;

    const stop = route.stops.find((s) => s.id === stopId);
    if (!stop) return;

    stop.isCompleted = true;
    stop.completedTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // If all stops completed, mark route completed
    if (route.stops.every((s) => s.isCompleted)) {
      route.status = 'completed';
      // Mark associated shipments as delivered
      stop.shipmentIds.forEach((shpId) => {
        const shp = this.shipments.find((s) => s.id === shpId);
        if (shp) shp.status = 'delivered';
      });
    }

    this.notify();
  }

  // --- Incidents & Re-Routing ---
  public getIncidents(): IncidentReport[] {
    return [...this.incidents];
  }

  public getIncidentById(id: string): IncidentReport | undefined {
    return this.incidents.find((i) => i.id === id || i.code === id);
  }

  public createIncident(data: {
    routeId: string;
    shipmentId: string;
    type: IncidentType;
    severity: IncidentReport['severity'];
    locationName: string;
    locationCoords?: [number, number];
    notes: string;
    agentId: string;
  }): IncidentReport {
    const route = this.routes.find((r) => r.id === data.routeId) || this.routes[0];
    const shipment = this.shipments.find((s) => s.id === data.shipmentId) || this.shipments[0];
    const agent = this.users.find((u) => u.id === data.agentId) || this.users.find((u) => u.role === 'agent') || this.users[2];

    const newId = `INC-${Math.floor(4100 + Math.random() * 900)}`;

    const spoilageHours = data.severity === 'critical' ? 24 : data.severity === 'high' ? 14 : 6;

    const newIncident: IncidentReport = {
      id: newId,
      code: newId,
      routeId: route.id,
      routeCode: route.code,
      shipmentId: shipment.id,
      shipmentCode: shipment.code,
      cargoType: shipment.cargoType,
      agentId: agent.id,
      agentName: agent.name,
      type: data.type,
      severity: data.severity,
      reportedAt: new Date().toISOString(),
      locationName: data.locationName || route.currentLocationName,
      locationCoords: data.locationCoords || route.currentLocation || [18.7557, 73.4091],
      notes: data.notes,
      status: 'open',
      spoilageRiskImpactHours: spoilageHours,
      suggestedAction:
        data.type === 'temperature_excursion'
          ? 'Reroute to nearest auxiliary pre-cooling sub-station and boost cryogenic cooling backup.'
          : data.type === 'vehicle_breakdown'
          ? 'Dispatch rapid replacement cold-reefer from nearby Pune hub and transfer load.'
          : 'Divert traffic via Mumbai-Pune Express Corridor Toll Way 2 with priority green wave clearance.',
    };

    this.incidents.unshift(newIncident);

    // Update shipment freshness & status
    shipment.status = 'disrupted';
    shipment.activeIncidentId = newId;
    shipment.remainingShelfLifeHours = Math.max(2, shipment.remainingShelfLifeHours - spoilageHours);
    shipment.freshnessPercent = Math.max(12, Math.round((shipment.remainingShelfLifeHours / shipment.totalShelfLifeHours) * 100));
    if (data.type === 'temperature_excursion') {
      shipment.currentTemp += 3.2; // Temp spike
    }

    // Mark route with incident
    route.status = 'incident_reported';
    route.activeIncidentId = newId;

    this.notify();
    return newIncident;
  }

  public reoptimizeRoute(routeId: string, incidentId: string) {
    const route = this.routes.find((r) => r.id === routeId);
    const incident = this.incidents.find((i) => i.id === incidentId);

    if (route) {
      route.status = 'rerouted';
      route.lastUpdated = new Date().toISOString();

      if (!route.explanation.rerouteHistory) {
        route.explanation.rerouteHistory = [];
      }

      route.explanation.rerouteHistory.unshift({
        timestamp: new Date().toISOString(),
        trigger: `${incident ? incident.code : 'Incident'} (${incident?.type.replace('_', ' ').toUpperCase() || 'Disruption'})`,
        actionTaken: `Automated Multi-Modal Re-Optimizer applied dynamic lane divergence and engaged fast-track cold transfer dock.`,
        previousETA: '04:15 PM',
        newETA: '03:10 PM',
        savedFreshnessHours: 5.5,
      });

      // Recover affected shipments
      route.stops.forEach((st) => {
        st.shipmentIds.forEach((shpId) => {
          const shp = this.shipments.find((s) => s.id === shpId);
          if (shp) {
            shp.status = 'in_transit';
            // Boost freshness back up due to saved time & restored temp
            shp.freshnessPercent = Math.min(85, shp.freshnessPercent + 25);
            shp.remainingShelfLifeHours += 6;
            if (shp.targetTempRange) {
              shp.currentTemp = shp.targetTempRange.min + 0.6;
            }
          }
        });
      });
    }

    if (incident) {
      incident.status = 'rerouted';
      incident.resolvedAt = new Date().toISOString();
    }

    this.notify();
  }

  public resolveIncident(incidentId: string) {
    const incident = this.incidents.find((i) => i.id === incidentId);
    if (incident) {
      incident.status = 'resolved';
      incident.resolvedAt = new Date().toISOString();
      const route = this.routes.find((r) => r.id === incident.routeId);
      if (route && route.activeIncidentId === incidentId) {
        route.status = 'in_transit';
        route.activeIncidentId = undefined;
      }
      this.notify();
    }
  }

  public resetDemoData() {
    this.businesses = [...INITIAL_BUSINESSES];
    this.users = [...INITIAL_USERS];
    this.shipments = [...INITIAL_SHIPMENTS];
    this.clusters = [...INITIAL_CLUSTERS];
    this.routes = [...INITIAL_ROUTES];
    this.incidents = [...INITIAL_INCIDENTS];
    this.activeUser = this.users[0];
    localStorage.removeItem('karwaan_shipments');
    localStorage.removeItem('karwaan_clusters');
    localStorage.removeItem('karwaan_routes');
    localStorage.removeItem('karwaan_incidents');
    localStorage.removeItem('karwaan_active_user');
    this.notify();
  }
}

export const dataService = new DataService();
