package com.sih.lmpc_compliance.controller;

import com.sih.lmpc_compliance.dto.DashboardSummary;
import com.sih.lmpc_compliance.entity.ScanStatus;
import com.sih.lmpc_compliance.entity.ViolationSeverity;
import com.sih.lmpc_compliance.repository.ScanRepository;
import com.sih.lmpc_compliance.repository.ViolationRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping
public class DashboardController {

    private final ScanRepository scanRepository;
    private final ViolationRepository violationRepository;

    public DashboardController(ScanRepository scanRepository, ViolationRepository violationRepository) {
        this.scanRepository = scanRepository;
        this.violationRepository = violationRepository;
    }

    @GetMapping({"/api/dashboard/summary", "/api/analytics"})
    public DashboardSummary getSummary() {
        long totalScans = scanRepository.count();
        long completedScans = scanRepository.countByStatus(ScanStatus.completed);
        long totalViolations = violationRepository.count();
        long criticalViolations = violationRepository.countBySeverity(ViolationSeverity.critical);
        long majorViolations = violationRepository.countBySeverity(ViolationSeverity.major);
        long minorViolations = violationRepository.countBySeverity(ViolationSeverity.minor);

        return new DashboardSummary(
                totalScans,
                completedScans,
                totalViolations,
                criticalViolations,
                majorViolations,
                minorViolations
        );
    }
}