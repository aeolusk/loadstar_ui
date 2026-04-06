import axios from 'axios';
import type { TreeNode } from '../types/loadstar';

const apiClient = axios.create({
  baseURL: import.meta.env.DEV ? 'http://localhost:8080/api' : '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;

// --- API Types ---

export interface MapViewItem {
  address: string;
  type: 'MAP' | 'WAYPOINT';
  status: string;
  summary: string;
  blackbox: string | null;
  blackboxStatus: string | null;
  blackboxSyncedAt: string | null;
  children: string[];
  references: string[];
}

export interface MapViewResponse {
  map: {
    address: string;
    status: string;
    summary: string;
    waypoints: string[];
  };
  items: MapViewItem[];
}

export interface WayPointDetail {
  address: string;
  status: string;
  summary: string;
  syncedAt: string | null;
  version: string | null;
  created: string | null;
  priority: string | null;
  parent: string | null;
  children: string[];
  references: string[];
  blackbox: string | null;
  todoAddress: string | null;
  todoSummary: string | null;
  techSpec: { text: string; done: boolean }[];
  issues: string[];
  openQuestions: { id: string; text: string; resolved: boolean }[];
  comment: string | null;
}

export interface BlackBoxDetail {
  address: string;
  status: string;
  syncedAt: string | null;
  summary: string | null;
  linkedWp: string | null;
  codeMapPhase: 'plan' | 'actual';
  codeMap: { file: string; items: { name: string; description: string }[] }[];
  todos: { text: string; wpRef: number; done: boolean }[];
  issues: string[];
  comment: string | null;
}

// --- API Functions (all require root param) ---

export async function validateProject(root: string): Promise<{ valid: boolean; root: string }> {
  const res = await apiClient.get<{ valid: boolean; root: string }>('/elements/validate', {
    params: { root },
  });
  return res.data;
}

export async function fetchTree(root: string): Promise<TreeNode[]> {
  const res = await apiClient.get<TreeNode[]>('/elements/tree', {
    params: { root },
  });
  return res.data;
}

export async function fetchMapView(root: string, address: string): Promise<MapViewResponse> {
  const res = await apiClient.get<MapViewResponse>('/elements/map-view', {
    params: { root, address },
  });
  return res.data;
}

export async function fetchWayPoint(root: string, address: string): Promise<WayPointDetail> {
  const res = await apiClient.get<WayPointDetail>('/elements/waypoint', {
    params: { root, address },
  });
  return res.data;
}

export async function fetchBlackBox(root: string, address: string): Promise<BlackBoxDetail> {
  const res = await apiClient.get<BlackBoxDetail>('/elements/blackbox', {
    params: { root, address },
  });
  return res.data;
}
