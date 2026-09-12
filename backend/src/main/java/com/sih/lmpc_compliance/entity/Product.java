package com.sih.lmpc_compliance.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "products")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @ManyToOne
    @JoinColumn(name = "category_id")
    private Category category;

    @Column(name = "is_imported")
    private boolean imported;

    @Column(name = "sold_via_ecommerce")
    private boolean soldViaEcommerce;

    @Column(name = "created_at", insertable = false, updatable = false)
    private Instant createdAt;
}