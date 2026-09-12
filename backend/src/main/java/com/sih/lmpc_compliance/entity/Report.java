package com.sih.lmpc_compliance.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "reports")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Report {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "scan_id")
    private Scan scan;

    @Column(name = "file_path", nullable = false)
    private String filePath;

    private String format;

    @Column(name = "generated_at", insertable = false, updatable = false)
    private Instant generatedAt;
}
