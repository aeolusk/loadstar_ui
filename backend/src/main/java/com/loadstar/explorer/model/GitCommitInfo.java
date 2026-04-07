package com.loadstar.explorer.model;

import lombok.Data;

@Data
public class GitCommitInfo {
    private String hash;
    private String date;
    private String author;
    private String message;
}
