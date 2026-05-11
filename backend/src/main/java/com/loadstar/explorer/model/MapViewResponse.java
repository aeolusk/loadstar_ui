package com.loadstar.explorer.model;

import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
public class MapViewResponse {
    private MapData map;
    private List<MapViewItem> items;
    private Map<String, ChildDetail> childDetails;

    @Data
    public static class ChildDetail {
        private String status;
        private String summary;
    }

    @Data
    public static class MapViewItem {
        private String address;
        private String type;       // MAP, WAYPOINT
        private String status;
        private String summary;
        private String goal;
        // WayPoint specific
        private List<String> children;
        private List<String> references;
    }
}
