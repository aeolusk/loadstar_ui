// LOADSTAR Element Types

export type ElementType = 'MAP' | 'WAYPOINT';

export type StatusCode = 'S_IDL' | 'S_PRG' | 'S_STB' | 'S_ERR' | 'S_REV';

export interface LoadstarElement {
  address: string;
  type: ElementType;
  status: StatusCode;
  summary: string;
  syncedAt?: string;
  children?: LoadstarElement[];
}

export interface TreeNode {
  address: string;
  type: ElementType;
  status: StatusCode;
  summary: string;
  children: TreeNode[];
  references?: string[];  // CONNECTIONS.REFERENCE 주소 목록
}

export interface TodoItem {
  address: string;
  time: string;
  summary: string;
  status: 'PENDING' | 'ACTIVE' | 'BLOCKED';
  dependsOn: string;
}

export interface TodoHistoryItem {
  address: string;
  time: string;
  summary: string;
  action: string;
  at: string;
  dependsOn: string;
}

export interface GitCommit {
  hash: string;
  message: string;
  author: string;
  date: string;
}
