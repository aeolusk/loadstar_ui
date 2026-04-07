package com.loadstar.explorer.controller;

import com.loadstar.explorer.model.*;
import com.loadstar.explorer.service.ElementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/elements")
@RequiredArgsConstructor
public class ElementController {

    private final ElementService elementService;

    @GetMapping("/validate")
    public ResponseEntity<Map<String, Object>> validate(@RequestParam String root) {
        boolean valid = elementService.isValidProject(root);
        return ResponseEntity.ok(Map.of("valid", valid, "root", root));
    }

    @GetMapping("/tree")
    public ResponseEntity<List<ElementService.TreeNodeDto>> getTree(@RequestParam String root) {
        try {
            return ResponseEntity.ok(elementService.getTree(root));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/map-view")
    public ResponseEntity<MapViewResponse> getMapView(@RequestParam String root, @RequestParam String address) {
        try {
            return ResponseEntity.ok(elementService.getMapView(root, address));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/waypoint")
    public ResponseEntity<WayPointDetailResponse> getWayPoint(@RequestParam String root, @RequestParam String address) {
        try {
            return ResponseEntity.ok(elementService.getWayPointDetail(root, address));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/blackbox")
    public ResponseEntity<BlackBoxDetailResponse> getBlackBox(@RequestParam String root, @RequestParam String address) {
        try {
            return ResponseEntity.ok(elementService.getBlackBoxDetail(root, address));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping("/waypoint")
    public ResponseEntity<WayPointDetailResponse> updateWayPoint(@RequestParam String root, @RequestBody WayPointDetailResponse data) {
        try {
            return ResponseEntity.ok(elementService.updateWayPoint(root, data));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping("/blackbox")
    public ResponseEntity<BlackBoxDetailResponse> updateBlackBox(@RequestParam String root, @RequestBody BlackBoxDetailResponse data) {
        try {
            return ResponseEntity.ok(elementService.updateBlackBox(root, data));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
