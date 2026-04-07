package com.loadstar.explorer.controller;

import com.loadstar.explorer.model.BlackBoxDetailResponse;
import com.loadstar.explorer.model.GitCommitInfo;
import com.loadstar.explorer.model.WayPointDetailResponse;
import com.loadstar.explorer.service.ElementParser;
import com.loadstar.explorer.service.GitService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

@RestController
@RequestMapping("/api/git")
@RequiredArgsConstructor
public class GitController {

    private final GitService gitService;
    private final ElementParser parser;

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

    @GetMapping("/show")
    public ResponseEntity<WayPointDetailResponse> showAtCommit(
            @RequestParam String root,
            @RequestParam String address,
            @RequestParam String hash) {
        try {
            String content = gitService.getFileAtCommit(root, address, hash);
            // Write to temp file for parser
            Path tempFile = Files.createTempFile("loadstar-git-", ".md");
            try {
                Files.write(tempFile, content.getBytes(StandardCharsets.UTF_8));
                WayPointDetailResponse detail = parser.parseWayPointDetail(tempFile);
                return ResponseEntity.ok(detail);
            } finally {
                Files.deleteIfExists(tempFile);
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/show-blackbox")
    public ResponseEntity<BlackBoxDetailResponse> showBlackBoxAtCommit(
            @RequestParam String root,
            @RequestParam String address,
            @RequestParam String hash) {
        try {
            String content = gitService.getFileAtCommit(root, address, hash);
            Path tempFile = Files.createTempFile("loadstar-git-bb-", ".md");
            try {
                Files.write(tempFile, content.getBytes(StandardCharsets.UTF_8));
                BlackBoxDetailResponse detail = parser.parseBlackBoxDetail(tempFile);
                return ResponseEntity.ok(detail);
            } finally {
                Files.deleteIfExists(tempFile);
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
