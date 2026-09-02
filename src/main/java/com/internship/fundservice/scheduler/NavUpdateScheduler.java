package com.internship.fundservice.scheduler;

import com.internship.fundservice.entity.Fund;
import com.internship.fundservice.repository.FundRepository;
import com.internship.fundservice.service.NavHistoryImportService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class NavUpdateScheduler {

    private final FundRepository fundRepository;
    private final NavHistoryImportService navHistoryImportService;

    public NavUpdateScheduler(
            FundRepository fundRepository,
            NavHistoryImportService navHistoryImportService
    ) {
        this.fundRepository = fundRepository;
        this.navHistoryImportService = navHistoryImportService;
    }

    @Scheduled(fixedRate = 3600000)
    public void updateNav() {

        System.out.println(
                "========== NAV UPDATE STARTED =========="
        );

        List<Fund> funds =
                fundRepository.findAll();

        for (Fund fund : funds) {

            if (fund.getSchemeCode() == null ||
                    fund.getSchemeCode().isBlank()) {

                System.out.println(
                        "Skipping fund without scheme code: "
                                + fund.getName()
                );

                continue;
            }

            try {

                System.out.println(
                        "Updating NAV for: "
                                + fund.getName()
                );

                navHistoryImportService.updateLatestNav(
                        fund.getId(),
                        fund.getSchemeCode()
                );

            } catch (Exception e) {

                System.out.println(
                        "Error updating NAV for "
                                + fund.getName()
                                + ": "
                                + e.getMessage()
                );
            }
        }

        System.out.println(
                "========== NAV UPDATE COMPLETED =========="
        );
    }
}