package com.loadstar.explorer.model;

import lombok.Data;
import java.util.List;

@Data
public class WayPointData {
    private String address;
    private String status;
    private String summary;
    private String syncedAt;
    private String parent;
    private List<String> children;
    private List<String> references;
}
