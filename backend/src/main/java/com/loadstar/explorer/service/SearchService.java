package com.loadstar.explorer.service;

import com.loadstar.explorer.config.LoadstarProperties;
import com.loadstar.explorer.model.MapData;
import com.loadstar.explorer.model.WayPointData;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;

@Slf4j
@Service
@RequiredArgsConstructor
public class SearchService {

    private final ElementParser parser;
    private final LoadstarProperties properties;

    @Data
    public static class SearchResult {
        private String address;
        private String type;
        private String status;
        private String summary;
        private String snippet;
        private int matchCount;
    }

    public List<SearchResult> search(String projectRoot, String query) throws IOException {
        if (query == null || query.length() < properties.getSearch().getMinQueryLength()) {
            return List.of();
        }

        Path loadstarRoot = Paths.get(projectRoot, ".loadstar");
        List<SearchResult> results = new ArrayList<>();
        int maxResults = properties.getSearch().getMaxResults();
        int snippetLines = properties.getSearch().getSnippetLines();

        // Scan MAP files
        Path mapDir = loadstarRoot.resolve("MAP");
        if (Files.isDirectory(mapDir)) {
            scanDirectory(mapDir, "MAP", query, snippetLines, maxResults, results);
        }

        // Scan WAYPOINT files
        Path wpDir = loadstarRoot.resolve("WAYPOINT");
        if (Files.isDirectory(wpDir)) {
            scanDirectory(wpDir, "WAYPOINT", query, snippetLines, maxResults, results);
        }

        return results;
    }

    private void scanDirectory(Path dir, String type, String query, int snippetLines, int maxResults, List<SearchResult> results) throws IOException {
        try (Stream<Path> files = Files.list(dir)) {
            for (Path file : files.toList()) {
                if (results.size() >= maxResults) break;
                if (!file.toString().endsWith(".md")) continue;

                try {
                    String content = Files.readString(file);
                    String lowerContent = content.toLowerCase();
                    String lowerQuery = query.toLowerCase();

                    if (!lowerContent.contains(lowerQuery)) continue;

                    // Parse header info
                    SearchResult result = new SearchResult();
                    result.setType(type);

                    if ("MAP".equals(type)) {
                        MapData map = parser.parseMap(file);
                        result.setAddress(map.getAddress());
                        result.setStatus(map.getStatus());
                        result.setSummary(map.getSummary());
                    } else {
                        WayPointData wp = parser.parseWayPoint(file);
                        result.setAddress(wp.getAddress());
                        result.setStatus(wp.getStatus());
                        result.setSummary(wp.getSummary());
                    }

                    // Count matches
                    int count = 0;
                    int idx = 0;
                    while ((idx = lowerContent.indexOf(lowerQuery, idx)) >= 0) {
                        count++;
                        idx += lowerQuery.length();
                    }
                    result.setMatchCount(count);

                    // Extract snippet
                    result.setSnippet(extractSnippet(content, query, snippetLines));

                    results.add(result);
                } catch (Exception e) {
                    log.warn("Failed to search file: {}", file, e);
                }
            }
        }
    }

    private String extractSnippet(String content, String query, int snippetLines) {
        String[] lines = content.split("\n");
        String lowerQuery = query.toLowerCase();
        Pattern pattern = Pattern.compile(Pattern.quote(query), Pattern.CASE_INSENSITIVE);

        // Find first matching line
        int matchLine = -1;
        for (int i = 0; i < lines.length; i++) {
            if (lines[i].toLowerCase().contains(lowerQuery)) {
                matchLine = i;
                break;
            }
        }

        if (matchLine < 0) return "";

        // Gather context lines around the match
        int contextBefore = (snippetLines - 1) / 2;
        int contextAfter = snippetLines - 1 - contextBefore;
        int start = Math.max(0, matchLine - contextBefore);
        int end = Math.min(lines.length - 1, matchLine + contextAfter);

        StringBuilder sb = new StringBuilder();
        for (int i = start; i <= end; i++) {
            if (sb.length() > 0) sb.append("\n");
            String line = escapeHtml(lines[i]);
            // Highlight matching text with <mark>
            Matcher matcher = Pattern.compile(Pattern.quote(escapeHtml(query)), Pattern.CASE_INSENSITIVE).matcher(line);
            line = matcher.replaceAll(m -> "<mark>" + m.group() + "</mark>");
            sb.append(line);
        }

        return sb.toString();
    }

    private String escapeHtml(String text) {
        return text.replace("&", "&amp;")
                   .replace("<", "&lt;")
                   .replace(">", "&gt;")
                   .replace("\"", "&quot;");
    }
}
