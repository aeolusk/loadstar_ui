package com.loadstar.explorer.controller;

import com.loadstar.explorer.model.DashboardSummary;
import com.loadstar.explorer.model.NoticeItem;
import com.loadstar.explorer.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/summary")
    public ResponseEntity<DashboardSummary> summary(@RequestParam String root) {
        try {
            return ResponseEntity.ok(dashboardService.getSummary(root));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/notices")
    public ResponseEntity<List<NoticeItem>> listNotices(
            @RequestParam String root,
            @RequestParam(required = false) String category) {
        try {
            return ResponseEntity.ok(dashboardService.listNotices(root, category));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/notices")
    public ResponseEntity<NoticeItem> createNotice(
            @RequestParam String root,
            @RequestBody NoticeItem notice) {
        try {
            return ResponseEntity.ok(dashboardService.createNotice(root, notice));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping("/notices/{id}")
    public ResponseEntity<NoticeItem> updateNotice(
            @RequestParam String root,
            @PathVariable String id,
            @RequestBody NoticeItem notice) {
        try {
            return ResponseEntity.ok(dashboardService.updateNotice(root, id, notice));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @DeleteMapping("/notices/{id}")
    public ResponseEntity<Void> deleteNotice(
            @RequestParam String root,
            @PathVariable String id) {
        try {
            dashboardService.deleteNotice(root, id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
