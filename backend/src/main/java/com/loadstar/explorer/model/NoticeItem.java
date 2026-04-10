package com.loadstar.explorer.model;

import lombok.Data;

@Data
public class NoticeItem {
    private String id;          // 파일명 (확장자 제외, e.g. "001")
    private String title;
    private String category;    // NOTICE | MEMO | RISK | DEBT | DECISION
    private String priority;    // HIGH | MEDIUM | LOW
    private String status;      // OPEN | RESOLVED
    private String created;     // YYYY-MM-DD
    private String resolved;    // YYYY-MM-DD or null
    private String content;     // 본문 마크다운
    private String filePath;    // .loadstar/NOTICE/001.md (git history 조회용)
}
