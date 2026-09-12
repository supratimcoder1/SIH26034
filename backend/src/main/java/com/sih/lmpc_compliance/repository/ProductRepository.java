package com.sih.lmpc_compliance.repository;

import com.sih.lmpc_compliance.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ProductRepository extends JpaRepository<Product, UUID> {     java.util.Optional<Product> findFirstByOrderByIdAsc();
}