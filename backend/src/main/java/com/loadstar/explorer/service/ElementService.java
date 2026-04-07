package com.loadstar.explorer.service;

import com.loadstar.explorer.model.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ElementService {

    private final ElementParser parser;
    private final ElementWriter writer;
    private final CliExecutor cli;

    private Path getLoadstarRoot(String projectRoot) {
        return Paths.get(projectRoot, ".loadstar");
    }

    private Path addressToPath(String projectRoot, String address) {
        Path root = getLoadstarRoot(projectRoot);
        String typeDir;
        String pathPart;

        if (address.startsWith("M://")) {
            typeDir = "MAP";
            pathPart = address.substring(4);
        } else if (address.startsWith("W://")) {
            typeDir = "WAYPOINT";
            pathPart = address.substring(4);
        } else if (address.startsWith("B://")) {
            typeDir = "BLACKBOX";
            pathPart = address.substring(4);
        } else {
            throw new IllegalArgumentException("Unknown address type: " + address);
        }

        String fileName = pathPart.replace("/", ".") + ".md";
        return root.resolve(typeDir).resolve(fileName);
    }

    /**
     * Validate that the given project root has a .loadstar directory.
     */
    public boolean isValidProject(String projectRoot) {
        Path loadstar = getLoadstarRoot(projectRoot);
        return Files.isDirectory(loadstar) && Files.exists(loadstar.resolve("MAP").resolve("root.md"));
    }

    public MapViewResponse getMapView(String projectRoot, String mapAddress) throws IOException {
        Path mapFile = addressToPath(projectRoot, mapAddress);
        if (!Files.exists(mapFile)) {
            throw new IOException("Map file not found: " + mapFile);
        }

        MapData mapData = parser.parseMap(mapFile);
        MapViewResponse response = new MapViewResponse();
        response.setMap(mapData);

        List<MapViewResponse.MapViewItem> items = new ArrayList<>();

        for (String childAddr : mapData.getWaypoints()) {
            MapViewResponse.MapViewItem item = new MapViewResponse.MapViewItem();
            item.setAddress(childAddr);

            try {
                if (childAddr.startsWith("M://")) {
                    Path childFile = addressToPath(projectRoot, childAddr);
                    if (Files.exists(childFile)) {
                        MapData childMap = parser.parseMap(childFile);
                        item.setType("MAP");
                        item.setStatus(childMap.getStatus());
                        item.setSummary(childMap.getSummary());
                    }
                } else if (childAddr.startsWith("W://")) {
                    Path wpFile = addressToPath(projectRoot, childAddr);
                    if (Files.exists(wpFile)) {
                        WayPointData wp = parser.parseWayPoint(wpFile);
                        item.setType("WAYPOINT");
                        item.setStatus(wp.getStatus());
                        item.setSummary(wp.getSummary());
                        item.setChildren(wp.getChildren());
                        item.setReferences(wp.getReferences());
                        item.setBlackbox(wp.getBlackbox());

                        if (wp.getBlackbox() != null) {
                            Path bbFile = addressToPath(projectRoot, wp.getBlackbox());
                            if (Files.exists(bbFile)) {
                                BlackBoxData bb = parser.parseBlackBox(bbFile);
                                item.setBlackboxStatus(bb.getStatus());
                                item.setBlackboxSyncedAt(bb.getSyncedAt());
                            }
                        }
                    }
                }
            } catch (Exception e) {
                log.warn("Failed to parse child element: {}", childAddr, e);
                item.setType(childAddr.startsWith("M://") ? "MAP" : "WAYPOINT");
                item.setStatus("S_ERR");
                item.setSummary("Parse error: " + e.getMessage());
            }

            items.add(item);
        }

        response.setItems(items);
        return response;
    }

    public WayPointDetailResponse getWayPointDetail(String projectRoot, String address) throws IOException {
        Path file = addressToPath(projectRoot, address);
        if (!Files.exists(file)) throw new IOException("WayPoint not found: " + file);
        return parser.parseWayPointDetail(file);
    }

    public BlackBoxDetailResponse getBlackBoxDetail(String projectRoot, String address) throws IOException {
        Path file = addressToPath(projectRoot, address);
        if (!Files.exists(file)) throw new IOException("BlackBox not found: " + file);
        return parser.parseBlackBoxDetail(file);
    }

    public WayPointDetailResponse updateWayPoint(String projectRoot, WayPointDetailResponse data) throws IOException {
        String address = data.getAddress();
        Path file = addressToPath(projectRoot, address);
        if (!Files.exists(file)) throw new IOException("WayPoint not found: " + file);

        // Read existing to preserve CONNECTIONS (which are not editable from UI)
        WayPointDetailResponse existing = parser.parseWayPointDetail(file);
        data.setParent(existing.getParent());
        data.setChildren(existing.getChildren());
        data.setReferences(existing.getReferences());
        data.setBlackbox(existing.getBlackbox());
        if (data.getCreated() == null) data.setCreated(existing.getCreated());
        if (data.getTodoAddress() == null) data.setTodoAddress(existing.getTodoAddress());

        // Detect deleted TECH_SPEC items → register in TODO_HISTORY
        recordDeletedTechSpec(projectRoot, address, existing.getTechSpec(), data.getTechSpec());

        // Write updated md
        writer.writeWayPoint(file, data);

        // Log change via CLI
        cli.logModified(projectRoot, address, buildChangeSummary(existing, data));

        // Return fresh data
        return parser.parseWayPointDetail(file);
    }

    private void recordDeletedTechSpec(String projectRoot, String address,
                                        List<WayPointDetailResponse.TechSpecItem> before,
                                        List<WayPointDetailResponse.TechSpecItem> after) {
        if (before == null || before.isEmpty()) return;
        java.util.Set<String> afterTexts = new java.util.HashSet<>();
        if (after != null) {
            for (WayPointDetailResponse.TechSpecItem item : after) {
                afterTexts.add(item.getText());
            }
        }
        for (WayPointDetailResponse.TechSpecItem item : before) {
            if (!afterTexts.contains(item.getText())) {
                String summary = "[TECH_SPEC] " + item.getText() + (item.isDone() ? " (완료)" : " (미완료)");
                cli.todoAddAndDone(projectRoot, address, summary);
            }
        }
    }

    private String buildChangeSummary(WayPointDetailResponse before, WayPointDetailResponse after) {
        List<String> changes = new ArrayList<>();
        if (!eq(before.getStatus(), after.getStatus())) changes.add("STATUS " + before.getStatus() + " -> " + after.getStatus());
        if (!eq(before.getSummary(), after.getSummary())) changes.add("SUMMARY changed");
        if (!eq(before.getComment(), after.getComment())) changes.add("COMMENT changed");

        int beforeDone = before.getTechSpec() != null ? (int) before.getTechSpec().stream().filter(WayPointDetailResponse.TechSpecItem::isDone).count() : 0;
        int afterDone = after.getTechSpec() != null ? (int) after.getTechSpec().stream().filter(WayPointDetailResponse.TechSpecItem::isDone).count() : 0;
        int beforeTotal = before.getTechSpec() != null ? before.getTechSpec().size() : 0;
        int afterTotal = after.getTechSpec() != null ? after.getTechSpec().size() : 0;
        if (beforeDone != afterDone || beforeTotal != afterTotal) changes.add("TECH_SPEC " + beforeDone + "/" + beforeTotal + " -> " + afterDone + "/" + afterTotal);

        int beforeIssues = before.getIssues() != null ? before.getIssues().size() : 0;
        int afterIssues = after.getIssues() != null ? after.getIssues().size() : 0;
        if (beforeIssues != afterIssues) changes.add("ISSUE count " + beforeIssues + " -> " + afterIssues);

        return changes.isEmpty() ? "updated" : String.join(", ", changes);
    }

    public BlackBoxDetailResponse updateBlackBox(String projectRoot, BlackBoxDetailResponse data) throws IOException {
        String address = data.getAddress();
        Path file = addressToPath(projectRoot, address);
        if (!Files.exists(file)) throw new IOException("BlackBox not found: " + file);

        // Read existing to preserve LINKED_WP
        BlackBoxDetailResponse existing = parser.parseBlackBoxDetail(file);
        if (data.getLinkedWp() == null) data.setLinkedWp(existing.getLinkedWp());

        // Detect deleted TODO items → register in TODO_HISTORY
        recordDeletedBlackBoxTodo(projectRoot, address, existing.getTodos(), data.getTodos());

        // Write updated md
        writer.writeBlackBox(file, data);

        // Log change via CLI
        cli.logModified(projectRoot, address, buildBlackBoxChangeSummary(existing, data));

        // Return fresh data
        return parser.parseBlackBoxDetail(file);
    }

    private String buildBlackBoxChangeSummary(BlackBoxDetailResponse before, BlackBoxDetailResponse after) {
        List<String> changes = new ArrayList<>();
        if (!eq(before.getStatus(), after.getStatus())) changes.add("STATUS " + before.getStatus() + " -> " + after.getStatus());
        if (!eq(before.getSummary(), after.getSummary())) changes.add("SUMMARY changed");
        if (!eq(before.getComment(), after.getComment())) changes.add("COMMENT changed");
        if (!eq(before.getCodeMapPhase(), after.getCodeMapPhase())) changes.add("CODE_MAP phase changed");

        int beforeDone = before.getTodos() != null ? (int) before.getTodos().stream().filter(BlackBoxDetailResponse.TodoItem::isDone).count() : 0;
        int afterDone = after.getTodos() != null ? (int) after.getTodos().stream().filter(BlackBoxDetailResponse.TodoItem::isDone).count() : 0;
        int beforeTotal = before.getTodos() != null ? before.getTodos().size() : 0;
        int afterTotal = after.getTodos() != null ? after.getTodos().size() : 0;
        if (beforeDone != afterDone || beforeTotal != afterTotal) changes.add("TODO " + beforeDone + "/" + beforeTotal + " -> " + afterDone + "/" + afterTotal);

        int beforeIssues = before.getIssues() != null ? before.getIssues().size() : 0;
        int afterIssues = after.getIssues() != null ? after.getIssues().size() : 0;
        if (beforeIssues != afterIssues) changes.add("ISSUE count " + beforeIssues + " -> " + afterIssues);

        return changes.isEmpty() ? "updated" : String.join(", ", changes);
    }

    private void recordDeletedBlackBoxTodo(String projectRoot, String address,
                                            List<BlackBoxDetailResponse.TodoItem> before,
                                            List<BlackBoxDetailResponse.TodoItem> after) {
        if (before == null || before.isEmpty()) return;
        java.util.Set<String> afterTexts = new java.util.HashSet<>();
        if (after != null) {
            for (BlackBoxDetailResponse.TodoItem item : after) {
                afterTexts.add(item.getText());
            }
        }
        for (BlackBoxDetailResponse.TodoItem item : before) {
            if (!afterTexts.contains(item.getText())) {
                String summary = "[TODO] " + item.getText() + (item.isDone() ? " (완료)" : " (미완료)");
                cli.todoAddAndDone(projectRoot, address, summary);
            }
        }
    }

    private boolean eq(String a, String b) {
        if (a == null && b == null) return true;
        if (a == null || b == null) return false;
        return a.equals(b);
    }

    public List<TreeNodeDto> getTree(String projectRoot) throws IOException {
        Path rootMap = getLoadstarRoot(projectRoot).resolve("MAP").resolve("root.md");
        if (!Files.exists(rootMap)) {
            return List.of();
        }
        return List.of(buildTreeNode(projectRoot, "M://root"));
    }

    private TreeNodeDto buildTreeNode(String projectRoot, String address) throws IOException {
        TreeNodeDto node = new TreeNodeDto();
        node.setAddress(address);

        Path file = addressToPath(projectRoot, address);
        if (!Files.exists(file)) {
            node.setType(address.startsWith("M://") ? "MAP" : address.startsWith("W://") ? "WAYPOINT" : "BLACKBOX");
            node.setStatus("S_ERR");
            node.setSummary("File not found");
            node.setChildren(List.of());
            return node;
        }

        if (address.startsWith("M://")) {
            MapData map = parser.parseMap(file);
            node.setType("MAP");
            node.setStatus(map.getStatus());
            node.setSummary(map.getSummary());

            List<TreeNodeDto> children = new ArrayList<>();
            for (String childAddr : map.getWaypoints()) {
                children.add(buildTreeNode(projectRoot, childAddr));
            }
            node.setChildren(children);
        } else if (address.startsWith("W://")) {
            WayPointData wp = parser.parseWayPoint(file);
            node.setType("WAYPOINT");
            node.setStatus(wp.getStatus());
            node.setSummary(wp.getSummary());
            node.setReferences(wp.getReferences());
            node.setBlackbox(wp.getBlackbox());

            List<TreeNodeDto> children = new ArrayList<>();
            if (wp.getBlackbox() != null) {
                children.add(buildTreeNode(projectRoot, wp.getBlackbox()));
            }
            if (wp.getChildren() != null) {
                for (String childAddr : wp.getChildren()) {
                    children.add(buildTreeNode(projectRoot, childAddr));
                }
            }
            node.setChildren(children);
        } else if (address.startsWith("B://")) {
            BlackBoxData bb = parser.parseBlackBox(file);
            node.setType("BLACKBOX");
            node.setStatus(bb.getStatus());
            node.setSummary(bb.getSummary());
            node.setChildren(List.of());
        }

        return node;
    }

    @lombok.Data
    public static class TreeNodeDto {
        private String address;
        private String type;
        private String status;
        private String summary;
        private List<String> references;
        private String blackbox;
        private List<TreeNodeDto> children;
    }
}
