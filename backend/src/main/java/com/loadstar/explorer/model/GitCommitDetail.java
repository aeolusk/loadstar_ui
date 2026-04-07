package com.loadstar.explorer.model;

import lombok.Data;
import java.util.List;

@Data
public class GitCommitDetail {
    private String hash;
    private String date;
    private String author;
    private String message;
    private List<FileChange> files;

    @Data
    public static class FileChange {
        private String changeType; // A=Added, M=Modified, D=Deleted
        private String filePath;
    }
}
