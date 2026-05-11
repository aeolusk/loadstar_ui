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
import java.util.stream.Collectors;

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
        } else if (address.startsWith("D://")) {
            typeDir = "DATA_WAYPOINT";
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
                        item.setGoal(wp.getGoal());
                        item.setChildren(wp.getChildren());
                        item.setReferences(wp.getReferences());
                    }
                } else if (childAddr.startsWith("D://")) {
                    Path dwpFile = addressToPath(projectRoot, childAddr);
                    if (Files.exists(dwpFile)) {
                        WayPointDetailResponse dwp = parser.parseWayPointDetail(dwpFile);
                        item.setType("DWP");
                        item.setStatus(dwp.getStatus());
                        item.setSummary(dwp.getSummary());
                    }
                }
            } catch (Exception e) {
                log.warn("Failed to parse child element: {}", childAddr, e);
                item.setType(childAddr.startsWith("M://") ? "MAP" : childAddr.startsWith("D://") ? "DWP" : "WAYPOINT");
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

        // Write updated md
        writer.writeWayPoint(file, data);

        // Log changes via CLI (single call — item changes always tracked regardless of skipHistory)
        String itemChanges = buildTechSpecItemChanges(existing.getTechSpec(), data.getTechSpec());
        String otherChanges = buildChangeSummary(existing, data);
        String logMsg;
        if (!itemChanges.isEmpty()) {
            logMsg = itemChanges;
        } else {
            logMsg = otherChanges;
        }
        cli.logModified(projectRoot, address, logMsg);

        // Return fresh data
        return parser.parseWayPointDetail(file);
    }

    public WayPointDetailResponse getDwpDetail(String projectRoot, String address) throws IOException {
        Path file = addressToPath(projectRoot, address);
        if (!Files.exists(file)) throw new IOException("DWP not found: " + file);
        return parser.parseWayPointDetail(file);
    }

    public WayPointDetailResponse updateDwp(String projectRoot, WayPointDetailResponse data, boolean skipHistory) throws IOException {
        Path file = addressToPath(projectRoot, data.getAddress());
        if (!Files.exists(file)) throw new IOException("DWP not found: " + file);

        WayPointDetailResponse existing = parser.parseWayPointDetail(file);
        data.setParent(existing.getParent());
        data.setReferences(existing.getReferences());
        if (data.getCreated() == null) data.setCreated(existing.getCreated());

        writer.writeDwp(file, data);
        cli.logModified(projectRoot, data.getAddress(), buildChangeSummary(existing, data));
        return parser.parseWayPointDetail(file);
    }

    private String buildTechSpecItemChanges(
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

        List<String> parts = new ArrayList<>();

        if (before != null) {
            for (WayPointDetailResponse.TechSpecItem item : before) {
                if (!afterTexts.contains(item.getText())) {
                    String status = item.isDone() ? "완료" : "미완료";
                    parts.add("delete:" + truncateLog(item.getText()) + "(" + status + ")");
                }
            }
        }

        if (after != null) {
            for (WayPointDetailResponse.TechSpecItem item : after) {
                if (!beforeTexts.contains(item.getText())) {
                    parts.add("add:" + truncateLog(item.getText()));
                }
            }
        }

        return String.join(", ", parts);
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
    public MapViewResponse addToMap(String projectRoot, String mapAddress, String childAddress, String position, String summary, String goal) throws IOException {
        Path mapFile = addressToPath(projectRoot, mapAddress);
        if (!Files.exists(mapFile)) throw new IOException("Map not found: " + mapAddress);

        // If the child is a new WayPoint that doesn't exist, create skeleton
        Path childFile = addressToPath(projectRoot, childAddress);
        if (!Files.exists(childFile) && childAddress.startsWith("W://")) {
            writer.writeWayPointSkeleton(childFile, childAddress, mapAddress, summary, goal);
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
            writer.writeWayPointSkeleton(childFile, childAddress, parentWpAddress, summary, null);
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

    public MapData updateMap(String projectRoot, String mapAddress, String summary, String goal, List<String> waypoints) throws IOException {
        Path mapFile = addressToPath(projectRoot, mapAddress);
        if (!Files.exists(mapFile)) throw new IOException("Map not found: " + mapAddress);

        MapData map = parser.parseMap(mapFile);
        if (summary != null) map.setSummary(summary);
        map.setGoal((goal == null || goal.isBlank()) ? null : goal.strip());
        if (waypoints != null && !waypoints.isEmpty()) map.setWaypoints(waypoints);
        writer.writeMap(mapFile, map);
        cli.logModified(projectRoot, mapAddress, "맵 정보 수정");
        return map;
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

    public MapViewResponse createSubMap(String projectRoot, String parentMapAddress, String newId, String summary, String goal) throws IOException {
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
        newMap.setGoal((goal == null || goal.isBlank()) ? null : goal.strip());
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
            node.setGoal(map.getGoal());

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
            node.setGoal(wp.getGoal());
            node.setReferences(wp.getReferences());
            node.setTodos(wp.getTodos());

            List<TreeNodeDto> children = new ArrayList<>();
            if (wp.getChildren() != null) {
                for (String childAddr : wp.getChildren()) {
                    children.add(buildTreeNode(projectRoot, childAddr));
                }
            }
            node.setChildren(children);
        } else if (address.startsWith("D://")) {
            WayPointDetailResponse dwp = parser.parseWayPointDetail(file);
            node.setType("DWP");
            node.setStatus(dwp.getStatus());
            node.setSummary(dwp.getSummary());
            node.setChildren(List.of());
        }

        return node;
    }

    // ===== Orphan / Delete =====

    @lombok.Data
    @lombok.AllArgsConstructor
    public static class ReferenceInfo {
        private String address;
        private String type;
        private String summary;
    }

    /**
     * Find WayPoints that have {@code address} in their REFERENCE field.
     * Does not include PARENT/CHILDREN relations — those are tree structure, not external deps.
     */
    public List<ReferenceInfo> findExternalReferences(String projectRoot, String address) throws IOException {
        List<ReferenceInfo> result = new ArrayList<>();
        Path wpDir = getLoadstarRoot(projectRoot).resolve("WAYPOINT");
        if (!Files.isDirectory(wpDir)) return result;

        for (Path f : Files.list(wpDir).toList()) {
            try {
                WayPointData wp = parser.parseWayPoint(f);
                if (wp.getReferences() != null && wp.getReferences().contains(address)
                        && !address.equals(wp.getAddress())) {
                    result.add(new ReferenceInfo(wp.getAddress(), "WAYPOINT", wp.getSummary()));
                }
            } catch (Exception ignored) {}
        }
        return result;
    }

    /**
     * Delete a WayPoint. Blocks if any other WP has this address in its REFERENCE field.
     * Automatically removes from parent MAP's WAYPOINTS or parent WP's CHILDREN.
     */
    public void deleteWayPoint(String projectRoot, String address) throws IOException {
        Path file = addressToPath(projectRoot, address);
        if (!Files.exists(file)) throw new IOException("WayPoint not found: " + address);

        List<ReferenceInfo> refs = findExternalReferences(projectRoot, address);
        if (!refs.isEmpty()) {
            String refList = refs.stream().map(ReferenceInfo::getAddress).collect(Collectors.joining(", "));
            throw new IOException(refs.size() + "개 요소가 이 WP를 참조 중입니다: " + refList);
        }

        WayPointData wp = parser.parseWayPoint(file);
        String parentAddr = wp.getParent();

        if (parentAddr != null && !parentAddr.isEmpty()) {
            Path parentFile = addressToPath(projectRoot, parentAddr);
            if (Files.exists(parentFile)) {
                if (parentAddr.startsWith("M://")) {
                    MapData parentMap = parser.parseMap(parentFile);
                    if (parentMap.getWaypoints().remove(address)) {
                        writer.writeMap(parentFile, parentMap);
                        cli.logModified(projectRoot, parentAddr, "WAYPOINTS에서 " + address + " 제거 (삭제)");
                    }
                } else if (parentAddr.startsWith("W://")) {
                    WayPointDetailResponse parentWp = parser.parseWayPointDetail(parentFile);
                    List<String> children = new ArrayList<>(parentWp.getChildren() != null ? parentWp.getChildren() : List.of());
                    if (children.remove(address)) {
                        parentWp.setChildren(children);
                        writer.writeWayPoint(parentFile, parentWp);
                        cli.logModified(projectRoot, parentAddr, "CHILDREN에서 " + address + " 제거 (삭제)");
                    }
                }
            }
        }

        Files.delete(file);
        cli.logModified(projectRoot, address, "WayPoint 삭제");
    }

    /**
     * Delete a MAP with user-selected cascade children.
     * - {@code selectedChildren}: addresses the user chose to delete alongside the map.
     * - Remaining children (not selected) block deletion.
     */
    public void deleteMapWithCascade(String projectRoot, String mapAddress, List<String> selectedChildren) throws IOException {
        Path mapFile = addressToPath(projectRoot, mapAddress);
        if (!Files.exists(mapFile)) throw new IOException("Map not found: " + mapAddress);

        MapData map = parser.parseMap(mapFile);
        List<String> remaining = new ArrayList<>(map.getWaypoints() != null ? map.getWaypoints() : List.of());

        for (String childAddr : selectedChildren) {
            Path childFile = addressToPath(projectRoot, childAddr);
            if (Files.exists(childFile)) {
                Files.delete(childFile);
                cli.logModified(projectRoot, childAddr, "삭제 (MAP " + mapAddress + " cascade)");
            }
            remaining.remove(childAddr);
        }

        if (!remaining.isEmpty()) {
            throw new IOException("선택되지 않은 하위 항목이 남아있습니다: " + String.join(", ", remaining));
        }

        // Delegate to existing deleteMap (now safe — WAYPOINTS is empty after cascade)
        map.setWaypoints(new ArrayList<>());
        writer.writeMap(mapFile, map);
        deleteMap(projectRoot, mapAddress);
    }

    @lombok.Data
    public static class TreeNodeDto {
        private String address;
        private String type;
        private String status;
        private String summary;
        private String goal;
        private List<String> references;
        private List<TreeNodeDto> children;
        private List<com.loadstar.explorer.model.TodoItem> todos;
    }

    // ===== Connections editing =====

    /**
     * Returns a flat list of all MAP and WayPoint addresses in the project.
     * Used as the data source for address comboboxes in the UI.
     */
    public List<String> getAllAddresses(String projectRoot) throws IOException {
        List<String> result = new ArrayList<>();
        Path loadstarRoot = getLoadstarRoot(projectRoot);

        Path mapDir = loadstarRoot.resolve("MAP");
        if (Files.isDirectory(mapDir)) {
            for (Path f : Files.list(mapDir).sorted().toList()) {
                String name = f.getFileName().toString();
                if (!name.endsWith(".md")) continue;
                String pathPart = name.substring(0, name.length() - 3).replace(".", "/");
                result.add("M://" + pathPart);
            }
        }

        Path wpDir = loadstarRoot.resolve("WAYPOINT");
        if (Files.isDirectory(wpDir)) {
            for (Path f : Files.list(wpDir).sorted().toList()) {
                String name = f.getFileName().toString();
                if (!name.endsWith(".md")) continue;
                String pathPart = name.substring(0, name.length() - 3).replace(".", "/");
                result.add("W://" + pathPart);
            }
        }

        return result;
    }

    /**
     * Change the PARENT field of a WayPoint.
     * - Removes the WP from the old parent's CHILDREN (if old parent is a WP) or WAYPOINTS (if MAP).
     * - Adds the WP to the new parent's CHILDREN (if WP) or WAYPOINTS (if MAP).
     * - Setting newParent to null or empty string clears PARENT.
     */
    public void changeParent(String projectRoot, String address, String newParent) throws IOException {
        Path file = addressToPath(projectRoot, address);
        if (!Files.exists(file)) throw new IOException("WayPoint not found: " + address);

        WayPointDetailResponse wp = parser.parseWayPointDetail(file);
        String oldParent = wp.getParent();

        // Remove from old parent
        if (oldParent != null && !oldParent.isEmpty()) {
            Path oldParentFile = addressToPath(projectRoot, oldParent);
            if (Files.exists(oldParentFile)) {
                if (oldParent.startsWith("M://")) {
                    MapData parentMap = parser.parseMap(oldParentFile);
                    if (parentMap.getWaypoints().remove(address)) {
                        writer.writeMap(oldParentFile, parentMap);
                        cli.logModified(projectRoot, oldParent, "WAYPOINTS에서 " + address + " 제거 (PARENT 변경)");
                    }
                } else if (oldParent.startsWith("W://")) {
                    WayPointDetailResponse parentWp = parser.parseWayPointDetail(oldParentFile);
                    List<String> children = new ArrayList<>(parentWp.getChildren() != null ? parentWp.getChildren() : List.of());
                    if (children.remove(address)) {
                        parentWp.setChildren(children);
                        writer.writeWayPoint(oldParentFile, parentWp);
                        cli.logModified(projectRoot, oldParent, "CHILDREN에서 " + address + " 제거 (PARENT 변경)");
                    }
                }
            }
        }

        // Add to new parent
        if (newParent != null && !newParent.isEmpty()) {
            Path newParentFile = addressToPath(projectRoot, newParent);
            if (Files.exists(newParentFile)) {
                if (newParent.startsWith("M://")) {
                    MapData parentMap = parser.parseMap(newParentFile);
                    if (!parentMap.getWaypoints().contains(address)) {
                        parentMap.getWaypoints().add(address);
                        writer.writeMap(newParentFile, parentMap);
                        cli.logModified(projectRoot, newParent, "WAYPOINTS에 " + address + " 추가 (PARENT 변경)");
                    }
                } else if (newParent.startsWith("W://")) {
                    WayPointDetailResponse parentWp = parser.parseWayPointDetail(newParentFile);
                    List<String> children = new ArrayList<>(parentWp.getChildren() != null ? parentWp.getChildren() : new ArrayList<>());
                    if (!children.contains(address)) {
                        children.add(address);
                        parentWp.setChildren(children);
                        writer.writeWayPoint(newParentFile, parentWp);
                        cli.logModified(projectRoot, newParent, "CHILDREN에 " + address + " 추가 (PARENT 변경)");
                    }
                }
            }
        }

        // Update the WP's own PARENT field
        wp.setParent(newParent != null && !newParent.isEmpty() ? newParent : null);
        writer.writeWayPoint(file, wp);
        cli.logModified(projectRoot, address, "PARENT 변경: " + oldParent + " → " + newParent);
    }

    /**
     * Add childAddr to the CHILDREN list of parentAddr.
     */
    public void addChild(String projectRoot, String parentAddr, String childAddr) throws IOException {
        Path parentFile = addressToPath(projectRoot, parentAddr);
        if (!Files.exists(parentFile)) throw new IOException("WayPoint not found: " + parentAddr);
        if (!childAddr.startsWith("W://")) throw new IllegalArgumentException("Child must be a WayPoint (W://)");

        WayPointDetailResponse parent = parser.parseWayPointDetail(parentFile);
        List<String> children = new ArrayList<>(parent.getChildren() != null ? parent.getChildren() : List.of());
        if (children.contains(childAddr)) return;

        Path childFile = addressToPath(projectRoot, childAddr);
        if (!Files.exists(childFile)) throw new IOException("Child WayPoint not found: " + childAddr);

        children.add(childAddr);
        parent.setChildren(children);
        writer.writeWayPoint(parentFile, parent);
        cli.logModified(projectRoot, parentAddr, "CHILDREN에 " + childAddr + " 추가");

        // Update child's PARENT if not set
        WayPointDetailResponse child = parser.parseWayPointDetail(childFile);
        if (child.getParent() == null || child.getParent().isEmpty()) {
            child.setParent(parentAddr);
            writer.writeWayPoint(childFile, child);
            cli.logModified(projectRoot, childAddr, "PARENT 설정: " + parentAddr);
        }
    }

    /**
     * Remove childAddr from the CHILDREN list of parentAddr.
     */
    public void removeChild(String projectRoot, String parentAddr, String childAddr) throws IOException {
        Path parentFile = addressToPath(projectRoot, parentAddr);
        if (!Files.exists(parentFile)) throw new IOException("WayPoint not found: " + parentAddr);

        WayPointDetailResponse parent = parser.parseWayPointDetail(parentFile);
        List<String> children = new ArrayList<>(parent.getChildren() != null ? parent.getChildren() : List.of());
        if (children.remove(childAddr)) {
            parent.setChildren(children);
            writer.writeWayPoint(parentFile, parent);
            cli.logModified(projectRoot, parentAddr, "CHILDREN에서 " + childAddr + " 제거");
        }
    }
}
