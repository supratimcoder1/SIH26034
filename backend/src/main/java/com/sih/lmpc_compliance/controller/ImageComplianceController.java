package com.sih.lmpc_compliance.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sih.lmpc_compliance.dto.ComplianceResponse;
import com.sih.lmpc_compliance.dto.TextAnalysisRequest;
import com.sih.lmpc_compliance.entity.Product;
import com.sih.lmpc_compliance.repository.ProductRepository;
import com.sih.lmpc_compliance.service.ComplianceService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/compliance")
@CrossOrigin
public class ImageComplianceController {

    private final ComplianceService complianceService;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final ProductRepository productRepository;

    @Value("${ocr.service.url:http://127.0.0.1:8000}")
    private String ocrServiceUrl;

    public ImageComplianceController(ComplianceService complianceService, ProductRepository productRepository) {
        this.complianceService = complianceService;
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
        this.productRepository = productRepository;
    }

    @PostMapping("/analyze-images")
    public ResponseEntity<?> analyzeImages(
            @RequestParam("files") List<MultipartFile> files,
            @AuthenticationPrincipal UUID userId) {
        try {
            if (files == null || files.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "No files provided"));
            }
            if (userId == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
            }

            StringBuilder combinedText = new StringBuilder();

            for (MultipartFile file : files) {
                if (file.isEmpty()) continue;
                
                // 1. Call Python OCR Backend (In-Memory Processing)
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.MULTIPART_FORM_DATA);
                MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
                body.add("file", new ByteArrayResource(file.getBytes()) {
                    @Override
                    public String getFilename() {
                        return file.getOriginalFilename() != null ? file.getOriginalFilename() : "upload.png";
                    }
                });
                HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);
                ResponseEntity<String> response = restTemplate.postForEntity(ocrServiceUrl + "/extract-text", requestEntity, String.class);
                
                if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                    JsonNode jsonResponse = objectMapper.readTree(response.getBody());
                    combinedText.append(jsonResponse.path("extracted_text").asText()).append("\n\n");
                }
            }

            if (combinedText.length() == 0) {
                return ResponseEntity.internalServerError().body(Map.of("error", "OCR Service failed for all images"));
            }

            // 3. Ensure a dummy product exists for logging scans
            Product prod = productRepository.findFirstByOrderByIdAsc().orElse(null);
            if (prod == null) {
                prod = productRepository.save(Product.builder()
                        .name("General Packaged Commodity")
                        .imported(false)
                        .soldViaEcommerce(false)
                        .build());
            }

            // 4. Pass to Java Compliance Engine
            TextAnalysisRequest textRequest = new TextAnalysisRequest();
            textRequest.setProductId(prod.getId());
            textRequest.setExtractedText(combinedText.toString());

            ComplianceResponse complianceResponse = complianceService.analyzeText(textRequest, userId);

            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(complianceResponse);

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("detail", "Analysis failed: " + e.getMessage()));
        }
    }

    @PostMapping("/generate-report")
    public ResponseEntity<byte[]> generateReport(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "format", defaultValue = "pdf") String format,
            @AuthenticationPrincipal UUID userId) {
        try {
            // Generate a simple dummy PDF for now to satisfy the frontend download
            String pdfContent = "%PDF-1.4\n" +
                    "1 0 obj\n" +
                    "<< /Type /Catalog /Pages 2 0 R >>\n" +
                    "endobj\n" +
                    "2 0 obj\n" +
                    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>\n" +
                    "endobj\n" +
                    "3 0 obj\n" +
                    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\n" +
                    "endobj\n" +
                    "4 0 obj\n" +
                    "<< /Length 64 >>\n" +
                    "stream\n" +
                    "BT\n" +
                    "/F1 24 Tf\n" +
                    "100 700 Td\n" +
                    "(Compliance Report) Tj\n" +
                    "ET\n" +
                    "endstream\n" +
                    "endobj\n" +
                    "5 0 obj\n" +
                    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\n" +
                    "endobj\n" +
                    "xref\n" +
                    "0 6\n" +
                    "0000000000 65535 f \n" +
                    "0000000009 00000 n \n" +
                    "0000000058 00000 n \n" +
                    "0000000115 00000 n \n" +
                    "0000000228 00000 n \n" +
                    "0000000343 00000 n \n" +
                    "trailer\n" +
                    "<< /Size 6 /Root 1 0 R >>\n" +
                    "startxref\n" +
                    "431\n" +
                    "%%EOF";

            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_PDF)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"report.pdf\"")
                    .body(pdfContent.getBytes());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
