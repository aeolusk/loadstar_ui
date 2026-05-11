package com.loadstar.explorer.model;

import lombok.Data;
import java.util.List;

@Data
public class WayPointDetailResponse {
    private String address;
    private String status;

    // IDENTITY
    private String summary;
    private String goal;
    private String syncedAt;
    private String version;
    private String created;
    private String priority;

    // CONNECTIONS
    private String parent;
    private List<String> children;
    private List<String> references;

    // CODE_MAP
    private List<String> codeMapScopes;

    // TODO
    private String todoAddress;
    private String todoSummary;
    private List<TechSpecItem> techSpec;

    // ISSUE / OPEN_QUESTIONS
    private List<String> issues;
    private List<OpenQuestion> openQuestions;

    // COMMENT
    private String comment;

    // TABLES (DWP only)
    private List<TableEntry> tables;

    @Data
    public static class TableEntry {
        private String name;
        private List<String> items;
    }

    @Data
    public static class TechSpecItem {
        private String text;
        private boolean done;
        private boolean recurring;
    }

    @Data
    public static class OpenQuestion {
        private String id;          // "Q1" — just the number part
        private String state;       // OPEN | DEFERRED | RESOLVED | DONE
        private String resolvedRef; // decision file id (without .md), null if none
        private String text;
        private boolean resolved;   // true if state is RESOLVED or DONE
    }
}
