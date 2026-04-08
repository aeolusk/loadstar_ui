import type { TreeNode, GitCommit } from '../types/loadstar';

export const sampleTree: TreeNode[] = [
  {
    address: 'M://root', type: 'MAP', status: 'S_PRG', summary: 'LOADSTAR Explorer',
    children: [
      {
        address: 'M://root/backend', type: 'MAP', status: 'S_IDL', summary: 'Spring Boot Backend',
        children: [
          { address: 'W://root/backend/project_config', type: 'WAYPOINT', status: 'S_STB', summary: 'Project Config', children: [] },
          { address: 'W://root/backend/element_service', type: 'WAYPOINT', status: 'S_PRG', summary: 'Element Service',
            references: ['W://root/backend/cli_service'], children: [] },
          { address: 'W://root/backend/todo_service', type: 'WAYPOINT', status: 'S_IDL', summary: 'TODO Service',
            references: ['W://root/backend/cli_service'], children: [] },
          { address: 'W://root/backend/git_service', type: 'WAYPOINT', status: 'S_IDL', summary: 'Git Service', children: [] },
          { address: 'W://root/backend/log_service', type: 'WAYPOINT', status: 'S_IDL', summary: 'Log Service',
            references: ['W://root/backend/cli_service'], children: [] },
          { address: 'W://root/backend/cli_service', type: 'WAYPOINT', status: 'S_IDL', summary: 'CLI Service', children: [] },
        ],
      },
      {
        address: 'M://root/frontend', type: 'MAP', status: 'S_PRG', summary: 'React Frontend',
        children: [
          { address: 'W://root/frontend/app_shell', type: 'WAYPOINT', status: 'S_STB', summary: 'App Shell',
            references: ['W://root/test/test_app_shell'], children: [] },
          { address: 'W://root/frontend/map_view', type: 'WAYPOINT', status: 'S_PRG', summary: 'Map View',
            references: ['W://root/test/test_map_view'], children: [] },
          { address: 'W://root/frontend/waypoint_editor', type: 'WAYPOINT', status: 'S_PRG', summary: 'WayPoint Editor',
            references: ['W://root/test/test_waypoint_editor'], children: [] },
          { address: 'W://root/frontend/dashboard', type: 'WAYPOINT', status: 'S_IDL', summary: 'Dashboard',
            references: ['W://root/test/test_dashboard'], children: [] },
          { address: 'W://root/frontend/todo_view', type: 'WAYPOINT', status: 'S_IDL', summary: 'TODO View',
            references: ['W://root/test/test_todo_view'], children: [] },
          { address: 'W://root/frontend/git_view', type: 'WAYPOINT', status: 'S_IDL', summary: 'Git View',
            references: ['W://root/test/test_git_view'], children: [] },
          { address: 'W://root/frontend/log_view', type: 'WAYPOINT', status: 'S_IDL', summary: 'Log View',
            references: ['W://root/test/test_log_view'], children: [] },
          { address: 'W://root/frontend/cli_console', type: 'WAYPOINT', status: 'S_IDL', summary: 'CLI Console',
            references: ['W://root/test/test_cli_console'], children: [] },
          { address: 'W://root/frontend/search', type: 'WAYPOINT', status: 'S_IDL', summary: 'Search',
            references: ['W://root/test/test_search'], children: [] },
        ],
      },
    ],
  },
];

export const sampleWaypoint = {
  address: 'W://root/backend/element_service',
  status: 'S_PRG',
  identity: {
    summary: '요소 파싱/조회/편집 - Map, WayPoint md 파일 읽기/쓰기, 트리 구조 JSON 변환',
    metadata: { version: '1.0', created: '2026-04-06', priority: 'P1' },
    syncedAt: '2026-04-06',
  },
  connections: {
    parent: 'M://root/backend',
    children: [] as string[],
    reference: ['W://root/backend/cli_service'],
  },
  techSpec: [
    { text: 'Map md 파일 파싱 (ADDRESS, STATUS, WAYPOINTS)', done: true },
    { text: 'WayPoint md 파일 파싱 (IDENTITY, CONNECTIONS, TODO)', done: true },
    { text: '트리 구조 JSON 변환 API', done: false },
    { text: '요소 편집 (md 파일 쓰기) API', done: false },
  ],
  issues: [] as string[],
  openQuestions: [
    { id: 'Q1', text: 'CONNECTIONS 파싱 시 순환 참조 처리 방법?', resolved: false },
  ],
};

export const sampleGitLog: GitCommit[] = [
  { hash: '153159d', message: '메인 화면 레이아웃 구현: 베이지 컬러 + 리사이즈 패널', author: 'KimHyonJin', date: '2026-04-06 11:30' },
  { hash: '5a32476', message: '프로젝트 초기 세팅: Spring Boot + React', author: 'KimHyonJin', date: '2026-04-06 11:15' },
  { hash: '937c375', message: '.loadstar 구조 재정리 및 업무 흐름 문서 추가', author: 'KimHyonJin', date: '2026-04-06 11:00' },
  { hash: 'a00cd90', message: 'LOADSTAR 초기 구조 및 상세 설계 문서 추가', author: 'KimHyonJin', date: '2026-04-06 10:30' },
];
