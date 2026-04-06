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
public class TodoService {

    private final CliExecutor cli;

    private static final Pattern TABLE_ROW = Pattern.compile(
            "\\|\\s*(.+?)\\s*\\|\\s*(.+?)\\s*\\|\\s*(.+?)\\s*\\|\\s*(.+?)\\s*\\|\\s*(.+?)\\s*\\|"
    );

    private static final Pattern HISTORY_ROW = Pattern.compile(
            "\\|\\s*(.+?)\\s*\\|\\s*(.+?)\\s*\\|\\s*(.+?)\\s*\\|\\s*(.+?)\\s*\\|\\s*(.+?)\\s*\\|\\s*(.+?)\\s*\\|"
    );

    public List<TodoItem> list(String projectRoot) {
        String output = cli.execute(projectRoot, "todo", "list");
        return parseListOutput(output);
    }

    public List<TodoHistoryItem> history(String projectRoot, String address) {
        String output;
        if (address != null && !address.isEmpty()) {
            output = cli.execute(projectRoot, "todo", "history", address);
        } else {
            output = cli.execute(projectRoot, "todo", "history");
        }
        return parseHistoryOutput(output);
    }

    public String add(String projectRoot, String address, String summary, String dependsOn) {
        if (dependsOn != null && !dependsOn.isEmpty() && !dependsOn.equals("-")) {
            return cli.execute(projectRoot, "todo", "add", address, summary, "--depends", dependsOn);
        }
        return cli.execute(projectRoot, "todo", "add", address, summary);
    }

    public String update(String projectRoot, String address, String status) {
        return cli.execute(projectRoot, "todo", "update", address, status);
    }

    public String done(String projectRoot, String address) {
        return cli.execute(projectRoot, "todo", "done", address);
    }

    public String delete(String projectRoot, String address) {
        return cli.execute(projectRoot, "todo", "delete", address);
    }

    private List<TodoItem> parseListOutput(String output) {
        List<TodoItem> items = new ArrayList<>();
        if (output == null || output.isEmpty()) return items;

        for (String line : output.split("\n")) {
            String trimmed = line.trim();
            if (trimmed.startsWith("| :") || trimmed.startsWith("| 주소")) continue;
            Matcher m = TABLE_ROW.matcher(trimmed);
            if (m.matches()) {
                TodoItem item = new TodoItem();
                item.setAddress(m.group(1).trim());
                item.setTime(m.group(2).trim());
                item.setSummary(m.group(3).trim());
                String status = m.group(4).trim().replaceAll("[\\[\\]]", "");
                item.setStatus(status);
                item.setDependsOn(m.group(5).trim());
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
            if (trimmed.startsWith("| :") || trimmed.startsWith("| 주소") || trimmed.startsWith("| Address")) continue;
            Matcher m = HISTORY_ROW.matcher(trimmed);
            if (m.matches()) {
                TodoHistoryItem item = new TodoHistoryItem();
                item.setAddress(m.group(1).trim());
                item.setTime(m.group(2).trim());
                item.setSummary(m.group(3).trim());
                item.setAction(m.group(4).trim());
                item.setAt(m.group(5).trim());
                item.setDependsOn(m.group(6).trim());
                items.add(item);
            }
        }
        return items;
    }

    @Data
    public static class TodoItem {
        private String address;
        private String time;
        private String summary;
        private String status;
        private String dependsOn;
    }

    @Data
    public static class TodoHistoryItem {
        private String address;
        private String time;
        private String summary;
        private String action;
        private String at;
        private String dependsOn;
    }
}
