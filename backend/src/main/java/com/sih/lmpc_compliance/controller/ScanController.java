package com.sih.lmpc_compliance.controller;

import com.sih.lmpc_compliance.dto.ComplianceResponse;
import com.sih.lmpc_compliance.dto.ScanRequest;
import com.sih.lmpc_compliance.entity.Scan;
import com.sih.lmpc_compliance.entity.User;
import com.sih.lmpc_compliance.entity.Violation;
import com.sih.lmpc_compliance.repository.ScanRepository;
import com.sih.lmpc_compliance.repository.UserRepository;
import com.sih.lmpc_compliance.repository.ViolationRepository;
import com.sih.lmpc_compliance.service.ComplianceService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/scans")
public class ScanController {
    private final ComplianceService complianceService;
    private final ScanRepository scanRepository;
    private final ViolationRepository violationRepository;
    private final UserRepository userRepository;

    public ScanController(
            ComplianceService complianceService,
            ScanRepository scanRepository,
            ViolationRepository violationRepository,
            UserRepository userRepository
    ) {
        this.complianceService = complianceService;
        this.scanRepository = scanRepository;
        this.violationRepository = violationRepository;
        this.userRepository = userRepository;
    }

    @PostMapping("/analyze")
    public ComplianceResponse analyze(@RequestBody ScanRequest request, @AuthenticationPrincipal UUID userId) {
        return complianceService.analyze(request, userId);
    }

    @GetMapping
    public ResponseEntity<?> getAllScans(@AuthenticationPrincipal UUID userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return ResponseEntity.status(401).build();

        if (user.getRole() == User.UserRole.viewer) {
            return ResponseEntity.ok(scanRepository.findByUploadedById(userId));
        } else {
            return ResponseEntity.ok(scanRepository.findAll());
        }
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<?> getScan(@PathVariable UUID id, @AuthenticationPrincipal UUID userId) {
        Scan scan = scanRepository.findById(id).orElse(null);
        if (scan == null) return ResponseEntity.notFound().build();
        User user = userRepository.findById(userId).orElse(null);
        if (user != null && user.getRole() == User.UserRole.viewer && !scan.getUploadedBy().getId().equals(userId)) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(scan);
    }

    @GetMapping("/product/{productId}")
    public ResponseEntity<?> getScansByProduct(@PathVariable UUID productId, @AuthenticationPrincipal UUID userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user != null && user.getRole() == User.UserRole.viewer) {
            return ResponseEntity.ok(scanRepository.findByProductIdAndUploadedById(productId, userId));
        }
        return ResponseEntity.ok(scanRepository.findByProductId(productId));
    }

    @GetMapping("/{scanId}/violations")
    public ResponseEntity<?> getViolations(@PathVariable UUID scanId, @AuthenticationPrincipal UUID userId) {
        Scan scan = scanRepository.findById(scanId).orElse(null);
        if (scan == null) return ResponseEntity.notFound().build();
        User user = userRepository.findById(userId).orElse(null);
        if (user != null && user.getRole() == User.UserRole.viewer && !scan.getUploadedBy().getId().equals(userId)) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(violationRepository.findByScanId(scanId));
    }
    
    @PutMapping("/{id}/review")
    @PreAuthorize("hasRole('ENFORCEMENT_OFFICER')")
    public ResponseEntity<?> reviewScan(@PathVariable UUID id, @RequestParam String status) {
        Scan scan = scanRepository.findById(id).orElse(null);
        if (scan == null) return ResponseEntity.notFound().build();
        
        scan.setReviewStatus(status);
        scanRepository.save(scan);
        return ResponseEntity.ok(scan);
    }

    @GetMapping("/{id}/image")
    public ResponseEntity<byte[]> getScanImage(@PathVariable UUID id, @AuthenticationPrincipal UUID userId) {
        Scan scan = scanRepository.findById(id).orElse(null);
        if (scan == null) return ResponseEntity.notFound().build();
        User user = userRepository.findById(userId).orElse(null);
        if (user != null && user.getRole() == User.UserRole.viewer && !scan.getUploadedBy().getId().equals(userId)) {
            return ResponseEntity.status(403).build();
        }
        try {
            java.nio.file.Path path = java.nio.file.Paths.get(scan.getImagePath());
            byte[] imageBytes = java.nio.file.Files.readAllBytes(path);
            String extension = scan.getImagePath().substring(scan.getImagePath().lastIndexOf(".") + 1).toLowerCase();
            org.springframework.http.MediaType mediaType = org.springframework.http.MediaType.IMAGE_JPEG;
            if (extension.equals("png")) mediaType = org.springframework.http.MediaType.IMAGE_PNG;
            else if (extension.equals("webp")) mediaType = org.springframework.http.MediaType.parseMediaType("image/webp");
            return ResponseEntity.ok().contentType(mediaType).body(imageBytes);
        } catch (java.io.IOException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
