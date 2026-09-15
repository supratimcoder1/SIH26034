package com.sih.lmpc_compliance.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "scans")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Scan {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "product_id")
    private Product product;

    @ManyToOne
    @JoinColumn(name = "uploaded_by")
    private User uploadedBy;

    @Column(name = "image_path", nullable = false)
    private String imagePath;

    @Column(name = "principal_display_panel_area_cm2")
    private BigDecimal principalDisplayPanelAreaCm2;

    @Column(name = "net_quantity_value")
    private BigDecimal netQuantityValue;

    @Column(name = "net_quantity_unit")
    private String netQuantityUnit;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "status", nullable = false)
    private ScanStatus status;

    @Column(name = "scanned_at", insertable = false, updatable = false)
    private Instant scannedAt;

    @Builder.Default
    @Column(name = "review_status")
    private String reviewStatus = "pending";

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "raw_json", columnDefinition = "jsonb")
    private java.util.Map<String, Object> rawJson;
}