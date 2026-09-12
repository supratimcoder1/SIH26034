package com.sih.lmpc_compliance.dto;

import java.util.List;
import java.util.UUID;

public class ComplianceResponse {

    private String status;

    private int score;

    private List<String> foundDeclarations;

    private List<String> missingDeclarations;

    private List<String> violations;

    private UUID scanId;

    public ComplianceResponse() {
    }

    public ComplianceResponse(
            String status,
            int score,
            List<String> foundDeclarations,
            List<String> missingDeclarations,
            List<String> violations
    ) {
        this.status = status;
        this.score = score;
        this.foundDeclarations = foundDeclarations;
        this.missingDeclarations = missingDeclarations;
        this.violations = violations;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public int getScore() {
        return score;
    }

    public void setScore(int score) {
        this.score = score;
    }

    public List<String> getFoundDeclarations() {
        return foundDeclarations;
    }

    public void setFoundDeclarations(List<String> foundDeclarations) {
        this.foundDeclarations = foundDeclarations;
    }

    public List<String> getMissingDeclarations() {
        return missingDeclarations;
    }

    public void setMissingDeclarations(List<String> missingDeclarations) {
        this.missingDeclarations = missingDeclarations;
    }

    public List<String> getViolations() {
        return violations;
    }

    public void setViolations(List<String> violations) {
        this.violations = violations;
    }

    public UUID getScanId() {
        return scanId;
    }

    public void setScanId(UUID scanId) {
        this.scanId = scanId;
    }
}