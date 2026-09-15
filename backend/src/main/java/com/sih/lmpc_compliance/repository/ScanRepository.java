package com.sih.lmpc_compliance.repository;

import com.sih.lmpc_compliance.entity.Scan;
import com.sih.lmpc_compliance.entity.ScanStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface ScanRepository extends JpaRepository<Scan, UUID> {
    List<Scan> findByProductId(UUID productId);
    List<Scan> findByProductIdAndUploadedById(UUID productId, UUID uploadedById);
    List<Scan> findByUploadedByIdOrderByScannedAtDesc(UUID uploadedById);
    long countByStatus(ScanStatus status);
    java.util.Optional<Scan> findByImagePath(String imagePath);
}