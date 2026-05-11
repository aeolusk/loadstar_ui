package com.loadstar.explorer.model;

import lombok.Data;

@Data
public class TodoItem {
    private boolean done;
    private boolean recurring;
    private String text;
}
