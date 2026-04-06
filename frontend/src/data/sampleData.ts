import type { TreeNode, TodoItem, TodoHistoryItem, GitCommit } from '../types/loadstar';

export const sampleTree: TreeNode[] = [
  {
    address: 'M://root', type: 'MAP', status: 'S_PRG', summary: 'LOADSTAR Explorer',
    children: [
      {
        address: 'M://root/backend', type: 'MAP', status: 'S_IDL', summary: 'Spring Boot Backend',
        children: [
          { address: 'W://root/backend/project_config', type: 'WAYPOINT', status: 'S_STB', summary: 'Project Config',
            blackbox: 'B://root/backend/project_config', children: [] },
          { address: 'W://root/backend/element_service', type: 'WAYPOINT', status: 'S_PRG', summary: 'Element Service',
            blackbox: 'B://root/backend/element_service',
            references: ['W://root/backend/cli_service'], children: [] },
          { address: 'W://root/backend/todo_service', type: 'WAYPOINT', status: 'S_IDL', summary: 'TODO Service',
            blackbox: 'B://root/backend/todo_service',
            references: ['W://root/backend/cli_service'], children: [] },
          { address: 'W://root/backend/git_service', type: 'WAYPOINT', status: 'S_IDL', summary: 'Git Service',
            blackbox: 'B://root/backend/git_service', children: [] },
          { address: 'W://root/backend/monitor_service', type: 'WAYPOINT', status: 'S_IDL', summary: 'Monitor Service',
            blackbox: 'B://root/backend/monitor_service',
            references: ['W://root/backend/cli_service'], children: [] },
          { address: 'W://root/backend/log_service', type: 'WAYPOINT', status: 'S_IDL', summary: 'Log Service',
            blackbox: 'B://root/backend/log_service',
            references: ['W://root/backend/cli_service'], children: [] },
          { address: 'W://root/backend/cli_service', type: 'WAYPOINT', status: 'S_IDL', summary: 'CLI Service',
            blackbox: 'B://root/backend/cli_service', children: [] },
        ],
      },
      {
        address: 'M://root/frontend', type: 'MAP', status: 'S_PRG', summary: 'React Frontend',
        children: [
          { address: 'W://root/frontend/app_shell', type: 'WAYPOINT', status: 'S_STB', summary: 'App Shell',
            blackbox: 'B://root/frontend/app_shell',
            references: ['W://root/test/test_app_shell'], children: [] },
          { address: 'W://root/frontend/map_view', type: 'WAYPOINT', status: 'S_PRG', summary: 'Map View',
            references: ['W://root/test/test_map_view'], children: [] },
          { address: 'W://root/frontend/waypoint_editor', type: 'WAYPOINT', status: 'S_PRG', summary: 'WayPoint Editor',
            references: ['W://root/test/test_waypoint_editor'], children: [] },
          { address: 'W://root/frontend/blackbox_editor', type: 'WAYPOINT', status: 'S_PRG', summary: 'BlackBox Editor',
            references: ['W://root/test/test_blackbox_editor'], children: [] },
          { address: 'W://root/frontend/dashboard', type: 'WAYPOINT', status: 'S_IDL', summary: 'Dashboard',
            references: ['W://root/test/test_dashboard'], children: [] },
          { address: 'W://root/frontend/todo_view', type: 'WAYPOINT', status: 'S_IDL', summary: 'TODO View',
            references: ['W://root/test/test_todo_view'], children: [] },
          { address: 'W://root/frontend/monitor_view', type: 'WAYPOINT', status: 'S_IDL', summary: 'Monitor View',
            references: ['W://root/test/test_monitor_view'], children: [] },
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
    summary: '요소 파싱/조회/편집 - Map, WayPoint, BlackBox md 파일 읽기/쓰기, 트리 구조 JSON 변환',
    metadata: { version: '1.0', created: '2026-04-06', priority: 'P1' },
    syncedAt: '2026-04-06',
  },
  connections: {
    parent: 'M://root/backend',
    children: [] as string[],
    reference: ['W://root/backend/cli_service'],
    blackbox: 'B://root/backend/element_service',
  },
  techSpec: [
    { text: 'Map md 파일 파싱 (ADDRESS, STATUS, WAYPOINTS)', done: true },
    { text: 'WayPoint md 파일 파싱 (IDENTITY, CONNECTIONS, TODO)', done: true },
    { text: 'BlackBox md 파일 파싱 (CODE_MAP, TODO, ISSUE)', done: false },
    { text: '트리 구조 JSON 변환 API', done: false },
    { text: '요소 편집 (md 파일 쓰기) API', done: false },
  ],
  issues: [] as string[],
  openQuestions: [
    { id: 'Q1', text: 'CONNECTIONS 파싱 시 순환 참조 처리 방법?', resolved: false },
  ],
};

export const sampleBlackbox = {
  address: 'B://root/backend/element_service',
  status: 'S_PRG',
  syncedAt: '2026-03-01',
  description: {
    summary: 'Map, WayPoint, BlackBox md 파일을 파싱하여 JSON으로 변환하고 REST API로 제공',
    linkedWp: 'W://root/backend/element_service',
  },
  codeMap: {
    phase: 'plan' as const,
    entries: [
      { file: 'service/ElementParser.java', items: [{ name: 'parseMap()', desc: 'MAP md 파일 파싱' }, { name: 'parseWayPoint()', desc: 'WAYPOINT md 파일 파싱' }] },
      { file: 'service/ElementService.java', items: [{ name: 'getTree()', desc: '전체 트리 구조 반환' }, { name: 'getElement()', desc: '단일 요소 상세 반환' }] },
      { file: 'controller/ElementController.java', items: [{ name: 'GET /api/elements/tree', desc: '트리 조회 API' }, { name: 'GET /api/elements/{address}', desc: '요소 상세 API' }] },
    ],
  },
  todos: [
    { text: 'Map md 파일 파싱 구현', wpRef: 1, done: true },
    { text: 'WayPoint md 파일 파싱 구현', wpRef: 2, done: true },
    { text: 'BlackBox md 파일 파싱 구현', wpRef: 3, done: false },
    { text: '트리 구조 JSON 변환 API', wpRef: 4, done: false },
    { text: '요소 편집 API', wpRef: 5, done: false },
  ],
  issues: ['SYNCED_AT 30일 초과 BlackBox의 CODE_MAP 신뢰도 경고 로직 필요'],
};

export const sampleTodos: TodoItem[] = [
  { address: 'W://root/backend/element_service', time: '2026-04-06 10:00', summary: 'BlackBox md 파싱 구현', status: 'ACTIVE', dependsOn: '-' },
  { address: 'W://root/frontend/app_shell', time: '2026-04-06 10:30', summary: '리사이즈 패널 적용', status: 'ACTIVE', dependsOn: '-' },
  { address: 'W://root/frontend/map_view', time: '2026-04-06 11:00', summary: 'React Flow 기반 흐름도 구현', status: 'PENDING', dependsOn: 'W://root/frontend/app_shell' },
  { address: 'W://root/backend/todo_service', time: '2026-04-06 11:30', summary: 'loadstar todo CLI 연동', status: 'BLOCKED', dependsOn: 'W://root/backend/cli_service' },
  { address: 'W://root/backend/cli_service', time: '2026-04-06 12:00', summary: 'ProcessBuilder 기반 CLI 실행기', status: 'PENDING', dependsOn: '-' },
];

export const sampleTodoHistory: TodoHistoryItem[] = [
  { address: 'W://root/backend/project_config', time: '2026-04-05 14:00', summary: 'Spring Boot 프로젝트 초기 설정', action: 'DONE', at: '2026-04-06 09:30', dependsOn: '-' },
  { address: 'W://root/frontend/app_shell', time: '2026-04-05 15:00', summary: 'React 프로젝트 초기 설정', action: 'DONE', at: '2026-04-06 10:00', dependsOn: '-' },
];

export const sampleGitLog: GitCommit[] = [
  { hash: '153159d', message: '메인 화면 레이아웃 구현: 베이지 컬러 + 리사이즈 패널', author: 'KimHyonJin', date: '2026-04-06 11:30' },
  { hash: '5a32476', message: '프로젝트 초기 세팅: Spring Boot + React', author: 'KimHyonJin', date: '2026-04-06 11:15' },
  { hash: '937c375', message: '.loadstar 구조 재정리 및 업무 흐름 문서 추가', author: 'KimHyonJin', date: '2026-04-06 11:00' },
  { hash: 'a00cd90', message: 'LOADSTAR 초기 구조 및 상세 설계 문서 추가', author: 'KimHyonJin', date: '2026-04-06 10:30' },
];
