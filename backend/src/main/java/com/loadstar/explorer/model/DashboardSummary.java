package com.loadstar.explorer.model;

import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
public class DashboardSummary {
    private int totalMaps;
    private int totalWaypoints;
    private Map<String, Integer> statusCounts;
    private List<MapGroupSummary> mapGroups;
    private List<BlockedItem> blockedItems;
    private int openQuestionCount;
    private List<DwpItem> dwpItems;

    @Data
    public static class MapGroupSummary {
        private String address;
        private String summary;
        private Map<String, Integer> statusCounts;
        private int totalWaypoints;
    }

    @Data
    public static class BlockedItem {
        private String address;
        private String summary;
    }

    @Data
    public static class DwpItem {
        private String address;
        private String summary;
        private String created;
        private String updated;
    }
}
