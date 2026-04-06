package com.loadstar.explorer.controller;

import com.loadstar.explorer.model.*;
import com.loadstar.explorer.service.ElementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/elements")
@RequiredArgsConstructor
public class ElementController {

    private final ElementService elementService;

    @GetMapping("/tree")
    public ResponseEntity<List<ElementService.TreeNodeDto>> getTree() {
        try {
            return ResponseEntity.ok(elementService.getTree());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/map-view")
    public ResponseEntity<MapViewResponse> getMapView(@RequestParam String address) {
        try {
            return ResponseEntity.ok(elementService.getMapView(address));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/waypoint")
    public ResponseEntity<WayPointDetailResponse> getWayPoint(@RequestParam String address) {
        try {
            return ResponseEntity.ok(elementService.getWayPointDetail(address));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/blackbox")
    public ResponseEntity<BlackBoxDetailResponse> getBlackBox(@RequestParam String address) {
        try {
            return ResponseEntity.ok(elementService.getBlackBoxDetail(address));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
