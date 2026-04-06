package com.loadstar.explorer.config;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.boot.web.servlet.error.ErrorController;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Serves index.html for SPA routes that don't match
 * /api/** or static assets (JS, CSS, images).
 */
@Controller
public class SpaForwardConfig implements ErrorController {

    private static final Path DIST_DIR = Paths.get("../frontend/dist");

    @GetMapping(value = "/error")
    public ResponseEntity<Resource> handleError(HttpServletRequest request) {
        // If it's an API request that 404'd, return proper JSON error
        String uri = (String) request.getAttribute("jakarta.servlet.error.request_uri");
        if (uri != null && uri.startsWith("/api/")) {
            return ResponseEntity.notFound().build();
        }

        // For SPA routes, serve index.html
        Resource index = new FileSystemResource(DIST_DIR.resolve("index.html"));
        if (index.exists()) {
            return ResponseEntity.ok().contentType(MediaType.TEXT_HTML).body(index);
        }
        return ResponseEntity.notFound().build();
    }
}
