package com.loadstar.explorer.model;

import lombok.Data;
import java.util.List;

@Data
public class WayPointDetailResponse {
    private String address;
    private String status;

    // IDENTITY
    private String summary;
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

    // TODO / TECH_SPEC
    private String todoAddress;
    private String todoSummary;
    private List<TechSpecItem> techSpec;

    // ISSUE / OPEN_QUESTIONS
    private List<String> issues;
    private List<OpenQuestion> openQuestions;

    // COMMENT
    private String comment;

    @Data
    public static class TechSpecItem {
        private String text;
        private boolean done;
    }

    @Data
    public static class OpenQuestion {
        private String id;
        private String text;
        private boolean resolved;
    }
}
