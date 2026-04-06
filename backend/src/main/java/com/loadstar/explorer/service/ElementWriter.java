package com.loadstar.explorer.service;

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
        if (wp.getBlackbox() != null && !wp.getBlackbox().isEmpty()) {
            lines.add("- BLACKBOX: " + wp.getBlackbox());
        }
        lines.add("");

        // TODO
        lines.add("### TODO");
        if (wp.getTechSpec() != null && !wp.getTechSpec().isEmpty()) {
            if (wp.getTodoAddress() != null) lines.add("- ADDRESS: " + wp.getTodoAddress());
            if (wp.getTodoSummary() != null) lines.add("- SUMMARY: " + wp.getTodoSummary());
            lines.add("- TECH_SPEC:");
            for (WayPointDetailResponse.TechSpecItem item : wp.getTechSpec()) {
                String check = item.isDone() ? "[x]" : "[ ]";
                lines.add("  - " + check + " " + item.getText());
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
                String tag = oq.isResolved() ? oq.getId() + " RESOLVED" : oq.getId();
                lines.add("  - [" + tag + "] " + oq.getText());
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

    private String nvl(String val) {
        return val == null ? "" : val;
    }

    private String formatList(List<String> list) {
        if (list == null || list.isEmpty()) return "[]";
        return "[" + String.join(", ", list) + "]";
    }
}
