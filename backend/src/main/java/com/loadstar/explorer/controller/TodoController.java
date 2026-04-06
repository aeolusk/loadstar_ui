package com.loadstar.explorer.controller;

import com.loadstar.explorer.service.TodoService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

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

    @GetMapping("/history")
    public ResponseEntity<List<TodoService.TodoHistoryItem>> history(
            @RequestParam String root,
            @RequestParam(required = false) String address) {
        try {
            return ResponseEntity.ok(todoService.history(root, address));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/add")
    public ResponseEntity<Map<String, String>> add(@RequestParam String root, @RequestBody TodoAddRequest req) {
        try {
            String result = todoService.add(root, req.getAddress(), req.getSummary(), req.getDependsOn());
            return ResponseEntity.ok(Map.of("result", result));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping("/update")
    public ResponseEntity<Map<String, String>> update(@RequestParam String root, @RequestBody TodoUpdateRequest req) {
        try {
            String result = todoService.update(root, req.getAddress(), req.getStatus());
            return ResponseEntity.ok(Map.of("result", result));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/done")
    public ResponseEntity<Map<String, String>> done(@RequestParam String root, @RequestBody TodoAddressRequest req) {
        try {
            String result = todoService.done(root, req.getAddress());
            return ResponseEntity.ok(Map.of("result", result));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @DeleteMapping("/delete")
    public ResponseEntity<Map<String, String>> delete(@RequestParam String root, @RequestBody TodoAddressRequest req) {
        try {
            String result = todoService.delete(root, req.getAddress());
            return ResponseEntity.ok(Map.of("result", result));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @Data
    public static class TodoAddRequest {
        private String address;
        private String summary;
        private String dependsOn;
    }

    @Data
    public static class TodoUpdateRequest {
        private String address;
        private String status;
    }

    @Data
    public static class TodoAddressRequest {
        private String address;
    }
}
