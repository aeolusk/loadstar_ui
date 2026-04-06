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

// --- API Functions ---

export async function fetchTree(): Promise<TreeNode[]> {
  const res = await apiClient.get<TreeNode[]>('/elements/tree');
  return res.data;
}

export async function fetchMapView(address: string): Promise<MapViewResponse> {
  const res = await apiClient.get<MapViewResponse>('/elements/map-view', {
    params: { address },
  });
  return res.data;
}

// --- WayPoint Detail ---

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

export async function fetchWayPoint(address: string): Promise<WayPointDetail> {
  const res = await apiClient.get<WayPointDetail>('/elements/waypoint', {
    params: { address },
  });
  return res.data;
}

// --- BlackBox Detail ---

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

export async function fetchBlackBox(address: string): Promise<BlackBoxDetail> {
  const res = await apiClient.get<BlackBoxDetail>('/elements/blackbox', {
    params: { address },
  });
  return res.data;
}
