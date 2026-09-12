package com.sih.lmpc_compliance.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class TextAnalysisRequest {
    @NotNull
    private UUID productId;

    @NotBlank
    private String extractedText;

    private String productName;
    private String manufacturer;
    private boolean isEcommerce;
}
