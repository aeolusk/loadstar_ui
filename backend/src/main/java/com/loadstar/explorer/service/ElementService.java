package com.loadstar.explorer.service;

import com.loadstar.explorer.model.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
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

    @Value("${loadstar.project-path:}")
    private String projectPath;

    private Path getLoadstarRoot() {
        String base = projectPath.isEmpty() ? System.getProperty("user.dir") : projectPath;
        return Paths.get(base, ".loadstar");
    }

    /**
     * Convert logical address to physical file path.
     * TYPE://seg1/seg2/.../id -> .loadstar/TYPE_DIR/seg1.seg2...id.md
     */
    private Path addressToPath(String address) {
        Path root = getLoadstarRoot();
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
     * Get MapViewResponse for a given Map address.
     * Returns the Map info + list of direct children (WayPoints/Maps)
     * with their BlackBox info and connections.
     */
    public MapViewResponse getMapView(String mapAddress) throws IOException {
        Path mapFile = addressToPath(mapAddress);
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
                    // Sub-Map
                    Path childFile = addressToPath(childAddr);
                    if (Files.exists(childFile)) {
                        MapData childMap = parser.parseMap(childFile);
                        item.setType("MAP");
                        item.setStatus(childMap.getStatus());
                        item.setSummary(childMap.getSummary());
                    }
                } else if (childAddr.startsWith("W://")) {
                    // WayPoint
                    Path wpFile = addressToPath(childAddr);
                    if (Files.exists(wpFile)) {
                        WayPointData wp = parser.parseWayPoint(wpFile);
                        item.setType("WAYPOINT");
                        item.setStatus(wp.getStatus());
                        item.setSummary(wp.getSummary());
                        item.setChildren(wp.getChildren());
                        item.setReferences(wp.getReferences());
                        item.setBlackbox(wp.getBlackbox());

                        // Load BlackBox status/syncedAt if exists
                        if (wp.getBlackbox() != null) {
                            Path bbFile = addressToPath(wp.getBlackbox());
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

    /**
     * Get element tree for the left panel.
     * Returns a simplified recursive structure.
     */
    public List<TreeNodeDto> getTree() throws IOException {
        Path rootMap = getLoadstarRoot().resolve("MAP").resolve("root.md");
        if (!Files.exists(rootMap)) {
            return List.of();
        }
        return List.of(buildTreeNode("M://root"));
    }

    private TreeNodeDto buildTreeNode(String address) throws IOException {
        TreeNodeDto node = new TreeNodeDto();
        node.setAddress(address);

        Path file = addressToPath(address);
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
                children.add(buildTreeNode(childAddr));
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
            // Add BlackBox as child in tree
            if (wp.getBlackbox() != null) {
                children.add(buildTreeNode(wp.getBlackbox()));
            }
            // Add WayPoint children
            if (wp.getChildren() != null) {
                for (String childAddr : wp.getChildren()) {
                    children.add(buildTreeNode(childAddr));
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
