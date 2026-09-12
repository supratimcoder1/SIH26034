package com.sih.lmpc_compliance.repository;

import com.sih.lmpc_compliance.entity.Declaration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DeclarationRepository extends JpaRepository<Declaration, UUID> {
    List<Declaration> findByScanId(UUID scanId);
    List<Declaration> findByDeclarationTypeId(String declarationTypeId);
}
