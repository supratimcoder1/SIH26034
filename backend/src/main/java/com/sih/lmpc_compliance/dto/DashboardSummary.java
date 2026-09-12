package com.sih.lmpc_compliance.dto;

public class DashboardSummary {
    private long totalScans;
    private long completedScans;
    private long totalViolations;
    private long criticalViolations;
    private long majorViolations;
    private long minorViolations;

    public DashboardSummary(
            long totalScans,
            long completedScans,
            long totalViolations,
            long criticalViolations,
            long majorViolations,
            long minorViolations
    ) {
        this.totalScans = totalScans;
        this.completedScans = completedScans;
        this.totalViolations = totalViolations;
        this.criticalViolations = criticalViolations;
        this.majorViolations = majorViolations;
        this.minorViolations = minorViolations;
    }

    public long getTotalScans() {
        return totalScans;
    }

    public long getCompletedScans() {
        return completedScans;
    }

    public long getTotalViolations() {
        return totalViolations;
    }

    public long getCriticalViolations() {
        return criticalViolations;
    }

    public long getMajorViolations() {
        return majorViolations;
    }

    public long getMinorViolations() {
        return minorViolations;
    }
}