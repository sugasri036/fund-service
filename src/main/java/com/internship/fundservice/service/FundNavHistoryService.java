package com.internship.fundservice.service;

import com.internship.fundservice.entity.Fund;
import com.internship.fundservice.entity.FundNavHistory;
import com.internship.fundservice.repository.FundNavHistoryRepository;
import com.internship.fundservice.repository.FundRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;

@Service
public class FundNavHistoryService {

    private final FundNavHistoryRepository navHistoryRepository;
    private final FundRepository fundRepository;

    public FundNavHistoryService(
            FundNavHistoryRepository navHistoryRepository,
            FundRepository fundRepository
    ) {
        this.navHistoryRepository = navHistoryRepository;
        this.fundRepository = fundRepository;
    }

    public List<FundNavHistory> getNavHistory(
            Long fundId,
            LocalDate startDate,
            LocalDate endDate
    ) {

        Fund fund = fundRepository.findById(fundId)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Fund not found with id: " + fundId
                        )
                );

        return navHistoryRepository
                .findByFundAndNavDateBetweenOrderByNavDateAsc(
                        fund,
                        startDate,
                        endDate
                );
    }
}