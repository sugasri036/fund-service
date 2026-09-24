package com.internship.fundservice.scheduler;

import com.internship.fundservice.entity.Fund;
import com.internship.fundservice.repository.FundRepository;
import com.internship.fundservice.service.NavHistoryImportService;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
@ConditionalOnProperty(
        name = "nav.scheduler.enabled",
        havingValue = "true",
        matchIfMissing = false
)
public class NavUpdateScheduler {

    private final FundRepository fundRepository;
    private final NavHistoryImportService navHistoryImportService;

    @Value("${nav.scheduler.lookback-days:1}")
    private int lookbackDays;

    public NavUpdateScheduler(
            FundRepository fundRepository,
            NavHistoryImportService navHistoryImportService
    ) {
        this.fundRepository = fundRepository;
        this.navHistoryImportService = navHistoryImportService;
    }

    // =====================================================
    // NAV UPDATE SCHEDULER
    // =====================================================

    @Scheduled(
            fixedRateString = "${nav.scheduler.fixed-rate:3600000}"
    )
    public void updateNav() {

        System.out.println();
        System.out.println("==============================================");
        System.out.println("NAV SCHEDULER STARTED");
        System.out.println("==============================================");

        try {

            List<Fund> funds = fundRepository.findAll();

            System.out.println(
                    "Total funds found: " + funds.size()
            );

            LocalDate toDate = LocalDate.now();

            LocalDate fromDate =
                    toDate.minusDays(lookbackDays);

            for (Fund fund : funds) {

                try {

                    // -----------------------------------------
                    // CHECK SCHEME CODE
                    // -----------------------------------------

                    if (fund.getSchemeCode() == null ||
                            fund.getSchemeCode().isBlank()) {

                        System.out.println(
                                "Skipping fund: "
                                        + fund.getName()
                                        + " - scheme code is missing"
                        );

                        continue;
                    }

                    System.out.println();
                    System.out.println(
                            "Updating NAV for: "
                                    + fund.getName()
                    );

                    System.out.println(
                            "Scheme Code: "
                                    + fund.getSchemeCode()
                    );

                    System.out.println(
                            "Date Range: "
                                    + fromDate
                                    + " -> "
                                    + toDate
                    );

                    // -----------------------------------------
                    // CALL EXTERNAL NAV API
                    // -----------------------------------------

                    navHistoryImportService.importHistory(
                            fund.getId(),
                            fromDate.toString(),
                            toDate.toString()
                    );

                    System.out.println(
                            "NAV update completed for: "
                                    + fund.getName()
                    );

                } catch (Exception e) {

                    System.err.println(
                            "Failed to update NAV for: "
                                    + fund.getName()
                    );

                    System.err.println(
                            "Reason: "
                                    + e.getMessage()
                    );
                }
            }

        } catch (Exception e) {

            System.err.println(
                    "NAV scheduler failed"
            );

            System.err.println(
                    "Reason: "
                            + e.getMessage()
            );
        }

        System.out.println();
        System.out.println("==============================================");
        System.out.println("NAV SCHEDULER FINISHED");
        System.out.println("==============================================");
    }
}