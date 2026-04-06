package com.loadstar.explorer.model;

import lombok.Data;
import java.util.List;

@Data
public class BlackBoxDetailResponse {
    private String address;
    private String status;
    private String syncedAt;

    // DESCRIPTION
    private String summary;
    private String linkedWp;

    // CODE_MAP
    private String codeMapPhase; // "plan" or "actual"
    private List<CodeMapEntry> codeMap;

    // TODO
    private List<TodoItem> todos;

    // ISSUE
    private List<String> issues;

    // COMMENT
    private String comment;

    @Data
    public static class CodeMapEntry {
        private String file;
        private List<CodeMapItem> items;
    }

    @Data
    public static class CodeMapItem {
        private String name;
        private String description;
    }

    @Data
    public static class TodoItem {
        private String text;
        private int wpRef;
        private boolean done;
    }
}
