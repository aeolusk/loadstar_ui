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
