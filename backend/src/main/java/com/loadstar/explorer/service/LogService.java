package com.loadstar.explorer.service;

import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class LogService {

    private final CliExecutor cli;

    // Single-line format: [timestamp]  [KIND]  content  → address
    private static final Pattern LOG_LINE = Pattern.compile(
            "^\\[(.+?)]\\s+\\[(.+?)]\\s+(.+?)\\s+→\\s+(\\S+)$"
    );

    public LogResult findLog(String projectRoot, int offset, int limit, String address, String kind) {
        // Build CLI args: log [TIME_RANGE] [FILTER]
        List<String> args = new ArrayList<>();
        args.add("log");

        // Use address or kind as keyword filter
        String filter = null;
        if (address != null && !address.isEmpty()) {
            filter = address;
        } else if (kind != null && !kind.isEmpty()) {
            filter = kind;
        }
        if (filter != null) {
            args.add(filter);
        }

        String output = cli.execute(projectRoot, args.toArray(new String[0]));
        List<LogEntry> allEntries = parseOutput(output);

        // Manual offset/limit pagination
        int total = allEntries.size();
        int start = Math.min(offset, total);
        int end = Math.min(start + limit, total);
        List<LogEntry> page = allEntries.subList(start, end);

        LogResult result = new LogResult();
        result.setEntries(new ArrayList<>(page));
        result.setOffset(offset);
        result.setLimit(limit);
        result.setHasMore(end < total);
        return result;
    }

    private List<LogEntry> parseOutput(String output) {
        List<LogEntry> entries = new ArrayList<>();
        if (output == null || output.isEmpty()) return entries;

        for (String line : output.split("\n")) {
            String trimmed = line.trim();
            if (trimmed.isEmpty()) continue;

            Matcher m = LOG_LINE.matcher(trimmed);
            if (m.matches()) {
                LogEntry entry = new LogEntry();
                entry.setTimestamp(m.group(1).trim());
                entry.setKind(m.group(2).trim());
                entry.setContent(m.group(3).trim());
                entry.setAddress(m.group(4).trim());
                entries.add(entry);
            }
        }

        return entries;
    }

    @Data
    public static class LogResult {
        private List<LogEntry> entries;
        private int offset;
        private int limit;
        private boolean hasMore;
    }

    @Data
    public static class LogEntry {
        private String timestamp;
        private String kind;
        private String content;
        private String address;
    }
}
