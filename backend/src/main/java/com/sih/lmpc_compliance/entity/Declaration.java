package com.sih.lmpc_compliance.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "declarations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Declaration {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "scan_id")
    private Scan scan;

    @Column(name = "declaration_type_id")
    private String declarationTypeId;

    @Column(name = "extracted_text")
    private String extractedText;

    @Column(name = "font_height_mm")
    private BigDecimal fontHeightMm;

    @Column(name = "is_molded")
    private boolean molded;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private String bbox;

    private BigDecimal confidence;

    @Column(name = "created_at", insertable = false, updatable = false)
    private Instant createdAt;
}
