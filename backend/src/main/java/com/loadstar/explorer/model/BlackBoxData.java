package com.loadstar.explorer.model;

import lombok.Data;

@Data
public class BlackBoxData {
    private String address;
    private String status;
    private String syncedAt;
    private String summary;
    private String linkedWp;
}
