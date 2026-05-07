package com.loadstar.explorer.controller;

import com.loadstar.explorer.service.ScheduleService;
import com.loadstar.explorer.service.ScheduleService.ScheduleData;
import com.loadstar.explorer.service.ScheduleService.ScheduleResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/schedule")
@RequiredArgsConstructor
public class ScheduleController {

    private final ScheduleService scheduleService;

    @GetMapping
    public ResponseEntity<ScheduleResponse> load(@RequestParam String root) {
        try {
            return ResponseEntity.ok(scheduleService.load(root));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping
    public ResponseEntity<ScheduleResponse> save(
            @RequestParam String root,
            @RequestBody ScheduleData data) {
        try {
            return ResponseEntity.ok(scheduleService.save(root, data));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<ScheduleResponse> refreshStatus(@RequestParam String root) {
        try {
            return ResponseEntity.ok(scheduleService.refreshStatus(root));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
