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

    @PatchMapping("/map")
    public ResponseEntity<MapData> updateMap(
            @RequestParam String root,
            @RequestParam String address,
            @RequestParam(required = false) String summary,
            @RequestParam(required = false) String goal) {
        try {
            return ResponseEntity.ok(elementService.updateMap(root, address, summary, goal));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/references")
    public ResponseEntity<List<ElementService.ReferenceInfo>> getReferences(
            @RequestParam String root,
            @RequestParam String address) {
        try {
            return ResponseEntity.ok(elementService.findExternalReferences(root, address));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @DeleteMapping("/waypoint")
    public ResponseEntity<Map<String, Object>> deleteWayPoint(
            @RequestParam String root,
            @RequestParam String address) {
        try {
            elementService.deleteWayPoint(root, address);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @DeleteMapping("/map/cascade")
    public ResponseEntity<Map<String, Object>> deleteMapCascade(
            @RequestParam String root,
            @RequestParam String mapAddress,
            @RequestBody List<String> selectedChildren) {
        try {
            elementService.deleteMapWithCascade(root, mapAddress, selectedChildren);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @GetMapping("/addresses")
    public ResponseEntity<List<String>> getAllAddresses(@RequestParam String root) {
        try {
            return ResponseEntity.ok(elementService.getAllAddresses(root));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PatchMapping("/waypoint/parent")
    public ResponseEntity<Map<String, Object>> changeParent(
            @RequestParam String root,
            @RequestParam String address,
            @RequestParam(required = false) String newParent) {
        try {
            elementService.changeParent(root, address, newParent);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/waypoint/children")
    public ResponseEntity<Map<String, Object>> addChild(
            @RequestParam String root,
            @RequestParam String parentAddr,
            @RequestParam String childAddr) {
        try {
            elementService.addChild(root, parentAddr, childAddr);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @DeleteMapping("/waypoint/children")
    public ResponseEntity<Map<String, Object>> removeChild(
            @RequestParam String root,
            @RequestParam String parentAddr,
            @RequestParam String childAddr) {
        try {
            elementService.removeChild(root, parentAddr, childAddr);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
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

    @GetMapping("/dwp")
    public ResponseEntity<WayPointDetailResponse> getDwp(@RequestParam String root, @RequestParam String address) {
        try {
            return ResponseEntity.ok(elementService.getDwpDetail(root, address));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping("/dwp")
    public ResponseEntity<WayPointDetailResponse> updateDwp(
            @RequestParam String root,
            @RequestParam(defaultValue = "false") boolean skipHistory,
            @RequestBody WayPointDetailResponse data) {
        try {
            return ResponseEntity.ok(elementService.updateDwp(root, data, skipHistory));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

}
