package com.loadstar.explorer.service;

import com.loadstar.explorer.model.DashboardSummary;
import com.loadstar.explorer.model.DashboardSummary.BlockedItem;
import com.loadstar.explorer.model.DashboardSummary.DwpItem;
import com.loadstar.explorer.model.DashboardSummary.MapGroupSummary;
import com.loadstar.explorer.model.NoticeItem;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.*;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Slf4j
@Service
@RequiredArgsConstructor
public class DashboardService {

    private final ElementService elementService;
    private final DecisionService decisionService;
    private final CliExecutor cli;

    private static final Map<String, String> CATEGORY_LABELS = Map.of(
        "NOTICE", "공지사항", "ISSUE", "이슈", "RISK", "리스크", "MEMO", "메모"
    );

    private String categoryLabel(String category) {
        return CATEGORY_LABELS.getOrDefault(category, category);
    }

    private void logNoticeAction(String projectRoot, String category, String title, String action) {
        try {
            String msg = categoryLabel(category) + " '" + title + "'" + action;
            cli.execute(projectRoot, "log", "add", "W://root/frontend/dashboard", "NOTE", msg);
        } catch (Exception e) {
            log.warn("Failed to log notice action: {}", e.getMessage());
        }
    }

    // ── Summary ────────────────────────────────────────

    public DashboardSummary getSummary(String projectRoot) throws IOException {
        List<ElementService.TreeNodeDto> tree = elementService.getTree(projectRoot);
        DashboardSummary summary = new DashboardSummary();

        // 전체 집계
        Map<String, Integer> totalStatus = new LinkedHashMap<>();
        int[] counts = {0, 0}; // [maps, waypoints]
        List<MapGroupSummary> groups = new ArrayList<>();

        if (!tree.isEmpty()) {
            ElementService.TreeNodeDto root = tree.get(0);
            countNode(root, totalStatus, counts);

            // root 직하 Map 노드만 그룹으로
            if (root.getChildren() != null) {
                for (ElementService.TreeNodeDto child : root.getChildren()) {
                    if ("MAP".equals(child.getType())) {
                        MapGroupSummary group = new MapGroupSummary();
                        group.setAddress(child.getAddress());
                        group.setSummary(child.getSummary() != null ? child.getSummary() : "");
                        Map<String, Integer> groupStatus = new LinkedHashMap<>();
                        int[] groupCounts = {0, 0};
                        countNode(child, groupStatus, groupCounts);
                        // 그룹에서 자기 자신(Map)은 WP 카운트에서 제외
                        group.setStatusCounts(groupStatus);
                        group.setTotalWaypoints(groupCounts[1]);
                        groups.add(group);
                    }
                }
            }
        }

        summary.setTotalMaps(counts[0]);
        summary.setTotalWaypoints(counts[1]);
        summary.setStatusCounts(totalStatus);
        summary.setMapGroups(groups);
        summary.setBlockedItems(parseBlockedItems(projectRoot));
        summary.setDwpItems(loadDwpItems(projectRoot));

        // OPEN + DEFERRED 질문 수
        try {
            long unanswered = decisionService.listQuestions(projectRoot).stream()
                    .filter(q -> "OPEN".equals(q.getState()) || "DEFERRED".equals(q.getState()))
                    .count();
            summary.setOpenQuestionCount((int) unanswered);
        } catch (Exception e) {
            log.warn("Failed to count open questions: {}", e.getMessage());
        }

        return summary;
    }

    private void countNode(ElementService.TreeNodeDto node,
                           Map<String, Integer> statusCounts, int[] counts) {
        if (node == null) return;
        String type = node.getType();
        if ("MAP".equals(type)) {
            counts[0]++;
        } else if ("WAYPOINT".equals(type)) {
            counts[1]++;
            String status = node.getStatus() != null ? node.getStatus() : "?";
            statusCounts.merge(status, 1, Integer::sum);
        }
        if (node.getChildren() != null) {
            for (ElementService.TreeNodeDto child : node.getChildren()) {
                countNode(child, statusCounts, counts);
            }
        }
    }

    private List<BlockedItem> parseBlockedItems(String projectRoot) {
        List<BlockedItem> items = new ArrayList<>();
        try {
            String output = cli.execute(projectRoot, "todo", "list");
            if (output == null) return items;
            for (String line : output.split("\n")) {
                String trimmed = line.trim();
                if (!trimmed.contains("[BLOCKED]")) continue;
                // ADDRESS  [BLOCKED]  SUMMARY 형식 파싱
                String[] parts = trimmed.split("\\s{2,}");
                if (parts.length >= 3) {
                    BlockedItem item = new BlockedItem();
                    item.setAddress(parts[0].trim());
                    item.setSummary(parts[2].trim());
                    items.add(item);
                }
            }
        } catch (Exception e) {
            log.warn("Failed to parse blocked items: {}", e.getMessage());
        }
        return items;
    }

    // ── DWP items ──────────────────────────────────────

    private static final Pattern CREATED_PATTERN = Pattern.compile("Created:\\s*(\\d{4}-\\d{2}-\\d{2})");
    private static final Pattern UPDATED_PATTERN = Pattern.compile("Updated:\\s*(\\d{4}-\\d{2}-\\d{2})");

    private List<DwpItem> loadDwpItems(String projectRoot) {
        List<DwpItem> items = new ArrayList<>();
        Path dwpDir = Paths.get(projectRoot, ".loadstar", "DATA_WAYPOINT");
        if (!Files.exists(dwpDir)) return items;
        try (Stream<Path> files = Files.list(dwpDir)) {
            files.filter(f -> f.toString().endsWith(".md"))
                 .sorted()
                 .forEach(f -> {
                     DwpItem item = parseDwpItem(f);
                     if (item != null) items.add(item);
                 });
        } catch (IOException e) {
            log.warn("Failed to load DWP items: {}", e.getMessage());
        }
        return items;
    }

    private DwpItem parseDwpItem(Path file) {
        try {
            DwpItem item = new DwpItem();
            for (String line : Files.readAllLines(file)) {
                String t = line.trim();
                if (t.startsWith("## [ADDRESS]")) {
                    item.setAddress(t.substring("## [ADDRESS]".length()).trim());
                } else if (t.startsWith("- SUMMARY:")) {
                    item.setSummary(t.substring("- SUMMARY:".length()).trim());
                } else if (t.startsWith("- METADATA:")) {
                    Matcher m1 = CREATED_PATTERN.matcher(t);
                    if (m1.find()) item.setCreated(m1.group(1));
                    Matcher m2 = UPDATED_PATTERN.matcher(t);
                    if (m2.find()) item.setUpdated(m2.group(1));
                }
            }
            return item.getAddress() != null ? item : null;
        } catch (IOException e) {
            log.warn("Failed to parse DWP file: {}", file, e);
            return null;
        }
    }

    // ── INIT file ──────────────────────────────────────

    public String readInitFile(String projectRoot) throws IOException {
        Path file = Paths.get(projectRoot, ".loadstar", "LOADSTAR_INIT.md");
        if (!Files.exists(file)) return "";
        return Files.readString(file);
    }

    public void writeInitFile(String projectRoot, String content) throws IOException {
        Path file = Paths.get(projectRoot, ".loadstar", "LOADSTAR_INIT.md");
        Files.writeString(file, content);
        try {
            cli.execute(projectRoot, "log", "add", "W://root/frontend/dashboard", "MODIFIED", "LOADSTAR_INIT.md 수정");
        } catch (Exception e) {
            log.warn("Failed to log INIT file update: {}", e.getMessage());
        }
    }

    // ── Notices CRUD ───────────────────────────────────

    private static final Pattern FIELD_PATTERN = Pattern.compile("^## \\[(.+?)]\\s+(.*)$");

    public List<NoticeItem> listNotices(String projectRoot, String category) throws IOException {
        Path noticeDir = getNoticeDir(projectRoot);
        if (!Files.exists(noticeDir)) return List.of();

        List<NoticeItem> items = new ArrayList<>();
        try (Stream<Path> files = Files.list(noticeDir)) {
            for (Path file : files.sorted().collect(Collectors.toList())) {
                if (!file.toString().endsWith(".md")) continue;
                NoticeItem item = parseNoticeFile(file, projectRoot);
                if (item != null) {
                    if (category == null || category.isEmpty() || category.equals(item.getCategory())) {
                        items.add(item);
                    }
                }
            }
        }
        return items;
    }

    public NoticeItem createNotice(String projectRoot, NoticeItem request) throws IOException {
        Path noticeDir = getNoticeDir(projectRoot);
        Files.createDirectories(noticeDir);

        String id = generateNextId(noticeDir);
        request.setId(id);
        if (request.getCreated() == null || request.getCreated().isEmpty()) {
            request.setCreated(LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE));
        }
        if (request.getStatus() == null || request.getStatus().isEmpty()) {
            request.setStatus("OPEN");
        }

        Path file = noticeDir.resolve(id + ".md");
        Files.writeString(file, buildNoticeContent(request));
        request.setFilePath(getRelativePath(file, projectRoot));
        logNoticeAction(projectRoot, request.getCategory(), request.getTitle(), "이(가) 추가되었습니다.");
        return request;
    }

    public NoticeItem updateNotice(String projectRoot, String id, NoticeItem request) throws IOException {
        Path file = getNoticeDir(projectRoot).resolve(id + ".md");
        if (!Files.exists(file)) {
            throw new IOException("Notice not found: " + id);
        }
        request.setId(id);
        Files.writeString(file, buildNoticeContent(request));
        request.setFilePath(getRelativePath(file, projectRoot));
        logNoticeAction(projectRoot, request.getCategory(), request.getTitle(), "이(가) 수정되었습니다.");
        return request;
    }

    public void deleteNotice(String projectRoot, String id) throws IOException {
        Path file = getNoticeDir(projectRoot).resolve(id + ".md");
        // 삭제 전 제목/카테고리 읽기
        NoticeItem existing = parseNoticeFile(file, projectRoot);
        String delCategory = existing != null ? existing.getCategory() : "";
        String delTitle = existing != null ? existing.getTitle() : id;
        if (!Files.exists(file)) {
            throw new IOException("Notice not found: " + id);
        }
        Files.delete(file);
        logNoticeAction(projectRoot, delCategory, delTitle, "이(가) 삭제되었습니다.");
    }

    // ── Private helpers ────────────────────────────────

    private Path getNoticeDir(String projectRoot) {
        return Paths.get(projectRoot, ".loadstar", "NOTICE");
    }

    private String getRelativePath(Path file, String projectRoot) {
        return Paths.get(projectRoot).relativize(file).toString().replace('\\', '/');
    }

    private String generateNextId(Path noticeDir) throws IOException {
        int max = 0;
        try (Stream<Path> files = Files.list(noticeDir)) {
            for (Path f : files.collect(Collectors.toList())) {
                String name = f.getFileName().toString();
                if (name.endsWith(".md")) {
                    try {
                        int num = Integer.parseInt(name.replace(".md", ""));
                        if (num > max) max = num;
                    } catch (NumberFormatException ignored) {}
                }
            }
        }
        return String.format("%03d", max + 1);
    }

    private NoticeItem parseNoticeFile(Path file, String projectRoot) {
        try {
            String content = Files.readString(file);
            NoticeItem item = new NoticeItem();
            String fileName = file.getFileName().toString();
            item.setId(fileName.replace(".md", ""));
            item.setFilePath(getRelativePath(file, projectRoot));

            StringBuilder bodyBuilder = new StringBuilder();
            boolean inContent = false;

            for (String line : content.split("\n")) {
                if (inContent) {
                    bodyBuilder.append(line).append("\n");
                    continue;
                }
                if (line.trim().equals("### CONTENT")) {
                    inContent = true;
                    continue;
                }
                Matcher m = FIELD_PATTERN.matcher(line.trim());
                if (m.matches()) {
                    String field = m.group(1);
                    String value = m.group(2).trim();
                    switch (field) {
                        case "TITLE" -> item.setTitle(value);
                        case "CATEGORY" -> item.setCategory(value);
                        case "PRIORITY" -> item.setPriority(value);
                        case "STATUS" -> item.setStatus(value);
                        case "CREATED" -> item.setCreated(value);
                        case "RESOLVED" -> {
                            if (!value.isEmpty() && !value.equals("(없음)")) {
                                item.setResolved(value);
                            }
                        }
                    }
                }
            }

            item.setContent(bodyBuilder.toString().trim());
            return item;
        } catch (IOException e) {
            log.warn("Failed to parse notice file: {}", file, e);
            return null;
        }
    }

    private String buildNoticeContent(NoticeItem item) {
        StringBuilder sb = new StringBuilder();
        sb.append("## [TITLE] ").append(item.getTitle() != null ? item.getTitle() : "").append("\n");
        sb.append("## [CATEGORY] ").append(item.getCategory() != null ? item.getCategory() : "NOTICE").append("\n");
        sb.append("## [PRIORITY] ").append(item.getPriority() != null ? item.getPriority() : "MEDIUM").append("\n");
        sb.append("## [STATUS] ").append(item.getStatus() != null ? item.getStatus() : "OPEN").append("\n");
        sb.append("## [CREATED] ").append(item.getCreated() != null ? item.getCreated() : "").append("\n");
        sb.append("## [RESOLVED] ").append(item.getResolved() != null ? item.getResolved() : "").append("\n");
        sb.append("\n### CONTENT\n");
        sb.append(item.getContent() != null ? item.getContent() : "").append("\n");
        return sb.toString();
    }
}
