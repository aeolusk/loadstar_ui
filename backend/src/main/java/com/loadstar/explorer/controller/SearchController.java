package com.loadstar.explorer.controller;

import com.loadstar.explorer.service.SearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/elements")
@RequiredArgsConstructor
public class SearchController {

    private final SearchService searchService;

    @GetMapping("/search")
    public ResponseEntity<List<SearchService.SearchResult>> search(
            @RequestParam String root,
            @RequestParam String query) {
        try {
            List<SearchService.SearchResult> results = searchService.search(root, query);
            return ResponseEntity.ok(results);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
