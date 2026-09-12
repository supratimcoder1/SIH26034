package com.sih.lmpc_compliance.repository;

import com.sih.lmpc_compliance.entity.Violation;
import com.sih.lmpc_compliance.entity.ViolationSeverity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ViolationRepository extends JpaRepository<Violation, UUID> {
    List<Violation> findByScanId(UUID scanId);
    long countBySeverity(ViolationSeverity severity);
}