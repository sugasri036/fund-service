package com.internship.fundservice.repository;

import com.internship.fundservice.entity.Fund;
import com.internship.fundservice.entity.FundNavHistory;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface FundNavHistoryRepository
        extends JpaRepository<
                FundNavHistory,
                Long
        > {


    // =====================================================
    // CHECK EXISTING NAV
    // =====================================================

    boolean existsByFundAndNavDate(
            Fund fund,
            LocalDate navDate
    );


    // =====================================================
    // GET NAV HISTORY
    // =====================================================

    List<FundNavHistory>
    findByFundAndNavDateBetweenOrderByNavDateAsc(

            Fund fund,

            LocalDate startDate,

            LocalDate endDate
    );
}