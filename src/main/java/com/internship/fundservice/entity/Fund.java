package com.internship.fundservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity
@Table(name = "funds")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Fund {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String category;

    private String riskLevel;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal nav;

    private BigDecimal oneYearReturn;

    private BigDecimal threeYearReturn;

    private BigDecimal fiveYearReturn;

    private BigDecimal minimumInvestment;

    @Column(length = 1000)
    private String description;

    @Column(unique = true)
    private String schemeCode;
}