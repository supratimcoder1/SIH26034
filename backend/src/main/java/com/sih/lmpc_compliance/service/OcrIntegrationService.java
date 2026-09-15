package com.sih.lmpc_compliance.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.sih.lmpc_compliance.entity.Scan;
import com.sih.lmpc_compliance.entity.ScanStatus;
import com.sih.lmpc_compliance.entity.Violation;
import com.sih.lmpc_compliance.entity.ViolationSeverity;
import com.sih.lmpc_compliance.repository.ScanRepository;
import com.sih.lmpc_compliance.repository.ViolationRepository;
import com.sih.lmpc_compliance.entity.Product;
import com.sih.lmpc_compliance.repository.ProductRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@Service
public class OcrIntegrationService {

    private final RestTemplate restTemplate;
    private final ScanRepository scanRepository;
    private final ViolationRepository violationRepository;
    private final FileStorageService fileStorageService;
    private final ObjectMapper objectMapper;
    private final ProductRepository productRepository;
    private final JdbcTemplate jdbcTemplate;

    @Value("${ocr.service.url:http://127.0.0.1:8000}")
    private String ocrServiceUrl;

    public OcrIntegrationService(
            ScanRepository scanRepository,
            ViolationRepository violationRepository,
            FileStorageService fileStorageService,
            ProductRepository productRepository,
            JdbcTemplate jdbcTemplate) {
        this.restTemplate = new RestTemplate();
        this.scanRepository = scanRepository;
        this.violationRepository = violationRepository;
        this.fileStorageService = fileStorageService;
        this.objectMapper = new ObjectMapper();
        this.productRepository = productRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    private ViolationSeverity parseSeverity(String raw) {
        if (raw == null) return ViolationSeverity.minor;
        String clean = raw.trim().toLowerCase();
        return switch (clean) {
            case "critical" -> ViolationSeverity.critical;
            case "major" -> ViolationSeverity.major;
            default -> ViolationSeverity.minor;
        };
    }

    public JsonNode analyzeImage(MultipartFile file, Float packWidth, Float packHeight, Boolean isMolded, UUID userId) throws Exception {
        try {
            jdbcTemplate.execute("ALTER TABLE scans ADD COLUMN IF NOT EXISTS raw_json jsonb");
        } catch (Exception e) {}

        String savedPath = fileStorageService.saveFile(file);

        Product prod = null;
        try {
            prod = productRepository.findFirstByOrderByIdAsc().orElse(null);
            if (prod == null) {
                Product p = Product.builder()
                        .name("General Packaged Commodity")
                        .imported(false)
                        .soldViaEcommerce(false)
                        .build();
                prod = productRepository.save(p);
            }
        } catch (Exception e) {
            // Log properly in real system, proceeding with null product is handled by DB if nullable
        }

        Scan scan = Scan.builder()
                .product(prod)
                .uploadedBy(com.sih.lmpc_compliance.entity.User.builder().id(userId).build())
                .imagePath(savedPath)
                .status(ScanStatus.processing)
                .build();
        scan = scanRepository.save(scan);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", new ByteArrayResource(file.getBytes()) {
            @Override
            public String getFilename() {
                return file.getOriginalFilename() != null ? file.getOriginalFilename() : "upload.png";
            }
        });
        if (packWidth != null) body.add("manual_pack_width_cm", packWidth);
        if (packHeight != null) body.add("manual_pack_height_cm", packHeight);
        if (isMolded != null) body.add("is_molded", isMolded);

        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

        ResponseEntity<String> response = restTemplate.postForEntity(ocrServiceUrl + "/analyze/image", requestEntity, String.class);

        if (!response.getStatusCode().is2xxSuccessful()) {
            scan.setStatus(ScanStatus.failed);
            scanRepository.save(scan);
            throw new RuntimeException("OCR Service failed: " + response.getBody());
        }

        JsonNode jsonResponse = objectMapper.readTree(response.getBody());

        scan.setStatus(ScanStatus.completed);
        try {
            java.util.Map<String, Object> map = objectMapper.convertValue(jsonResponse, new com.fasterxml.jackson.core.type.TypeReference<java.util.Map<String, Object>>() {});
            scan.setRawJson(map);
        } catch (Exception e) {}
        scanRepository.save(scan);

        JsonNode violationsNode = jsonResponse.path("violations");
        if (violationsNode.isArray()) {
            for (JsonNode vNode : violationsNode) {
                Violation violation = Violation.builder()
                        .scan(scan)
                        .ruleRef(vNode.path("rule_ref").asText("Unknown"))
                        .severity(parseSeverity(vNode.path("severity").asText("minor")))
                        .description(vNode.path("description").asText("No description"))
                        .build();
                violationRepository.save(violation);
            }
        }

        if (jsonResponse instanceof ObjectNode) {
            ((ObjectNode) jsonResponse).put("id", scan.getId().toString());
        }

        return jsonResponse;
    }

    public JsonNode analyzeEcommerce(String url, UUID userId) throws Exception {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        String requestJson = "{\"url\":\"" + url + "\"}";
        HttpEntity<String> requestEntity = new HttpEntity<>(requestJson, headers);

        ResponseEntity<String> response = restTemplate.postForEntity(ocrServiceUrl + "/analyze/ecommerce", requestEntity, String.class);

        if (!response.getStatusCode().is2xxSuccessful()) {
            throw new RuntimeException("OCR Service failed: " + response.getBody());
        }
        return objectMapper.readTree(response.getBody());
    }

    public byte[] generateReport(MultipartFile file, String format, Float packWidth, Float packHeight, Boolean isMolded, UUID userId) throws Exception {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", new ByteArrayResource(file.getBytes()) {
            @Override
            public String getFilename() {
                return file.getOriginalFilename() != null ? file.getOriginalFilename() : "upload.png";
            }
        });
        body.add("format", format);
        if (packWidth != null) body.add("manual_pack_width_cm", packWidth);
        if (packHeight != null) body.add("manual_pack_height_cm", packHeight);
        if (isMolded != null) body.add("is_molded", isMolded);

        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

        ResponseEntity<byte[]> response = restTemplate.postForEntity(ocrServiceUrl + "/generate-report", requestEntity, byte[].class);

        if (!response.getStatusCode().is2xxSuccessful()) {
            throw new RuntimeException("Report generation failed");
        }
        return response.getBody();
    }
}
