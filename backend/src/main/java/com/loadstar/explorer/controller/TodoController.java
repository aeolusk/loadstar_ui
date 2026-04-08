package com.loadstar.explorer.controller;

import com.loadstar.explorer.service.TodoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/todo")
@RequiredArgsConstructor
public class TodoController {

    private final TodoService todoService;

    @GetMapping("/list")
    public ResponseEntity<List<TodoService.TodoItem>> list(@RequestParam String root) {
        try {
            return ResponseEntity.ok(todoService.list(root));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/sync")
    public ResponseEntity<TodoService.SyncResult> sync(
            @RequestParam String root,
            @RequestParam(required = false) String address) {
        try {
            return ResponseEntity.ok(todoService.sync(root, address));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/history")
    public ResponseEntity<List<TodoService.TodoHistoryItem>> history(
            @RequestParam String root,
            @RequestParam(required = false) String mapAddress) {
        try {
            return ResponseEntity.ok(todoService.history(root, mapAddress));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
