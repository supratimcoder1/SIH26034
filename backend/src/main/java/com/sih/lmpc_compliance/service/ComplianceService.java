package com.sih.lmpc_compliance.service;

import com.sih.lmpc_compliance.dto.ComplianceResponse;
import com.sih.lmpc_compliance.dto.ScanRequest;
import com.sih.lmpc_compliance.dto.TextAnalysisRequest;
import com.sih.lmpc_compliance.entity.*;
import com.sih.lmpc_compliance.repository.ProductRepository;
import com.sih.lmpc_compliance.repository.ScanRepository;
import com.sih.lmpc_compliance.repository.ViolationRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class ComplianceService {

    private final ProductRepository productRepository;
    private final ScanRepository scanRepository;
    private final ViolationRepository violationRepository;

    public ComplianceService(
            ProductRepository productRepository,
            ScanRepository scanRepository,
            ViolationRepository violationRepository
    ) {
        this.productRepository = productRepository;
        this.scanRepository = scanRepository;
        this.violationRepository = violationRepository;
    }

    public ComplianceResponse analyze(ScanRequest request, UUID userId) {
        // Find existing product or create dummy
        Product product = null;
        if (request.getProductId() != null) {
            product = productRepository.findById(request.getProductId()).orElse(null);
        }
        if (product == null) {
            product = Product.builder()
                    .name("Ad-hoc Product")
                    .imported(false)
                    .soldViaEcommerce(false)
                    .build();
            product = productRepository.save(product);
        }

        List<String> found = new ArrayList<>();
        List<String> missing = new ArrayList<>();
        List<String> violations = new ArrayList<>();

        if (request.getLabelText() != null) {
            String text = request.getLabelText().toLowerCase();
            
            if (text.contains("mfg") || text.contains("manufactured")) found.add("Manufacturing Date");
            else missing.add("Manufacturing Date");
            
            if (text.contains("exp") || text.contains("use by")) found.add("Expiry Date");
            else missing.add("Expiry Date");
            
            if (text.contains("mrp") || text.contains("rs.") || text.contains("₹")) found.add("MRP");
            else missing.add("MRP");
            
            if (text.contains("net") || text.contains("ml") || text.contains("gm")) found.add("Net Quantity");
            else missing.add("Net Quantity");
        }

        if (product.isImported() && !found.contains("Country of Origin")) {
            missing.add("Country of Origin");
            violations.add("Imported product is missing country of origin");
            return new ComplianceResponse(
                    "NON_COMPLIANT",
                    0,
                    found, missing, violations
            );
        }

        int totalChecks = found.size() + missing.size();

        int score = totalChecks == 0
                ? 0
                : (found.size() * 100) / totalChecks;

        String status = missing.isEmpty()
                ? "COMPLIANT"
                : "NON_COMPLIANT";

        Scan scan = Scan.builder()
                .product(product)
                .uploadedBy(com.sih.lmpc_compliance.entity.User.builder().id(userId).build())
                .imagePath(request.getImagePath() != null ? request.getImagePath() : "uploads/no-image.jpg")
                .status(ScanStatus.completed)
                .build();

        scan = scanRepository.save(scan);

        for (String violationDescription : violations) {

            Violation violation = Violation.builder()
                    .scan(scan)
                    .ruleRef("Legal Metrology Rules, 2011")
                    .severity(ViolationSeverity.major)
                    .description(violationDescription)
                    .build();

            violationRepository.save(violation);
        }


        return new ComplianceResponse(
                status,
                score,
                found,
                missing,
                violations
        );
    }

    public ComplianceResponse analyzeText(TextAnalysisRequest request, UUID userId) {

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() ->
                        new RuntimeException("Product not found"));

        String text = request.getExtractedText();

        if (text == null) {
            text = "";
        }

        text = text.toLowerCase();

        List<String> found = new ArrayList<>();
        List<String> missing = new ArrayList<>();
        List<String> violations = new ArrayList<>();

        // MRP
        boolean hasMrp =
                text.contains("mrp") ||
                        text.contains("maximum retail price") ||
                        text.contains("retail sale price") ||
                        text.contains("rsp");

        checkDeclaration(
                hasMrp,
                "MRP (Maximum Retail Price)",
                "Missing mandatory MRP declaration",
                found, missing, violations
        );

        // NET QUANTITY
        boolean hasNetQuantity =
                text.matches("(?s).*\\d+(\\.\\d+)?\\s*(g|kg|gm|gram|grams|ml|l|litre|liter|pcs|pieces|ml|ml).*");

        checkDeclaration(
                hasNetQuantity,
                "Net Quantity",
                "Missing mandatory net quantity declaration",
                found, missing, violations
        );

        // MANUFACTURER
        boolean hasManufacturer =
                text.contains("manufactured by") ||
                        text.contains("packed by") ||
                        text.contains("imported by") ||
                        text.contains("manufacturer") ||
                        text.contains("packer") ||
                        text.contains("importer");

        checkDeclaration(
                hasManufacturer,
                "Manufacturer / Packer / Importer",
                "Missing manufacturer, packer or importer declaration",
                found, missing, violations
        );

        // GENERIC NAME
        boolean hasGenericName =
                text.contains("product") ||
                        text.contains("shampoo") ||
                        text.contains("soap") ||
                        text.contains("biscuits") ||
                        text.contains("snacks") ||
                        text.contains("commodity") ||
                        text.contains("item") ||
                        text.contains("goods");

        checkDeclaration(
                hasGenericName,
                "Generic Name",
                "Common or generic name of commodity not detected",
                found, missing, violations
        );

        // MANUFACTURING DATE
        boolean hasManufacturingDate =
                text.contains("mfg") ||
                        text.contains("manufactured") ||
                        text.contains("mfd") ||
                        text.contains("manufacturing date") ||
                        text.contains("manufacture date") ||
                        text.contains("date of manufacture");

        checkDeclaration(
                hasManufacturingDate,
                "Month and Year of Manufacture",
                "Manufacturing month/year not detected",
                found, missing, violations
        );

        // CONSUMER CARE
        boolean hasConsumerCare =
                text.contains("consumer care") ||
                        text.contains("customer care") ||
                        text.contains("complaint") ||
                        text.contains("helpline") ||
                        text.contains("contact") ||
                        text.contains("support") ||
                        text.contains("toll free");

        checkDeclaration(
                hasConsumerCare,
                "Consumer Care Details",
                "Consumer care/contact information not detected",
                found, missing, violations
        );

        // COUNTRY OF ORIGIN FOR IMPORTED PRODUCTS
        if (product.isImported()) {

            boolean hasCountryOfOrigin =
                    text.contains("country of origin") ||
                            text.contains("made in") ||
                            text.contains("origin") ||
                            text.contains("product of");

            checkDeclaration(
                    hasCountryOfOrigin,
                    "Country of Origin",
                    "Imported product is missing country of origin",
                    found, missing, violations
            );
        }

        int totalChecks = found.size() + missing.size();

        int score = totalChecks == 0
                ? 0
                : (found.size() * 100) / totalChecks;

        String status = missing.isEmpty()
                ? "COMPLIANT"
                : "NON_COMPLIANT";

        Scan scan = Scan.builder()
                .product(product)
                .uploadedBy(com.sih.lmpc_compliance.entity.User.builder().id(userId).build())
                .imagePath("text-input")
                .status(ScanStatus.completed)
                .build();

        scan = scanRepository.save(scan);

        for (String violationDescription : violations) {

            Violation violation = Violation.builder()
                    .scan(scan)
                    .ruleRef("Legal Metrology Rules, 2011")
                    .severity(ViolationSeverity.major)
                    .description(violationDescription)
                    .build();

            violationRepository.save(violation);
        }

        ComplianceResponse response = new ComplianceResponse(
                status,
                score,
                found,
                missing,
                violations
        );

        response.setScanId(scan.getId());

        return response;
    }

    private void checkDeclaration(
            boolean present,
            String declaration,
            String violation,
            List<String> found,
            List<String> missing,
            List<String> violations
    ) {

        if (present) {
            found.add(declaration);
        } else {
            missing.add(declaration);
            violations.add(violation);
        }
    }
}