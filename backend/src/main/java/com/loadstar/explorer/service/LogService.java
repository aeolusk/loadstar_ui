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

    private static final Pattern LOG_LINE = Pattern.compile(
            "\\[(.+?)\\]\\s+\\[(.+?)\\]\\s+(.*)"
    );
    private static final Pattern ADDR_LINE = Pattern.compile(
            "\\s*→\\s*(\\S+)"
    );

    public LogResult findLog(String projectRoot, int offset, int limit, String address, String kind) {
        List<String> args = new ArrayList<>();
        args.add("findlog");
        args.add(String.valueOf(offset));
        args.add(String.valueOf(limit));
        if (address != null && !address.isEmpty()) {
            args.add("--address");
            args.add(address);
        }
        if (kind != null && !kind.isEmpty()) {
            args.add("--kind");
            args.add(kind);
        }

        String output = cli.execute(projectRoot, args.toArray(new String[0]));
        List<LogEntry> entries = parseOutput(output);

        // Check if there are more entries
        boolean hasMore = entries.size() >= limit;

        LogResult result = new LogResult();
        result.setEntries(entries);
        result.setOffset(offset);
        result.setLimit(limit);
        result.setHasMore(hasMore);
        return result;
    }

    private List<LogEntry> parseOutput(String output) {
        List<LogEntry> entries = new ArrayList<>();
        if (output == null || output.isEmpty()) return entries;

        String[] lines = output.split("\n");
        LogEntry current = null;

        for (String line : lines) {
            Matcher logMatch = LOG_LINE.matcher(line.trim());
            if (logMatch.matches()) {
                current = new LogEntry();
                current.setTimestamp(logMatch.group(1).trim());
                current.setKind(logMatch.group(2).trim());
                current.setContent(logMatch.group(3).trim());
                entries.add(current);
                continue;
            }

            Matcher addrMatch = ADDR_LINE.matcher(line);
            if (addrMatch.matches() && current != null) {
                current.setAddress(addrMatch.group(1).trim());
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
