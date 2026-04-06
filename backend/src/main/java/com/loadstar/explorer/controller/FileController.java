package com.loadstar.explorer.controller;

import lombok.Data;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/files")
public class FileController {

    /**
     * List directories under a given path for directory browser.
     * Returns only directories (not files).
     */
    @GetMapping("/browse")
    public ResponseEntity<BrowseResponse> browse(@RequestParam(defaultValue = "") String path) {
        BrowseResponse response = new BrowseResponse();

        if (path.isEmpty()) {
            // Return drive roots (Windows) or / (Unix)
            File[] roots = File.listRoots();
            List<DirEntry> entries = new ArrayList<>();
            for (File root : roots) {
                DirEntry entry = new DirEntry();
                entry.setName(root.getAbsolutePath());
                entry.setPath(root.getAbsolutePath());
                entry.setHasChildren(true);
                entries.add(entry);
            }
            response.setPath("");
            response.setParent(null);
            response.setEntries(entries);
            response.setHasLoadstar(false);
            return ResponseEntity.ok(response);
        }

        Path dirPath = Paths.get(path);
        if (!Files.isDirectory(dirPath)) {
            return ResponseEntity.badRequest().build();
        }

        // Check if .loadstar exists
        boolean hasLoadstar = Files.isDirectory(dirPath.resolve(".loadstar"))
                && Files.exists(dirPath.resolve(".loadstar").resolve("MAP").resolve("root.md"));

        // List subdirectories
        List<DirEntry> entries;
        try (var stream = Files.list(dirPath)) {
            entries = stream
                    .filter(Files::isDirectory)
                    .filter(p -> {
                        String name = p.getFileName().toString();
                        return !name.startsWith(".") && !name.equals("node_modules") && !name.equals("target") && !name.equals("build");
                    })
                    .sorted(Comparator.comparing(p -> p.getFileName().toString().toLowerCase()))
                    .map(p -> {
                        DirEntry entry = new DirEntry();
                        entry.setName(p.getFileName().toString());
                        entry.setPath(p.toAbsolutePath().toString());
                        try (var sub = Files.list(p)) {
                            entry.setHasChildren(sub.anyMatch(Files::isDirectory));
                        } catch (Exception e) {
                            entry.setHasChildren(false);
                        }
                        // Mark if this subdirectory has .loadstar
                        entry.setLoadstarProject(
                                Files.isDirectory(p.resolve(".loadstar"))
                                && Files.exists(p.resolve(".loadstar").resolve("MAP").resolve("root.md"))
                        );
                        return entry;
                    })
                    .collect(Collectors.toList());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }

        response.setPath(dirPath.toAbsolutePath().toString());
        Path parent = dirPath.getParent();
        response.setParent(parent != null ? parent.toAbsolutePath().toString() : null);
        response.setEntries(entries);
        response.setHasLoadstar(hasLoadstar);

        return ResponseEntity.ok(response);
    }

    @Data
    public static class BrowseResponse {
        private String path;
        private String parent;
        private boolean hasLoadstar;
        private List<DirEntry> entries;
    }

    @Data
    public static class DirEntry {
        private String name;
        private String path;
        private boolean hasChildren;
        private boolean loadstarProject;
    }
}
