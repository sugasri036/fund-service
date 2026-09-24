package com.internship.fundservice.entity;

import jakarta.persistence.*;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(
        name = "fund_nav_history",

        uniqueConstraints = {

                @UniqueConstraint(
                        name = "uk_fund_nav_date",
                        columnNames = {
                                "fund_id",
                                "nav_date"
                        }
                )
        },

        indexes = {

                @Index(
                        name = "idx_nav_history_fund_date",
                        columnList = "fund_id,nav_date"
                )
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FundNavHistory {

    @Id
    @GeneratedValue(
            strategy = GenerationType.IDENTITY
    )
    private Long id;


    // =====================================================
    // FUND
    // =====================================================

    @ManyToOne(
            fetch = FetchType.LAZY,
            optional = false
    )
    @JoinColumn(
            name = "fund_id",
            nullable = false
    )
    private Fund fund;


    // =====================================================
    // NAV DATE
    // =====================================================

    @Column(
            name = "nav_date",
            nullable = false
    )
    private LocalDate navDate;


    // =====================================================
    // NAV
    // =====================================================

    @Column(
            nullable = false,
            precision = 12,
            scale = 4
    )
    private BigDecimal nav;
}