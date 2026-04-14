package com.loadstar.explorer.service;

import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class TodoService {

    private final CliExecutor cli;

    // History cache: projectRoot → cached history items
    private final ConcurrentHashMap<String, List<TodoHistoryItem>> historyCache = new ConcurrentHashMap<>();

    // tabwriter 공백 구분 형식: ADDRESS  STATUS  SUMMARY (2+ spaces between columns)
    private static final Pattern LIST_ROW = Pattern.compile(
            "^(\\S+)\\s{2,}(\\S+)\\s{2,}(.+)$"
    );

    // tabwriter 공백 구분 형식: ADDRESS  DATE  ITEM
    private static final Pattern HISTORY_ROW = Pattern.compile(
            "^(\\S+)\\s{2,}(\\S+)\\s{2,}(.+)$"
    );

    public List<TodoItem> list(String projectRoot) {
        String output = cli.execute(projectRoot, "todo", "list");
        return parseListOutput(output);
    }

    public SyncResult sync(String projectRoot, String address) {
        String output;
        if (address != null && !address.isEmpty()) {
            output = cli.execute(projectRoot, "todo", "sync", address);
        } else {
            output = cli.execute(projectRoot, "todo", "sync");
        }
        // Invalidate history cache after sync
        historyCache.remove(projectRoot);
        return parseSyncOutput(output);
    }

    public List<TodoHistoryItem> history(String projectRoot, String mapAddress) {
        // Check cache first
        String cacheKey = projectRoot + "|" + (mapAddress != null ? mapAddress : "");
        List<TodoHistoryItem> cached = historyCache.get(cacheKey);
        if (cached != null) {
            return cached;
        }

        String output;
        if (mapAddress != null && !mapAddress.isEmpty()) {
            output = cli.execute(projectRoot, "todo", "history", mapAddress);
        } else {
            output = cli.execute(projectRoot, "todo", "history");
        }
        List<TodoHistoryItem> items = parseHistoryOutput(output);
        historyCache.put(cacheKey, items);
        return items;
    }

    public void clearHistoryCache(String projectRoot) {
        historyCache.keySet().removeIf(k -> k.startsWith(projectRoot));
    }

    private List<TodoItem> parseListOutput(String output) {
        List<TodoItem> items = new ArrayList<>();
        if (output == null || output.isEmpty()) return items;

        for (String line : output.split("\n")) {
            String trimmed = line.trim();
            if (trimmed.startsWith("ADDRESS") || trimmed.startsWith("-------") || trimmed.isEmpty()) continue;
            if (trimmed.endsWith("item(s)")) continue;

            Matcher m = LIST_ROW.matcher(trimmed);
            if (m.matches()) {
                TodoItem item = new TodoItem();
                item.setAddress(m.group(1).trim());
                item.setStatus(m.group(2).trim().replaceAll("[\\[\\]]", ""));
                item.setSummary(m.group(3).trim());
                items.add(item);
            }
        }
        return items;
    }

    private List<TodoHistoryItem> parseHistoryOutput(String output) {
        List<TodoHistoryItem> items = new ArrayList<>();
        if (output == null || output.isEmpty()) return items;

        for (String line : output.split("\n")) {
            String trimmed = line.trim();
            if (trimmed.startsWith("ADDRESS") || trimmed.startsWith("-------") || trimmed.isEmpty()) continue;
            if (trimmed.endsWith("item(s)")) continue;
            if (trimmed.equals("no completed items found")) continue;

            Matcher m = HISTORY_ROW.matcher(trimmed);
            if (m.matches()) {
                TodoHistoryItem item = new TodoHistoryItem();
                item.setAddress(m.group(1).trim());
                item.setDate(m.group(2).trim());
                item.setItem(m.group(3).trim());
                items.add(item);
            }
        }
        return items;
    }

    private SyncResult parseSyncOutput(String output) {
        SyncResult result = new SyncResult();
        result.setOutput(output != null ? output.trim() : "");
        // Parse "sync complete: N added, N updated, N removed (N total)"
        if (output != null && output.contains("sync complete:")) {
            Pattern p = Pattern.compile("(\\d+) added, (\\d+) updated, (\\d+) removed \\((\\d+) total\\)");
            Matcher m = p.matcher(output);
            if (m.find()) {
                result.setAdded(Integer.parseInt(m.group(1)));
                result.setUpdated(Integer.parseInt(m.group(2)));
                result.setRemoved(Integer.parseInt(m.group(3)));
                result.setTotal(Integer.parseInt(m.group(4)));
            }
        }
        return result;
    }

    @Data
    public static class TodoItem {
        private String address;
        private String status;
        private String summary;
    }

    @Data
    public static class TodoHistoryItem {
        private String address;
        private String date;
        private String item;
    }

    @Data
    public static class SyncResult {
        private String output;
        private int added;
        private int updated;
        private int removed;
        private int total;
    }
}
