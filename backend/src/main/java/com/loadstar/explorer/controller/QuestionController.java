package com.loadstar.explorer.controller;

import com.loadstar.explorer.service.DecisionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.awt.Desktop;
import java.io.File;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/questions")
@RequiredArgsConstructor
public class QuestionController {

    private final DecisionService decisionService;

    @GetMapping
    public ResponseEntity<List<DecisionService.QuestionItem>> listQuestions(@RequestParam String root) {
        try {
            return ResponseEntity.ok(decisionService.listQuestions(root));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/decisions")
    public ResponseEntity<List<DecisionService.DecisionListItem>> listDecisions(@RequestParam String root) {
        try {
            return ResponseEntity.ok(decisionService.listDecisions(root));
        } catch (Exception e) {
            log.error("Failed to list decisions", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/decide")
    public ResponseEntity<Map<String, Object>> decide(
            @RequestParam String root,
            @RequestBody DecisionService.DecideRequest req) {
        try {
            DecisionService.DecideResult result = decisionService.decide(root, req);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "decisionId", result.getDecisionId(),
                    "filePath", result.getFilePath()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/defer")
    public ResponseEntity<Map<String, Object>> deferQuestion(
            @RequestParam String root,
            @RequestParam String wpAddress,
            @RequestParam String qid) {
        try {
            decisionService.deferQuestion(root, wpAddress, qid);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @DeleteMapping
    public ResponseEntity<Map<String, Object>> deleteQuestion(
            @RequestParam String root,
            @RequestParam String wpAddress,
            @RequestParam String qid) {
        try {
            decisionService.deleteQuestion(root, wpAddress, qid);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @GetMapping("/decision")
    public ResponseEntity<Map<String, Object>> readDecision(@RequestParam String path) {
        try {
            String[] content = decisionService.readDecisionContent(path);
            return ResponseEntity.ok(Map.of("success", true, "decision", content[0], "note", content[1]));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PutMapping("/decision")
    public ResponseEntity<Map<String, Object>> updateDecision(
            @RequestParam String path,
            @RequestBody Map<String, String> body) {
        try {
            decisionService.updateDecisionContent(path, body.get("decision"), body.get("note"));
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @GetMapping("/open-file")
    public ResponseEntity<Map<String, Object>> openFile(@RequestParam String path) {
        try {
            File file = new File(path);
            if (!file.exists()) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "error", "File not found: " + path));
            }
            if (!Desktop.isDesktopSupported()) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "error", "Desktop not supported"));
            }
            Desktop.getDesktop().open(file);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }
}
