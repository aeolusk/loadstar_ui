package com.loadstar.explorer.service;

import com.loadstar.explorer.model.*;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class ElementParser {

    private static final Pattern ADDRESS_PATTERN = Pattern.compile("##\\s*\\[ADDRESS\\]\\s*(.+)");
    private static final Pattern STATUS_PATTERN = Pattern.compile("##\\s*\\[STATUS\\]\\s*(\\S+)");
    private static final Pattern SYNCED_AT_PATTERN = Pattern.compile("##\\s*\\[SYNCED_AT\\]\\s*(\\S+)");

    public MapData parseMap(Path file) throws IOException {
        List<String> lines = Files.readAllLines(file);
        MapData map = new MapData();
        List<String> waypoints = new ArrayList<>();
        boolean inWaypoints = false;

        for (String line : lines) {
            String trimmed = line.trim();

            Matcher addrMatch = ADDRESS_PATTERN.matcher(trimmed);
            if (addrMatch.matches()) {
                map.setAddress(addrMatch.group(1).trim());
                continue;
            }

            Matcher statusMatch = STATUS_PATTERN.matcher(trimmed);
            if (statusMatch.matches()) {
                map.setStatus(statusMatch.group(1).trim());
                continue;
            }

            if (trimmed.startsWith("- SUMMARY:")) {
                map.setSummary(trimmed.substring("- SUMMARY:".length()).trim());
                continue;
            }

            if (trimmed.equals("### WAYPOINTS")) {
                inWaypoints = true;
                continue;
            }

            if (trimmed.startsWith("### ") && !trimmed.equals("### WAYPOINTS")) {
                inWaypoints = false;
                continue;
            }

            if (inWaypoints && trimmed.startsWith("- ")) {
                String addr = trimmed.substring(2).trim();
                if (!addr.isEmpty() && (addr.startsWith("M://") || addr.startsWith("W://"))) {
                    waypoints.add(addr);
                }
            }
        }

        map.setWaypoints(waypoints);
        return map;
    }

    public WayPointData parseWayPoint(Path file) throws IOException {
        List<String> lines = Files.readAllLines(file);
        WayPointData wp = new WayPointData();
        wp.setChildren(new ArrayList<>());
        wp.setReferences(new ArrayList<>());

        String currentSection = "";

        for (String line : lines) {
            String trimmed = line.trim();

            Matcher addrMatch = ADDRESS_PATTERN.matcher(trimmed);
            if (addrMatch.matches()) {
                wp.setAddress(addrMatch.group(1).trim());
                continue;
            }

            Matcher statusMatch = STATUS_PATTERN.matcher(trimmed);
            if (statusMatch.matches()) {
                wp.setStatus(statusMatch.group(1).trim());
                continue;
            }

            if (trimmed.startsWith("### ")) {
                currentSection = trimmed;
                continue;
            }

            if (trimmed.startsWith("- SUMMARY:")) {
                wp.setSummary(trimmed.substring("- SUMMARY:".length()).trim());
                continue;
            }

            if (trimmed.startsWith("- SYNCED_AT:")) {
                wp.setSyncedAt(trimmed.substring("- SYNCED_AT:".length()).trim());
                continue;
            }

            if (trimmed.startsWith("- PARENT:")) {
                wp.setParent(trimmed.substring("- PARENT:".length()).trim());
                continue;
            }

            if (trimmed.startsWith("- BLACKBOX:")) {
                String bb = trimmed.substring("- BLACKBOX:".length()).trim();
                if (!bb.isEmpty() && bb.startsWith("B://")) {
                    wp.setBlackbox(bb);
                }
                continue;
            }

            if (trimmed.startsWith("- CHILDREN:")) {
                String val = trimmed.substring("- CHILDREN:".length()).trim();
                wp.setChildren(parseAddressList(val));
                continue;
            }

            if (trimmed.startsWith("- REFERENCE:")) {
                String val = trimmed.substring("- REFERENCE:".length()).trim();
                wp.setReferences(parseAddressList(val));
                continue;
            }
        }

        return wp;
    }

    public BlackBoxData parseBlackBox(Path file) throws IOException {
        List<String> lines = Files.readAllLines(file);
        BlackBoxData bb = new BlackBoxData();

        for (String line : lines) {
            String trimmed = line.trim();

            Matcher addrMatch = ADDRESS_PATTERN.matcher(trimmed);
            if (addrMatch.matches()) {
                bb.setAddress(addrMatch.group(1).trim());
                continue;
            }

            Matcher statusMatch = STATUS_PATTERN.matcher(trimmed);
            if (statusMatch.matches()) {
                bb.setStatus(statusMatch.group(1).trim());
                continue;
            }

            Matcher syncedMatch = SYNCED_AT_PATTERN.matcher(trimmed);
            if (syncedMatch.matches()) {
                bb.setSyncedAt(syncedMatch.group(1).trim());
                continue;
            }

            if (trimmed.startsWith("- SUMMARY:")) {
                bb.setSummary(trimmed.substring("- SUMMARY:".length()).trim());
                continue;
            }

            if (trimmed.startsWith("- LINKED_WP:")) {
                bb.setLinkedWp(trimmed.substring("- LINKED_WP:".length()).trim());
                continue;
            }
        }

        return bb;
    }

    private List<String> parseAddressList(String value) {
        List<String> result = new ArrayList<>();
        if (value == null || value.equals("[]") || value.isEmpty()) {
            return result;
        }
        // Handle [addr1, addr2] or [addr1] format
        String cleaned = value.replaceAll("[\\[\\]]", "").trim();
        if (cleaned.isEmpty()) return result;

        for (String part : cleaned.split(",")) {
            String addr = part.trim();
            if (!addr.isEmpty() && addr.contains("://")) {
                result.add(addr);
            }
        }
        return result;
    }
}
