package com.loadstar.explorer.model;

import lombok.Data;
import java.util.List;

@Data
public class MapData {
    private String address;
    private String status;
    private String summary;
    private String goal;
    private List<String> waypoints;
}
