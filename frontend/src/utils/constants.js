// API Configuration
export const API_BASE_URL = 'http://localhost:8000/api/v1';

// Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  UPLOAD: '/upload',
  RESULTS: '/results/:id',
  PATIENTS: '/patients',
  ANALYTICS: '/analytics',
  ADMIN: '/admin',
};

// User Roles
export const ROLES = {
  ADMIN: 'admin',
  RADIOLOGIST: 'radiologist',
  PATIENT: 'patient',
  RESEARCHER: 'researcher',
};

// Pathologies (14)
export const PATHOLOGIES = [
  { key: 'atelectasis', label: 'Atelectasis', color: '#EF4444' },
  { key: 'cardiomegaly', label: 'Cardiomegaly', color: '#F59E0B' },
  { key: 'effusion', label: 'Effusion', color: '#10B981' },
  { key: 'infiltration', label: 'Infiltration', color: '#3B82F6' },
  { key: 'mass', label: 'Mass', color: '#8B5CF6' },
  { key: 'nodule', label: 'Nodule', color: '#EC4899' },
  { key: 'pneumonia', label: 'Pneumonia', color: '#EF4444' },
  { key: 'pneumothorax', label: 'Pneumothorax', color: '#F59E0B' },
  { key: 'consolidation', label: 'Consolidation', color: '#10B981' },
  { key: 'edema', label: 'Edema', color: '#3B82F6' },
  { key: 'emphysema', label: 'Emphysema', color: '#8B5CF6' },
  { key: 'fibrosis', label: 'Fibrosis', color: '#EC4899' },
  { key: 'pleural_thickening', label: 'Pleural Thickening', color: '#6366F1' },
  { key: 'hernia', label: 'Hernia', color: '#14B8A6' },
];

// Models
export const MODELS = [
  'DenseNet-121',
  'ResNet-50',
  'EfficientNet-B0',
  'VGG-16',
  'MobileNet-V2',
];

// Status
export const STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
};

// Theme
export const THEME = {
  LIGHT: 'light',
  DARK: 'dark',
};