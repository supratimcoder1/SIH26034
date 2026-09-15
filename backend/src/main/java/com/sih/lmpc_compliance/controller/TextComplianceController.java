package com.sih.lmpc_compliance.controller;

import com.sih.lmpc_compliance.dto.ComplianceResponse;
import com.sih.lmpc_compliance.dto.TextAnalysisRequest;
import com.sih.lmpc_compliance.entity.Scan;
import com.sih.lmpc_compliance.entity.Violation;
import com.sih.lmpc_compliance.repository.ScanRepository;
import com.sih.lmpc_compliance.repository.ViolationRepository;
import com.sih.lmpc_compliance.service.ComplianceService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/compliance")
@CrossOrigin
public class TextComplianceController {

    private final ComplianceService complianceService;
    private final ScanRepository scanRepository;
    private final ViolationRepository violationRepository;

    public TextComplianceController(ComplianceService complianceService,
                                     ScanRepository scanRepository,
                                     ViolationRepository violationRepository) {
        this.complianceService = complianceService;
        this.scanRepository = scanRepository;
        this.violationRepository = violationRepository;
    }

    @PostMapping("/analyze-text")
    public ResponseEntity<?> analyzeText(@Valid @RequestBody TextAnalysisRequest request,
                                         @AuthenticationPrincipal UUID userId) {
        try {
            if (userId == null) return ResponseEntity.status(401).body(new ErrorResponse("Unauthorized"));
            ComplianceResponse complianceResponse = complianceService.analyzeText(request, userId);

            Scan scan = scanRepository.findById(complianceResponse.getScanId())
                    .orElseThrow(() -> new RuntimeException("Scan not found"));

            List<Violation> violations = violationRepository.findByScanId(scan.getId());

            return ResponseEntity.ok(new TextComplianceResponse(
                    scan.getId(),
                    request.getProductId(),
                    request.getExtractedText(),
                    complianceResponse,
                    violations
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(new ErrorResponse("Analysis failed: " + e.getMessage()));
        }
    }

    @GetMapping("/report/{scanId}")
    public ResponseEntity<?> getComplianceReport(@PathVariable UUID scanId) {
        try {
            Scan scan = scanRepository.findById(scanId)
                    .orElseThrow(() -> new RuntimeException("Scan not found"));

            List<Violation> violations = violationRepository.findByScanId(scanId);

            ComplianceResponse complianceResponse = new ComplianceResponse(
                    scan.getStatus().name(),
                    calculateComplianceScore(violations),
                    List.of(),
                    List.of(),
                    violations.stream().map(Violation::getDescription).toList()
            );

            return ResponseEntity.ok(new TextComplianceResponse(
                    scan.getId(),
                    scan.getProduct() != null ? scan.getProduct().getId() : null,
                    "Text analysis completed",
                    complianceResponse,
                    violations
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(new ErrorResponse("Report generation failed: " + e.getMessage()));
        }
    }

    private int calculateComplianceScore(List<Violation> violations) {
        if (violations.isEmpty()) return 100;
        int totalChecks = 7;
        int passedChecks = Math.max(0, totalChecks - violations.size());
        return (passedChecks * 100) / totalChecks;
    }

    public static class TextComplianceResponse {
        private UUID scanId;
        private UUID productId;
        private String extractedText;
        private ComplianceResponse compliance;
        private List<Violation> violations;

        public TextComplianceResponse(UUID scanId, UUID productId, String extractedText,
                                      ComplianceResponse compliance, List<Violation> violations) {
            this.scanId = scanId;
            this.productId = productId;
            this.extractedText = extractedText;
            this.compliance = compliance;
            this.violations = violations;
        }

        public UUID getScanId() {
            return scanId;
        }

        public UUID getProductId() {
            return productId;
        }

        public String getExtractedText() {
            return extractedText;
        }

        public ComplianceResponse getCompliance() {
            return compliance;
        }

        public List<Violation> getViolations() {
            return violations;
        }
    }

    public static class ErrorResponse {
        private String error;

        public ErrorResponse(String error) {
            this.error = error;
        }

        public String getError() {
            return error;
        }
    }
}
