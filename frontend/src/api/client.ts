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

// --- File Browser ---

export interface DirEntry {
  name: string;
  path: string;
  hasChildren: boolean;
  loadstarProject: boolean;
}

export interface BrowseResponse {
  path: string;
  parent: string | null;
  hasLoadstar: boolean;
  entries: DirEntry[];
}

export async function browseDirectory(path: string): Promise<BrowseResponse> {
  const res = await apiClient.get<BrowseResponse>('/files/browse', {
    params: { path },
  });
  return res.data;
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

export async function updateWayPoint(root: string, data: WayPointDetail): Promise<WayPointDetail> {
  const res = await apiClient.put<WayPointDetail>('/elements/waypoint', data, {
    params: { root },
  });
  return res.data;
}

export async function updateBlackBox(root: string, data: BlackBoxDetail): Promise<BlackBoxDetail> {
  const res = await apiClient.put<BlackBoxDetail>('/elements/blackbox', data, {
    params: { root },
  });
  return res.data;
}

// --- TODO API ---

export interface ApiTodoItem {
  address: string;
  time: string;
  summary: string;
  status: string;
  dependsOn: string;
}

export interface ApiTodoHistoryItem {
  address: string;
  time: string;
  summary: string;
  action: string;
  at: string;
  dependsOn: string;
}

export async function fetchTodoList(root: string): Promise<ApiTodoItem[]> {
  const res = await apiClient.get<ApiTodoItem[]>('/todo/list', { params: { root } });
  return res.data;
}

export async function fetchTodoHistory(root: string, address?: string): Promise<ApiTodoHistoryItem[]> {
  const params: Record<string, string> = { root };
  if (address) params.address = address;
  const res = await apiClient.get<ApiTodoHistoryItem[]>('/todo/history', { params });
  return res.data;
}

export async function addTodo(root: string, address: string, summary: string, dependsOn?: string): Promise<void> {
  await apiClient.post('/todo/add', { address, summary, dependsOn }, { params: { root } });
}

export async function updateTodoStatus(root: string, address: string, status: string): Promise<void> {
  await apiClient.put('/todo/update', { address, status }, { params: { root } });
}

export async function doneTodo(root: string, address: string): Promise<void> {
  await apiClient.post('/todo/done', { address }, { params: { root } });
}

export async function deleteTodo(root: string, address: string): Promise<void> {
  await apiClient.delete('/todo/delete', { data: { address }, params: { root } });
}

// --- Log API ---

export interface LogEntry {
  timestamp: string;
  kind: string;
  content: string;
  address: string;
}

export interface LogResult {
  entries: LogEntry[];
  offset: number;
  limit: number;
  hasMore: boolean;
}

export async function fetchLog(root: string, offset: number, limit: number, address?: string, kind?: string): Promise<LogResult> {
  const params: Record<string, string | number> = { root, offset, limit };
  if (address) params.address = address;
  if (kind) params.kind = kind;
  const res = await apiClient.get<LogResult>('/log/find', { params });
  return res.data;
}
