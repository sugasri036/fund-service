package com.internship.fundservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "fund_nav_history")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FundNavHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "fund_id", nullable = false)
    private Fund fund;

    @Column(nullable = false)
    private LocalDate navDate;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal nav;
}