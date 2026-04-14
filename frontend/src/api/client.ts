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
  childDetails?: Record<string, { status: string; summary: string }>;
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
  codeMapScopes: string[];
  todoAddress: string | null;
  todoSummary: string | null;
  techSpec: { text: string; done: boolean }[];
  issues: string[];
  openQuestions: { id: string; text: string; resolved: boolean }[];
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

export async function updateWayPoint(root: string, data: WayPointDetail, skipHistory = false): Promise<WayPointDetail> {
  const res = await apiClient.put<WayPointDetail>('/elements/waypoint', data, {
    params: { root, skipHistory },
  });
  return res.data;
}

// --- Map Structure API ---

export async function addToMap(root: string, mapAddress: string, childAddress: string, position?: string, summary?: string): Promise<MapViewResponse> {
  const params: Record<string, string> = { root, mapAddress, childAddress };
  if (position) params.position = position;
  if (summary) params.summary = summary;
  const res = await apiClient.post<MapViewResponse>('/elements/map/add', null, { params });
  return res.data;
}

export async function addChildToWayPoint(root: string, parentWpAddress: string, childId: string, mapAddress: string, summary?: string): Promise<MapViewResponse> {
  const params: Record<string, string> = { root, parentWpAddress, childId, mapAddress };
  if (summary) params.summary = summary;
  const res = await apiClient.post<MapViewResponse>('/elements/waypoint/add-child', null, { params });
  return res.data;
}

export async function removeChildFromWayPoint(root: string, parentWpAddress: string, childAddress: string, mapAddress: string): Promise<MapViewResponse> {
  const res = await apiClient.delete<MapViewResponse>('/elements/waypoint/remove-child', {
    params: { root, parentWpAddress, childAddress, mapAddress },
  });
  return res.data;
}

export async function removeFromMap(root: string, mapAddress: string, childAddress: string): Promise<MapViewResponse> {
  const res = await apiClient.delete<MapViewResponse>('/elements/map/remove', {
    params: { root, mapAddress, childAddress },
  });
  return res.data;
}

export async function deleteMap(root: string, mapAddress: string): Promise<{ success: boolean; error?: string }> {
  const res = await apiClient.delete<{ success: boolean; error?: string }>('/elements/map/delete', {
    params: { root, mapAddress },
  });
  return res.data;
}

export async function createSubMap(root: string, parentMapAddress: string, id: string, summary?: string): Promise<MapViewResponse> {
  const res = await apiClient.post<MapViewResponse>('/elements/map/create-child', null, {
    params: { root, parentMapAddress, id, summary: summary || '' },
  });
  return res.data;
}

// --- TODO API ---

export interface ApiTodoItem {
  address: string;
  status: string;
  summary: string;
}

export interface ApiTodoHistoryItem {
  address: string;
  date: string;
  item: string;
}

export interface ApiSyncResult {
  output: string;
  added: number;
  updated: number;
  removed: number;
  total: number;
}

export async function fetchTodoList(root: string): Promise<ApiTodoItem[]> {
  const res = await apiClient.get<ApiTodoItem[]>('/todo/list', { params: { root } });
  return res.data;
}

export async function syncTodo(root: string, address?: string): Promise<ApiSyncResult> {
  const params: Record<string, string> = { root };
  if (address) params.address = address;
  const res = await apiClient.post<ApiSyncResult>('/todo/sync', null, { params });
  return res.data;
}

export async function fetchTodoHistory(root: string, mapAddress?: string): Promise<ApiTodoHistoryItem[]> {
  const params: Record<string, string> = { root };
  if (mapAddress) params.mapAddress = mapAddress;
  const res = await apiClient.get<ApiTodoHistoryItem[]>('/todo/history', { params });
  return res.data;
}

// --- Git History API ---

export interface GitCommitEntry {
  hash: string;
  date: string;
  author: string;
  message: string;
}

export interface GitCommitDetailEntry {
  hash: string;
  date: string;
  author: string;
  message: string;
  files: { changeType: string; filePath: string }[];
}

export async function fetchProjectGitLog(root: string, limit = 50): Promise<GitCommitEntry[]> {
  const res = await apiClient.get<GitCommitEntry[]>('/git/log', {
    params: { root, limit },
  });
  return res.data;
}

export async function fetchGitDetail(root: string, hash: string): Promise<GitCommitDetailEntry> {
  const res = await apiClient.get<GitCommitDetailEntry>('/git/detail', {
    params: { root, hash },
  });
  return res.data;
}

export async function fetchGitHistory(root: string, address: string): Promise<GitCommitEntry[]> {
  const res = await apiClient.get<GitCommitEntry[]>('/git/history', {
    params: { root, address },
  });
  return res.data;
}

export async function fetchGitVersion(root: string, address: string, hash: string): Promise<WayPointDetail> {
  const res = await apiClient.get<WayPointDetail>('/git/show', {
    params: { root, address, hash },
  });
  return res.data;
}

// --- CLI API ---

export interface CliResult {
  success: boolean;
  output: string;
  exitCode: number;
}

export async function executeCliCommand(root: string, args: string[]): Promise<CliResult> {
  const res = await apiClient.post<CliResult>('/cli/execute', { root, args });
  return res.data;
}

// --- Dashboard API ---

export interface DashboardSummary {
  totalMaps: number;
  totalWaypoints: number;
  statusCounts: Record<string, number>;
  mapGroups: MapGroupSummary[];
  blockedItems: BlockedItem[];
}

export interface MapGroupSummary {
  address: string;
  summary: string;
  statusCounts: Record<string, number>;
  totalWaypoints: number;
}

export interface BlockedItem {
  address: string;
  summary: string;
}

export interface NoticeItem {
  id: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  created: string;
  resolved: string | null;
  content: string;
  filePath: string;
}

export async function fetchInitFile(root: string): Promise<string> {
  const res = await apiClient.get<string>('/dashboard/init', { params: { root } });
  return res.data;
}

export async function updateInitFile(root: string, content: string): Promise<void> {
  await apiClient.put('/dashboard/init', content, {
    params: { root },
    headers: { 'Content-Type': 'text/plain' },
  });
}

export async function fetchDashboardSummary(root: string): Promise<DashboardSummary> {
  const res = await apiClient.get<DashboardSummary>('/dashboard/summary', { params: { root } });
  return res.data;
}

export async function fetchNotices(root: string, category?: string): Promise<NoticeItem[]> {
  const params: Record<string, string> = { root };
  if (category) params.category = category;
  const res = await apiClient.get<NoticeItem[]>('/dashboard/notices', { params });
  return res.data;
}

export async function createNotice(root: string, notice: Omit<NoticeItem, 'id' | 'filePath'>): Promise<NoticeItem> {
  const res = await apiClient.post<NoticeItem>('/dashboard/notices', notice, { params: { root } });
  return res.data;
}

export async function updateNotice(root: string, id: string, notice: Omit<NoticeItem, 'id' | 'filePath'>): Promise<NoticeItem> {
  const res = await apiClient.put<NoticeItem>(`/dashboard/notices/${id}`, notice, { params: { root } });
  return res.data;
}

export async function deleteNotice(root: string, id: string): Promise<void> {
  await apiClient.delete(`/dashboard/notices/${id}`, { params: { root } });
}

// --- Search API ---

export interface SearchResultItem {
  address: string;
  type: 'MAP' | 'WAYPOINT';
  status: string;
  summary: string;
  snippet: string;
  matchCount: number;
}

export async function searchElements(root: string, query: string): Promise<SearchResultItem[]> {
  const res = await apiClient.get<SearchResultItem[]>('/elements/search', {
    params: { root, query },
  });
  return res.data;
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
