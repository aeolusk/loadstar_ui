package com.loadstar.explorer.controller;

import com.loadstar.explorer.service.CliExecutor;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/cli")
@RequiredArgsConstructor
public class CliController {

    private final CliExecutor cliExecutor;

    @PostMapping("/execute")
    public ResponseEntity<Map<String, Object>> execute(@RequestBody CliRequest request) {
        try {
            String[] args = request.getArgs();
            String output = cliExecutor.execute(request.getRoot(), args);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "output", output,
                    "exitCode", 0
            ));
        } catch (RuntimeException e) {
            String msg = e.getMessage() != null ? e.getMessage() : "Command failed";
            return ResponseEntity.ok(Map.of(
                    "success", false,
                    "output", msg,
                    "exitCode", 1
            ));
        }
    }

    @Data
    public static class CliRequest {
        private String root;
        private String[] args;
    }
}
