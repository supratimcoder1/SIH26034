package com.sih.lmpc_compliance.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "violations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Violation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "scan_id")
    private Scan scan;

    @ManyToOne
    @JoinColumn(name = "declaration_id")
    private Declaration declaration;

    @Column(name = "declaration_type_id")
    private String declarationTypeId;

    @Column(name = "rule_ref", nullable = false)
    private String ruleRef;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "severity", nullable = false)
    private ViolationSeverity severity;

    @Column(nullable = false)
    private String description;

    @Column(name = "detected_at", insertable = false, updatable = false)
    private Instant detectedAt;
}