package com.internship.fundservice.controller;

import com.internship.fundservice.entity.FundNavHistory;
import com.internship.fundservice.service.FundNavHistoryService;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/funds")

public class FundNavHistoryController {

    private final FundNavHistoryService navHistoryService;

    public FundNavHistoryController(
            FundNavHistoryService navHistoryService
    ) {
        this.navHistoryService = navHistoryService;
    }

    @GetMapping("/{fundId}/nav-history")
    public List<FundNavHistory> getNavHistory(
            @PathVariable Long fundId,
            @RequestParam LocalDate startDate,
            @RequestParam LocalDate endDate
    ) {

        return navHistoryService.getNavHistory(
                fundId,
                startDate,
                endDate
        );
    }
}