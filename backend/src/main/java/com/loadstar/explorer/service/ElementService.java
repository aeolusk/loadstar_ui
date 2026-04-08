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

        // Resolve child WP details for display
        java.util.Map<String, MapViewResponse.ChildDetail> childDetails = new java.util.HashMap<>();
        for (MapViewResponse.MapViewItem item : items) {
            if (item.getChildren() != null) {
                for (String childAddr : item.getChildren()) {
                    if (childDetails.containsKey(childAddr)) continue;
                    try {
                        Path childFile = addressToPath(projectRoot, childAddr);
                        if (Files.exists(childFile)) {
                            WayPointData childWp = parser.parseWayPoint(childFile);
                            MapViewResponse.ChildDetail cd = new MapViewResponse.ChildDetail();
                            cd.setStatus(childWp.getStatus());
                            cd.setSummary(childWp.getSummary());
                            childDetails.put(childAddr, cd);
                        }
                    } catch (Exception e) {
                        log.warn("Failed to parse child WP: {}", childAddr, e);
                    }
                }
            }
        }
        response.setChildDetails(childDetails);

        return response;
    }

    public WayPointDetailResponse getWayPointDetail(String projectRoot, String address) throws IOException {
        Path file = addressToPath(projectRoot, address);
        if (!Files.exists(file)) throw new IOException("WayPoint not found: " + file);
        return parser.parseWayPointDetail(file);
    }

    public WayPointDetailResponse updateWayPoint(String projectRoot, WayPointDetailResponse data, boolean skipHistory) throws IOException {
        String address = data.getAddress();
        Path file = addressToPath(projectRoot, address);
        if (!Files.exists(file)) throw new IOException("WayPoint not found: " + file);

        // Read existing to preserve CONNECTIONS (which are not editable from UI)
        WayPointDetailResponse existing = parser.parseWayPointDetail(file);
        data.setParent(existing.getParent());
        data.setChildren(existing.getChildren());
        data.setReferences(existing.getReferences());
        if (data.getCreated() == null) data.setCreated(existing.getCreated());
        if (data.getTodoAddress() == null) data.setTodoAddress(existing.getTodoAddress());

        // Detect added/deleted TECH_SPEC items → log
        if (!skipHistory) {
            recordTechSpecChanges(projectRoot, address, existing.getTechSpec(), data.getTechSpec());
        }

        // Write updated md
        writer.writeWayPoint(file, data);

        // Log change via CLI
        cli.logModified(projectRoot, address, buildChangeSummary(existing, data));

        // Return fresh data
        return parser.parseWayPointDetail(file);
    }

    private void recordTechSpecChanges(String projectRoot, String address,
                                        List<WayPointDetailResponse.TechSpecItem> before,
                                        List<WayPointDetailResponse.TechSpecItem> after) {
        java.util.Set<String> beforeTexts = new java.util.HashSet<>();
        java.util.Set<String> afterTexts = new java.util.HashSet<>();
        if (before != null) {
            for (WayPointDetailResponse.TechSpecItem item : before) {
                beforeTexts.add(item.getText());
            }
        }
        if (after != null) {
            for (WayPointDetailResponse.TechSpecItem item : after) {
                afterTexts.add(item.getText());
            }
        }

        // Deleted items
        if (before != null) {
            for (WayPointDetailResponse.TechSpecItem item : before) {
                if (!afterTexts.contains(item.getText())) {
                    String status = item.isDone() ? "완료" : "미완료";
                    cli.logModified(projectRoot, address, "삭제:" + truncateLog(item.getText()) + " (" + status + ")");
                }
            }
        }

        // Added items
        if (after != null) {
            for (WayPointDetailResponse.TechSpecItem item : after) {
                if (!beforeTexts.contains(item.getText())) {
                    cli.logModified(projectRoot, address, "추가:" + truncateLog(item.getText()));
                }
            }
        }
    }

    private String truncateLog(String s) {
        if (s == null) return "";
        return s.length() > 100 ? s.substring(0, 100) + "..." : s;
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

    private boolean eq(String a, String b) {
        if (a == null && b == null) return true;
        if (a == null || b == null) return false;
        return a.equals(b);
    }

    // ===== Map structure management =====

    /**
     * Add a child to a Map's WAYPOINTS list.
     * @param position null=append, "before:ADDR"=insert before, "after:ADDR"=insert after
     */
    public MapViewResponse addToMap(String projectRoot, String mapAddress, String childAddress, String position, String summary) throws IOException {
        Path mapFile = addressToPath(projectRoot, mapAddress);
        if (!Files.exists(mapFile)) throw new IOException("Map not found: " + mapAddress);

        // If the child is a new WayPoint that doesn't exist, create skeleton
        Path childFile = addressToPath(projectRoot, childAddress);
        if (!Files.exists(childFile) && childAddress.startsWith("W://")) {
            writer.writeWayPointSkeleton(childFile, childAddress, mapAddress, summary);
        }

        MapData map = parser.parseMap(mapFile);
        if (!map.getWaypoints().contains(childAddress)) {
            if (position != null && position.contains(":")) {
                String[] parts = position.split(":", 2);
                String mode = parts[0];
                String refAddr = parts[1];
                int idx = map.getWaypoints().indexOf(refAddr);
                if (idx >= 0) {
                    int insertAt = "before".equals(mode) ? idx : idx + 1;
                    map.getWaypoints().add(insertAt, childAddress);
                } else {
                    map.getWaypoints().add(childAddress);
                }
            } else {
                map.getWaypoints().add(childAddress);
            }
            writer.writeMap(mapFile, map);
            cli.logModified(projectRoot, mapAddress, "WAYPOINTS에 " + childAddress + " 추가");
        }

        return getMapView(projectRoot, mapAddress);
    }

    /**
     * Add a child WayPoint to an existing WayPoint's CHILDREN.
     */
    public MapViewResponse addChildToWayPoint(String projectRoot, String parentWpAddress, String childId, String mapAddress, String summary) throws IOException {
        Path parentFile = addressToPath(projectRoot, parentWpAddress);
        if (!Files.exists(parentFile)) throw new IOException("WayPoint not found: " + parentWpAddress);

        String parentPath = parentWpAddress.substring(4); // strip W://
        String childAddress = "W://" + parentPath + "/" + childId;

        // Create child WP skeleton with parent = parentWpAddress
        Path childFile = addressToPath(projectRoot, childAddress);
        if (!Files.exists(childFile)) {
            writer.writeWayPointSkeleton(childFile, childAddress, parentWpAddress, summary);
        }

        // Update parent's CHILDREN list
        WayPointDetailResponse parentWp = parser.parseWayPointDetail(parentFile);
        List<String> children = parentWp.getChildren() != null ? new ArrayList<>(parentWp.getChildren()) : new ArrayList<>();
        if (!children.contains(childAddress)) {
            children.add(childAddress);
            parentWp.setChildren(children);
            writer.writeWayPoint(parentFile, parentWp);
            cli.logModified(projectRoot, parentWpAddress, "CHILDREN에 " + childAddress + " 추가");
        }

        return getMapView(projectRoot, mapAddress);
    }

    public MapViewResponse removeChildFromWayPoint(String projectRoot, String parentWpAddress, String childAddress, String mapAddress) throws IOException {
        Path parentFile = addressToPath(projectRoot, parentWpAddress);
        if (!Files.exists(parentFile)) throw new IOException("WayPoint not found: " + parentWpAddress);

        WayPointDetailResponse parentWp = parser.parseWayPointDetail(parentFile);
        List<String> children = parentWp.getChildren() != null ? new ArrayList<>(parentWp.getChildren()) : new ArrayList<>();
        if (children.remove(childAddress)) {
            parentWp.setChildren(children);
            writer.writeWayPoint(parentFile, parentWp);
            cli.logModified(projectRoot, parentWpAddress, "CHILDREN에서 " + childAddress + " 제거");
        }

        return getMapView(projectRoot, mapAddress);
    }

    public MapViewResponse removeFromMap(String projectRoot, String mapAddress, String childAddress) throws IOException {
        Path mapFile = addressToPath(projectRoot, mapAddress);
        if (!Files.exists(mapFile)) throw new IOException("Map not found: " + mapAddress);

        MapData map = parser.parseMap(mapFile);
        if (map.getWaypoints().remove(childAddress)) {
            writer.writeMap(mapFile, map);
            cli.logModified(projectRoot, mapAddress, "WAYPOINTS에서 " + childAddress + " 제거");
        }

        return getMapView(projectRoot, mapAddress);
    }

    public MapViewResponse createSubMap(String projectRoot, String parentMapAddress, String newId, String summary) throws IOException {
        Path parentFile = addressToPath(projectRoot, parentMapAddress);
        if (!Files.exists(parentFile)) throw new IOException("Parent map not found: " + parentMapAddress);

        // Build new map address: parent path + "/" + newId
        String parentPath = parentMapAddress.substring(4); // strip "M://"
        String newAddress = "M://" + parentPath + "/" + newId;

        Path newFile = addressToPath(projectRoot, newAddress);
        if (Files.exists(newFile)) throw new IOException("Map already exists: " + newAddress);

        // Create new map file
        MapData newMap = new MapData();
        newMap.setAddress(newAddress);
        newMap.setStatus("S_IDL");
        newMap.setSummary(summary != null ? summary : "");
        newMap.setWaypoints(new ArrayList<>());
        writer.writeMap(newFile, newMap);

        // Add to parent
        MapData parent = parser.parseMap(parentFile);
        parent.getWaypoints().add(newAddress);
        writer.writeMap(parentFile, parent);

        cli.logModified(projectRoot, parentMapAddress, "하위 Map " + newAddress + " 생성");

        return getMapView(projectRoot, parentMapAddress);
    }

    /**
     * Delete a Map only if its WAYPOINTS list is empty.
     * Also removes it from the parent map's WAYPOINTS.
     */
    public void deleteMap(String projectRoot, String mapAddress) throws IOException {
        Path mapFile = addressToPath(projectRoot, mapAddress);
        if (!Files.exists(mapFile)) throw new IOException("Map not found: " + mapAddress);

        MapData map = parser.parseMap(mapFile);
        if (map.getWaypoints() != null && !map.getWaypoints().isEmpty()) {
            throw new IOException("Map에 하위 항목이 존재합니다 (" + map.getWaypoints().size() + "개). 하위 항목을 먼저 제거하세요.");
        }

        // Find parent map by scanning all MAP files
        Path mapDir = getLoadstarRoot(projectRoot).resolve("MAP");
        if (Files.isDirectory(mapDir)) {
            for (var f : Files.list(mapDir).toList()) {
                if (f.equals(mapFile)) continue;
                MapData candidate = parser.parseMap(f);
                if (candidate.getWaypoints().remove(mapAddress)) {
                    writer.writeMap(f, candidate);
                    cli.logModified(projectRoot, candidate.getAddress(), "WAYPOINTS에서 " + mapAddress + " 제거");
                    break;
                }
            }
        }

        Files.delete(mapFile);
        cli.logModified(projectRoot, mapAddress, "Map 삭제");
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
            node.setType(address.startsWith("M://") ? "MAP" : "WAYPOINT");
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

            List<TreeNodeDto> children = new ArrayList<>();
            if (wp.getChildren() != null) {
                for (String childAddr : wp.getChildren()) {
                    children.add(buildTreeNode(projectRoot, childAddr));
                }
            }
            node.setChildren(children);
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
        private List<TreeNodeDto> children;
    }
}
