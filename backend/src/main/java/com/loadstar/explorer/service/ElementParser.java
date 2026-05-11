package com.loadstar.explorer.service;

import com.loadstar.explorer.model.*;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class ElementParser {

    private static final Pattern ADDRESS_PATTERN = Pattern.compile("##\\s*\\[ADDRESS\\]\\s*(.+)");
    private static final Pattern STATUS_PATTERN = Pattern.compile("##\\s*\\[STATUS\\]\\s*(\\S+)");
    private static final Pattern SYNCED_AT_PATTERN = Pattern.compile("##\\s*\\[SYNCED_AT\\]\\s*(\\S+)");

    public MapData parseMap(Path file) throws IOException {
        List<String> lines = Files.readAllLines(file, java.nio.charset.StandardCharsets.UTF_8);
        MapData map = new MapData();
        List<String> waypoints = new ArrayList<>();
        boolean inWaypoints = false;
        boolean inGoal = false;
        StringBuilder goalBuilder = new StringBuilder();

        for (String line : lines) {
            String trimmed = line.trim();

            Matcher addrMatch = ADDRESS_PATTERN.matcher(trimmed);
            if (addrMatch.matches()) {
                map.setAddress(addrMatch.group(1).trim());
                continue;
            }

            Matcher statusMatch = STATUS_PATTERN.matcher(trimmed);
            if (statusMatch.matches()) {
                map.setStatus(statusMatch.group(1).trim());
                continue;
            }

            if (trimmed.startsWith("### ")) {
                if (trimmed.equals("### WAYPOINTS")) {
                    inWaypoints = true;
                    inGoal = false;
                } else if (trimmed.startsWith("### GOAL")) {
                    inGoal = true;
                    inWaypoints = false;
                } else {
                    inWaypoints = false;
                    inGoal = false;
                }
                continue;
            }

            if (trimmed.startsWith("- SUMMARY:")) {
                map.setSummary(trimmed.substring("- SUMMARY:".length()).trim());
                continue;
            }

            if (inGoal && !trimmed.isEmpty() && !trimmed.startsWith("</")) {
                if (goalBuilder.length() > 0) goalBuilder.append(" ");
                goalBuilder.append(trimmed);
                continue;
            }

            if (inWaypoints && trimmed.startsWith("- ")) {
                String addr = trimmed.substring(2).trim();
                if (!addr.isEmpty() && (addr.startsWith("M://") || addr.startsWith("W://") || addr.startsWith("D://"))) {
                    waypoints.add(addr);
                }
            }
        }

        String goal = goalBuilder.toString().trim();
        if (!goal.isEmpty()) map.setGoal(goal);
        map.setWaypoints(waypoints);
        return map;
    }

    public WayPointData parseWayPoint(Path file) throws IOException {
        List<String> lines = Files.readAllLines(file, java.nio.charset.StandardCharsets.UTF_8);
        WayPointData wp = new WayPointData();
        wp.setChildren(new ArrayList<>());
        wp.setReferences(new ArrayList<>());
        wp.setTodos(new ArrayList<>());

        String currentSection = "";
        StringBuilder goalBuilder = new StringBuilder();

        for (String line : lines) {
            String trimmed = line.trim();

            Matcher addrMatch = ADDRESS_PATTERN.matcher(trimmed);
            if (addrMatch.matches()) {
                wp.setAddress(addrMatch.group(1).trim());
                continue;
            }

            Matcher statusMatch = STATUS_PATTERN.matcher(trimmed);
            if (statusMatch.matches()) {
                wp.setStatus(statusMatch.group(1).trim());
                continue;
            }

            if (trimmed.startsWith("### ")) {
                currentSection = trimmed;
                continue;
            }

            if (trimmed.startsWith("- SUMMARY:")) {
                wp.setSummary(trimmed.substring("- SUMMARY:".length()).trim());
                continue;
            }

            if (trimmed.startsWith("- SYNCED_AT:")) {
                wp.setSyncedAt(trimmed.substring("- SYNCED_AT:".length()).trim());
                continue;
            }

            if (trimmed.startsWith("- PARENT:")) {
                wp.setParent(trimmed.substring("- PARENT:".length()).trim());
                continue;
            }

            if (trimmed.startsWith("- CHILDREN:")) {
                String val = trimmed.substring("- CHILDREN:".length()).trim();
                wp.setChildren(parseAddressList(val));
                continue;
            }

            if (trimmed.startsWith("- REFERENCE:")) {
                String val = trimmed.substring("- REFERENCE:".length()).trim();
                wp.setReferences(parseAddressList(val));
                continue;
            }

            // GOAL section — free text (single or multi-line)
            if (currentSection.startsWith("### GOAL") && !trimmed.isEmpty() && !trimmed.startsWith("</")) {
                if (goalBuilder.length() > 0) goalBuilder.append(" ");
                goalBuilder.append(trimmed);
                continue;
            }

            // TODO section — TASK ([x]/[ ]) and RECURRING ((R)) items
            if (currentSection.contains("TODO")) {
                if (trimmed.equals("- TECH_SPEC:")) continue; // legacy wrapper
                if (trimmed.startsWith("- [x]") || trimmed.startsWith("- [ ]")) {
                    TodoItem item = new TodoItem();
                    item.setDone(trimmed.startsWith("- [x]"));
                    item.setText(trimmed.substring(5).trim());
                    wp.getTodos().add(item);
                    continue;
                }
                if (trimmed.startsWith("- (R)")) {
                    TodoItem item = new TodoItem();
                    item.setRecurring(true);
                    item.setText(trimmed.substring(5).trim());
                    wp.getTodos().add(item);
                    continue;
                }
            }
        }

        String goal = goalBuilder.toString().trim();
        if (!goal.isEmpty()) wp.setGoal(goal);
        return wp;
    }

    public WayPointDetailResponse parseWayPointDetail(Path file) throws IOException {
        List<String> lines = Files.readAllLines(file, java.nio.charset.StandardCharsets.UTF_8);
        WayPointDetailResponse wp = new WayPointDetailResponse();
        wp.setChildren(new ArrayList<>());
        wp.setReferences(new ArrayList<>());
        wp.setCodeMapScopes(new ArrayList<>());
        wp.setTechSpec(new ArrayList<>());
        wp.setIssues(new ArrayList<>());
        wp.setOpenQuestions(new ArrayList<>());
        wp.setTables(new ArrayList<>());

        String currentSection = "";
        boolean inIssue = false;
        boolean inOpenQuestions = false;
        StringBuilder commentBuilder = new StringBuilder();
        StringBuilder goalBuilder = new StringBuilder();
        boolean inComment = false;
        WayPointDetailResponse.TableEntry currentTable = null;

        for (String line : lines) {
            String trimmed = line.trim();

            Matcher addrMatch = ADDRESS_PATTERN.matcher(trimmed);
            if (addrMatch.matches()) {
                wp.setAddress(addrMatch.group(1).trim());
                continue;
            }

            Matcher statusMatch = STATUS_PATTERN.matcher(trimmed);
            if (statusMatch.matches()) {
                wp.setStatus(statusMatch.group(1).trim());
                continue;
            }

            if (trimmed.startsWith("### ")) {
                currentSection = trimmed;
                inIssue = false;
                inOpenQuestions = false;
                inComment = currentSection.contains("COMMENT");
                currentTable = null;
                continue;
            }

            // GOAL section — free text
            if (currentSection.startsWith("### GOAL") && !trimmed.isEmpty() && !trimmed.startsWith("</")) {
                if (goalBuilder.length() > 0) goalBuilder.append(" ");
                goalBuilder.append(trimmed);
                continue;
            }

            // IDENTITY
            if (trimmed.startsWith("- SUMMARY:")) {
                wp.setSummary(trimmed.substring("- SUMMARY:".length()).trim());
                continue;
            }
            if (trimmed.startsWith("- SYNCED_AT:")) {
                wp.setSyncedAt(trimmed.substring("- SYNCED_AT:".length()).trim());
                continue;
            }
            if (trimmed.startsWith("- METADATA:")) {
                String meta = trimmed.substring("- METADATA:".length()).trim();
                // Parse [Ver: 1.0, Created: 2026-04-06, Priority: P1]
                meta = meta.replaceAll("[\\[\\]]", "");
                for (String part : meta.split(",")) {
                    String[] kv = part.split(":", 2);
                    if (kv.length == 2) {
                        String key = kv[0].trim().toLowerCase();
                        String val = kv[1].trim();
                        if (key.contains("ver")) wp.setVersion(val);
                        else if (key.contains("created") || key.contains("create")) wp.setCreated(val);
                        else if (key.contains("prior")) wp.setPriority(val);
                    }
                }
                continue;
            }

            // CONNECTIONS
            if (trimmed.startsWith("- PARENT:")) {
                wp.setParent(trimmed.substring("- PARENT:".length()).trim());
                continue;
            }
            if (trimmed.startsWith("- CHILDREN:")) {
                wp.setChildren(parseAddressList(trimmed.substring("- CHILDREN:".length()).trim()));
                continue;
            }
            if (trimmed.startsWith("- REFERENCE:")) {
                wp.setReferences(parseAddressList(trimmed.substring("- REFERENCE:".length()).trim()));
                continue;
            }
            // TABLES section (DWP)
            if (currentSection.contains("TABLES") && trimmed.startsWith("- ") && !trimmed.equals("(없음)")) {
                if (!line.startsWith("  ") && !line.startsWith("\t")) {
                    // Table header: "- 테이블명:"
                    String tableName = trimmed.substring(2).trim();
                    if (tableName.endsWith(":")) tableName = tableName.substring(0, tableName.length() - 1).trim();
                    currentTable = new WayPointDetailResponse.TableEntry();
                    currentTable.setName(tableName);
                    currentTable.setItems(new ArrayList<>());
                    wp.getTables().add(currentTable);
                } else if (currentTable != null) {
                    // Table item: "  - 요소" or "  - 요소: 설명"
                    currentTable.getItems().add(trimmed.substring(2).trim());
                }
                continue;
            }

            // CODE_MAP scope
            if (currentSection.contains("CODE_MAP") && trimmed.startsWith("- ") && !trimmed.equals("(없음)")) {
                String scope = trimmed.substring(2).trim();
                if (scope.startsWith("scope:")) {
                    // "- scope: path/" format — extract the path
                    scope = scope.substring(6).trim();
                    if (!scope.isEmpty()) wp.getCodeMapScopes().add(scope);
                } else if (!scope.startsWith("AI") && !scope.isEmpty()) {
                    // bare path lines under scope
                    wp.getCodeMapScopes().add(scope);
                }
                continue;
            }

            // TODO section
            if (trimmed.startsWith("- ADDRESS:") && currentSection.contains("TODO")) {
                wp.setTodoAddress(trimmed.substring("- ADDRESS:".length()).trim());
                continue;
            }
            if (trimmed.startsWith("- SUMMARY:") && currentSection.contains("TODO")) {
                wp.setTodoSummary(trimmed.substring("- SUMMARY:".length()).trim());
                continue;
            }
            // Skip legacy `- TECH_SPEC:` wrapper line (no longer required)
            if (trimmed.equals("- TECH_SPEC:")) {
                continue;
            }

            // TODO checkbox items: parse [x]/[ ]/(R) under ### TODO regardless of TECH_SPEC wrapper
            if (currentSection.contains("TODO")) {
                if (trimmed.startsWith("- [x]") || trimmed.startsWith("- [ ]")) {
                    WayPointDetailResponse.TechSpecItem item = new WayPointDetailResponse.TechSpecItem();
                    item.setDone(trimmed.startsWith("- [x]"));
                    item.setText(trimmed.substring(5).trim());
                    wp.getTechSpec().add(item);
                    continue;
                }
                if (trimmed.startsWith("- (R)")) {
                    WayPointDetailResponse.TechSpecItem item = new WayPointDetailResponse.TechSpecItem();
                    item.setRecurring(true);
                    item.setText(trimmed.substring(5).trim());
                    wp.getTechSpec().add(item);
                    continue;
                }
            }

            // ISSUE section
            if (currentSection.contains("ISSUE") && !currentSection.contains("COMMENT")) {
                if (trimmed.startsWith("- OPEN_QUESTIONS:")) {
                    inOpenQuestions = true;
                    inIssue = false;
                    continue;
                }
                if (inOpenQuestions && trimmed.startsWith("- [")) {
                    // Parse [Q1], [Q1 DEFERRED], [Q1 RESOLVED ref], [Q1 DONE ref]
                    WayPointDetailResponse.OpenQuestion oq = new WayPointDetailResponse.OpenQuestion();
                    int closeBracket = trimmed.indexOf(']');
                    if (closeBracket > 0) {
                        String tag = trimmed.substring(3, closeBracket).trim(); // skip "- ["
                        String[] parts = tag.split("\\s+", 3);
                        oq.setId(parts[0]); // "Q1"
                        String state = "OPEN";
                        String ref = null;
                        if (parts.length >= 2) {
                            switch (parts[1]) {
                                case "DEFERRED" -> state = "DEFERRED";
                                case "RESOLVED" -> { state = "RESOLVED"; if (parts.length >= 3) ref = parts[2]; }
                                case "DONE"     -> { state = "DONE";     if (parts.length >= 3) ref = parts[2]; }
                            }
                        }
                        oq.setState(state);
                        oq.setResolvedRef(ref);
                        oq.setResolved("RESOLVED".equals(state) || "DONE".equals(state));
                        oq.setText(trimmed.substring(closeBracket + 1).trim());
                        wp.getOpenQuestions().add(oq);
                    }
                    continue;
                }
                if (!inOpenQuestions && trimmed.startsWith("- ") && !trimmed.equals("(없음)")) {
                    wp.getIssues().add(trimmed.substring(2).trim());
                    continue;
                }
            }

            // COMMENT
            if (inComment && !trimmed.equals("(없음)") && !trimmed.startsWith("</")) {
                if (trimmed.startsWith("- ")) {
                    commentBuilder.append(trimmed.substring(2)).append("\n");
                } else if (!trimmed.isEmpty()) {
                    commentBuilder.append(trimmed).append("\n");
                }
            }
        }

        String comment = commentBuilder.toString().trim();
        wp.setComment(comment.isEmpty() ? null : comment);
        String goal = goalBuilder.toString().trim();
        if (!goal.isEmpty()) wp.setGoal(goal);
        return wp;
    }

    private List<String> parseAddressList(String value) {
        List<String> result = new ArrayList<>();
        if (value == null || value.equals("[]") || value.isEmpty()) {
            return result;
        }
        // Handle [addr1, addr2] or [addr1] format
        String cleaned = value.replaceAll("[\\[\\]]", "").trim();
        if (cleaned.isEmpty()) return result;

        for (String part : cleaned.split(",")) {
            String addr = part.trim();
            if (!addr.isEmpty() && addr.contains("://")) {
                result.add(addr);
            }
        }
        return result;
    }
}
