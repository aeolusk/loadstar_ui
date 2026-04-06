package com.loadstar.explorer.controller;

import com.loadstar.explorer.service.LogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/log")
@RequiredArgsConstructor
public class LogController {

    private final LogService logService;

    @GetMapping("/find")
    public ResponseEntity<LogService.LogResult> findLog(
            @RequestParam String root,
            @RequestParam(defaultValue = "0") int offset,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(required = false) String address,
            @RequestParam(required = false) String kind) {
        try {
            return ResponseEntity.ok(logService.findLog(root, offset, limit, address, kind));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
