package com.loadstar.explorer.service;

import com.loadstar.explorer.model.MapData;
import com.loadstar.explorer.model.WayPointDetailResponse;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

@Component
public class ElementWriter {

    public void writeWayPoint(Path file, WayPointDetailResponse wp) throws IOException {
        List<String> lines = new ArrayList<>();

        lines.add("<WAYPOINT>");
        lines.add("## [ADDRESS] " + wp.getAddress());
        lines.add("## [STATUS] " + wp.getStatus());
        lines.add("");

        // IDENTITY
        lines.add("### IDENTITY");
        lines.add("- SUMMARY: " + nvl(wp.getSummary()));

        StringBuilder meta = new StringBuilder("[");
        if (wp.getVersion() != null) meta.append("Ver: ").append(wp.getVersion());
        if (wp.getCreated() != null) {
            if (meta.length() > 1) meta.append(", ");
            meta.append("Created: ").append(wp.getCreated());
        }
        if (wp.getPriority() != null) {
            if (meta.length() > 1) meta.append(", ");
            meta.append("Priority: ").append(wp.getPriority());
        }
        meta.append("]");
        lines.add("- METADATA: " + meta);

        if (wp.getSyncedAt() != null && !wp.getSyncedAt().isEmpty()) {
            lines.add("- SYNCED_AT: " + wp.getSyncedAt());
        }
        lines.add("");

        // CONNECTIONS
        lines.add("### CONNECTIONS");
        lines.add("- PARENT: " + nvl(wp.getParent()));
        lines.add("- CHILDREN: " + formatList(wp.getChildren()));
        lines.add("- REFERENCE: " + formatList(wp.getReferences()));
        lines.add("");

        // CODE_MAP
        if (wp.getCodeMapScopes() != null && !wp.getCodeMapScopes().isEmpty()) {
            lines.add("### CODE_MAP");
            lines.add("- scope:");
            for (String scope : wp.getCodeMapScopes()) {
                lines.add("  - " + scope);
            }
            lines.add("");
        }

        // TODO
        lines.add("### TODO");
        if (wp.getTechSpec() != null && !wp.getTechSpec().isEmpty()) {
            if (wp.getTodoAddress() != null) lines.add("- ADDRESS: " + wp.getTodoAddress());
            if (wp.getTodoSummary() != null) lines.add("- SUMMARY: " + wp.getTodoSummary());
            for (WayPointDetailResponse.TechSpecItem item : wp.getTechSpec()) {
                if (item.isRecurring()) {
                    lines.add("- (R) " + item.getText());
                } else {
                    String check = item.isDone() ? "[x]" : "[ ]";
                    lines.add("- " + check + " " + item.getText());
                }
            }
        } else {
            lines.add("(없음)");
        }
        lines.add("");

        // ISSUE
        lines.add("### ISSUE");
        boolean hasIssueContent = false;
        if (wp.getOpenQuestions() != null && !wp.getOpenQuestions().isEmpty()) {
            lines.add("- OPEN_QUESTIONS:");
            for (WayPointDetailResponse.OpenQuestion oq : wp.getOpenQuestions()) {
                String state = oq.getState() != null ? oq.getState()
                        : (oq.isResolved() ? "RESOLVED" : "OPEN");
                String tag = oq.getId();
                switch (state) {
                    case "DEFERRED" -> tag += " DEFERRED";
                    case "RESOLVED" -> tag += " RESOLVED" + (oq.getResolvedRef() != null ? " " + oq.getResolvedRef() : "");
                    case "DONE"     -> tag += " DONE"     + (oq.getResolvedRef() != null ? " " + oq.getResolvedRef() : "");
                }
                lines.add("  - [" + tag + "] " + (oq.getText() != null ? oq.getText() : ""));
            }
            hasIssueContent = true;
        }
        if (wp.getIssues() != null && !wp.getIssues().isEmpty()) {
            for (String issue : wp.getIssues()) {
                lines.add("- " + issue);
            }
            hasIssueContent = true;
        }
        if (!hasIssueContent) {
            lines.add("(없음)");
        }
        lines.add("");

        // COMMENT
        lines.add("### COMMENT");
        if (wp.getComment() != null && !wp.getComment().isEmpty()) {
            lines.add("- " + wp.getComment());
        } else {
            lines.add("(없음)");
        }

        lines.add("</WAYPOINT>");

        Files.write(file, lines, StandardCharsets.UTF_8);
    }

    public void writeDwp(Path file, WayPointDetailResponse wp) throws IOException {
        List<String> lines = new ArrayList<>();

        lines.add("<DWP>");
        lines.add("## [ADDRESS] " + wp.getAddress());
        lines.add("## [STATUS] " + wp.getStatus());
        lines.add("");

        // IDENTITY
        lines.add("### IDENTITY");
        lines.add("- SUMMARY: " + nvl(wp.getSummary()));
        StringBuilder meta = new StringBuilder("[");
        if (wp.getVersion() != null) meta.append("Ver: ").append(wp.getVersion());
        if (wp.getCreated() != null) {
            if (meta.length() > 1) meta.append(", ");
            meta.append("Created: ").append(wp.getCreated());
        }
        if (wp.getPriority() != null) {
            if (meta.length() > 1) meta.append(", ");
            meta.append("Priority: ").append(wp.getPriority());
        }
        meta.append("]");
        lines.add("- METADATA: " + meta);
        if (wp.getSyncedAt() != null && !wp.getSyncedAt().isEmpty()) {
            lines.add("- SYNCED_AT: " + wp.getSyncedAt());
        }
        lines.add("");

        // CONNECTIONS (no CHILDREN for DWP)
        lines.add("### CONNECTIONS");
        lines.add("- PARENT: " + nvl(wp.getParent()));
        lines.add("- REFERENCE: " + formatList(wp.getReferences()));
        lines.add("");

        // TABLES
        if (wp.getTables() != null && !wp.getTables().isEmpty()) {
            lines.add("### TABLES");
            for (WayPointDetailResponse.TableEntry table : wp.getTables()) {
                lines.add("- " + table.getName() + ":");
                if (table.getItems() != null) {
                    for (String item : table.getItems()) {
                        lines.add("  - " + item);
                    }
                }
            }
            lines.add("");
        }

        // CODE_MAP
        if (wp.getCodeMapScopes() != null && !wp.getCodeMapScopes().isEmpty()) {
            lines.add("### CODE_MAP");
            lines.add("- scope:");
            for (String scope : wp.getCodeMapScopes()) {
                lines.add("  - " + scope);
            }
            lines.add("");
        }

        // ISSUE
        lines.add("### ISSUE");
        boolean hasIssueContent = false;
        if (wp.getOpenQuestions() != null && !wp.getOpenQuestions().isEmpty()) {
            lines.add("- OPEN_QUESTIONS:");
            for (WayPointDetailResponse.OpenQuestion oq : wp.getOpenQuestions()) {
                String state = oq.getState() != null ? oq.getState()
                        : (oq.isResolved() ? "RESOLVED" : "OPEN");
                String tag = oq.getId();
                switch (state) {
                    case "DEFERRED" -> tag += " DEFERRED";
                    case "RESOLVED" -> tag += " RESOLVED" + (oq.getResolvedRef() != null ? " " + oq.getResolvedRef() : "");
                    case "DONE"     -> tag += " DONE"     + (oq.getResolvedRef() != null ? " " + oq.getResolvedRef() : "");
                }
                lines.add("  - [" + tag + "] " + (oq.getText() != null ? oq.getText() : ""));
            }
            hasIssueContent = true;
        }
        if (wp.getIssues() != null && !wp.getIssues().isEmpty()) {
            for (String issue : wp.getIssues()) {
                lines.add("- " + issue);
            }
            hasIssueContent = true;
        }
        if (!hasIssueContent) lines.add("(없음)");
        lines.add("");

        // COMMENT
        lines.add("### COMMENT");
        if (wp.getComment() != null && !wp.getComment().isEmpty()) {
            lines.add("- " + wp.getComment());
        } else {
            lines.add("(없음)");
        }
        lines.add("</DWP>");

        Files.write(file, lines, StandardCharsets.UTF_8);
    }

    private String nvl(String val) {
        return val == null ? "" : val;
    }

    public void writeMap(Path file, MapData map) throws IOException {
        List<String> lines = new ArrayList<>();

        lines.add("<MAP>");
        lines.add("## [ADDRESS] " + map.getAddress());
        lines.add("## [STATUS] " + map.getStatus());
        lines.add("");

        lines.add("### IDENTITY");
        lines.add("- SUMMARY: " + nvl(map.getSummary()));
        lines.add("");

        lines.add("### WAYPOINTS");
        if (map.getWaypoints() != null && !map.getWaypoints().isEmpty()) {
            for (String wp : map.getWaypoints()) {
                lines.add("- " + wp);
            }
        } else {
            lines.add("(없음)");
        }
        lines.add("");

        lines.add("### COMMENT");
        lines.add("(없음)");
        lines.add("</MAP>");

        Files.write(file, lines, StandardCharsets.UTF_8);
    }

    public void writeWayPointSkeleton(Path file, String address, String parentAddress, String summary) throws IOException {
        List<String> lines = new ArrayList<>();

        lines.add("<WAYPOINT>");
        lines.add("## [ADDRESS] " + address);
        lines.add("## [STATUS] S_IDL");
        lines.add("");
        lines.add("### IDENTITY");
        lines.add("- SUMMARY: " + (summary != null ? summary : ""));
        lines.add("- METADATA: [Created: " + java.time.LocalDate.now() + "]");
        lines.add("");
        lines.add("### CONNECTIONS");
        lines.add("- PARENT: " + parentAddress);
        lines.add("- CHILDREN: []");
        lines.add("- REFERENCE: []");
        lines.add("");
        lines.add("### TODO");
        lines.add("(없음)");
        lines.add("");
        lines.add("### ISSUE");
        lines.add("(없음)");
        lines.add("");
        lines.add("### COMMENT");
        lines.add("(없음)");
        lines.add("</WAYPOINT>");

        Files.write(file, lines, StandardCharsets.UTF_8);
    }

    private String formatList(List<String> list) {
        if (list == null || list.isEmpty()) return "[]";
        return "[" + String.join(", ", list) + "]";
    }
}
