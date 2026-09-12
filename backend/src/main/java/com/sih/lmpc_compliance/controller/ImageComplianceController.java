package com.sih.lmpc_compliance.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.sih.lmpc_compliance.service.OcrIntegrationService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/compliance")
@CrossOrigin
public class ImageComplianceController {

    private final OcrIntegrationService ocrIntegrationService;

    public ImageComplianceController(OcrIntegrationService ocrIntegrationService) {
        this.ocrIntegrationService = ocrIntegrationService;
    }

    @PostMapping("/analyze-image")
    public ResponseEntity<?> analyzeImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "manual_pack_width_cm", required = false) Float packWidth,
            @RequestParam(value = "manual_pack_height_cm", required = false) Float packHeight,
            @RequestParam(value = "is_molded", required = false) Boolean isMolded,
            @AuthenticationPrincipal UUID userId) {

        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "File is empty"));
            }
            
            if (userId == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
            }

            JsonNode result = ocrIntegrationService.analyzeImage(file, packWidth, packHeight, isMolded, userId);
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(result.toString());

        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("detail", "Analysis failed: " + e.getMessage()));
        }
    }

    @PostMapping("/analyze-ecommerce")
    public ResponseEntity<?> analyzeEcommerce(@RequestBody Map<String, String> payload, @AuthenticationPrincipal UUID userId) {
        try {
            if (userId == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
            JsonNode result = ocrIntegrationService.analyzeEcommerce(payload.get("url"), userId);
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(result.toString());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("detail", "Analysis failed: " + e.getMessage()));
        }
    }

    @PostMapping("/generate-report")
    public ResponseEntity<?> generateReport(
            @RequestParam("file") MultipartFile file,
            @RequestParam("format") String format,
            @RequestParam(value = "manual_pack_width_cm", required = false) Float packWidth,
            @RequestParam(value = "manual_pack_height_cm", required = false) Float packHeight,
            @RequestParam(value = "is_molded", required = false) Boolean isMolded,
            @AuthenticationPrincipal UUID userId) {
        try {
            if (userId == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
            byte[] report = ocrIntegrationService.generateReport(file, format, packWidth, packHeight, isMolded, userId);
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.setContentType(format.equals("pdf") ? org.springframework.http.MediaType.APPLICATION_PDF : org.springframework.http.MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.wordprocessingml.document"));
            headers.setContentDispositionFormData("attachment", "MetroGuard_Inspection_Report." + format);
            return new ResponseEntity<>(report, headers, org.springframework.http.HttpStatus.OK);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("detail", "Report generation failed: " + e.getMessage()));
        }
    }
}
