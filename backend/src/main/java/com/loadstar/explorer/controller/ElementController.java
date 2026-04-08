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

    @PostMapping("/map/add")
    public ResponseEntity<MapViewResponse> addToMap(
            @RequestParam String root,
            @RequestParam String mapAddress,
            @RequestParam String childAddress,
            @RequestParam(required = false) String position,
            @RequestParam(required = false) String summary) {
        try {
            return ResponseEntity.ok(elementService.addToMap(root, mapAddress, childAddress, position, summary));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/waypoint/add-child")
    public ResponseEntity<MapViewResponse> addChildToWayPoint(
            @RequestParam String root,
            @RequestParam String parentWpAddress,
            @RequestParam String childId,
            @RequestParam String mapAddress,
            @RequestParam(required = false) String summary) {
        try {
            return ResponseEntity.ok(elementService.addChildToWayPoint(root, parentWpAddress, childId, mapAddress, summary));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @DeleteMapping("/waypoint/remove-child")
    public ResponseEntity<MapViewResponse> removeChildFromWayPoint(
            @RequestParam String root,
            @RequestParam String parentWpAddress,
            @RequestParam String childAddress,
            @RequestParam String mapAddress) {
        try {
            return ResponseEntity.ok(elementService.removeChildFromWayPoint(root, parentWpAddress, childAddress, mapAddress));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @DeleteMapping("/map/remove")
    public ResponseEntity<MapViewResponse> removeFromMap(
            @RequestParam String root,
            @RequestParam String mapAddress,
            @RequestParam String childAddress) {
        try {
            return ResponseEntity.ok(elementService.removeFromMap(root, mapAddress, childAddress));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @DeleteMapping("/map/delete")
    public ResponseEntity<Map<String, Object>> deleteMap(
            @RequestParam String root,
            @RequestParam String mapAddress) {
        try {
            elementService.deleteMap(root, mapAddress);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/map/create-child")
    public ResponseEntity<MapViewResponse> createSubMap(
            @RequestParam String root,
            @RequestParam String parentMapAddress,
            @RequestParam String id,
            @RequestParam(required = false) String summary) {
        try {
            return ResponseEntity.ok(elementService.createSubMap(root, parentMapAddress, id, summary));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping("/waypoint")
    public ResponseEntity<WayPointDetailResponse> updateWayPoint(
            @RequestParam String root,
            @RequestParam(defaultValue = "false") boolean skipHistory,
            @RequestBody WayPointDetailResponse data) {
        try {
            return ResponseEntity.ok(elementService.updateWayPoint(root, data, skipHistory));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

}
