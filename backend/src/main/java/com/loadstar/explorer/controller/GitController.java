package com.loadstar.explorer.controller;

import com.loadstar.explorer.model.GitCommitInfo;
import com.loadstar.explorer.service.GitService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/git")
@RequiredArgsConstructor
public class GitController {

    private final GitService gitService;

    @GetMapping("/history")
    public ResponseEntity<List<GitCommitInfo>> getHistory(
            @RequestParam String root,
            @RequestParam String address) {
        try {
            List<GitCommitInfo> history = gitService.getFileHistory(root, address);
            return ResponseEntity.ok(history);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
