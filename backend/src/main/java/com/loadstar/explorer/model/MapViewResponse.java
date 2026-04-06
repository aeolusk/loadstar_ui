package com.loadstar.explorer.model;

import lombok.Data;
import java.util.List;

@Data
public class MapViewResponse {
    private MapData map;
    private List<MapViewItem> items;

    @Data
    public static class MapViewItem {
        private String address;
        private String type;       // MAP, WAYPOINT
        private String status;
        private String summary;
        // WayPoint specific
        private String blackbox;   // B:// address or null
        private String blackboxStatus;
        private String blackboxSyncedAt;
        private List<String> children;
        private List<String> references;
    }
}
