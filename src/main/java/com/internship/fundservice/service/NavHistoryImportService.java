package com.internship.fundservice.service;

import com.internship.fundservice.entity.Fund;
import com.internship.fundservice.entity.FundNavHistory;
import com.internship.fundservice.repository.FundNavHistoryRepository;
import com.internship.fundservice.repository.FundRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;

@Service
public class NavHistoryImportService {

    private static final String TIGZIG_URL =
            "https://api.tigzig.com/mf/v1/nav";

    private static final DateTimeFormatter DATE_FORMATTER =
            DateTimeFormatter.ISO_LOCAL_DATE;

    private final FundRepository fundRepository;
    private final FundNavHistoryRepository navHistoryRepository;

    private final RestClient restClient = RestClient.create();

    public NavHistoryImportService(
            FundRepository fundRepository,
            FundNavHistoryRepository navHistoryRepository
    ) {
        this.fundRepository = fundRepository;
        this.navHistoryRepository = navHistoryRepository;
    }

    // =========================================================
    // IMPORT HISTORICAL NAV FOR ONE FUND
    // =========================================================

    public void importHistory(
            Long fundId,
            String fromDate,
            String toDate
    ) {

        Fund fund = fundRepository.findById(fundId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Fund not found with id: " + fundId
                        )
                );

        String schemeCode = fund.getSchemeCode();

        if (schemeCode == null || schemeCode.isBlank()) {
            throw new RuntimeException(
                    "Scheme code missing for fund: " + fund.getName()
            );
        }

        String url =
                TIGZIG_URL
                        + "?scheme=" + schemeCode
                        + "&since=" + fromDate
                        + "&to=" + toDate;

        System.out.println(
                "=============================================="
        );

        System.out.println(
                "Fetching historical NAV"
        );

        System.out.println(
                "Fund: " + fund.getName()
        );

        System.out.println(
                "Scheme Code: " + schemeCode
        );

        System.out.println(
                "From: " + fromDate + " To: " + toDate
        );

        System.out.println(
                "=============================================="
        );

        TigZigNavResponse response =
                restClient
                        .get()
                        .uri(url)
                        .retrieve()
                        .body(TigZigNavResponse.class);

        if (response == null ||
                response.data == null ||
                response.data.isEmpty()) {

            System.out.println(
                    "No historical NAV data returned for "
                            + fund.getName()
            );

            return;
        }

        int imported = 0;
        int skipped = 0;

        for (TigZigNavData item : response.data) {

            try {

                LocalDate navDate =
                        LocalDate.parse(
                                item.date,
                                DATE_FORMATTER
                        );

                BigDecimal nav = item.nav;

                if (nav == null) {
                    continue;
                }

                if (navHistoryRepository
                        .existsByFundAndNavDate(
                                fund,
                                navDate
                        )) {

                    skipped++;
                    continue;
                }

                FundNavHistory history =
                        new FundNavHistory();

                history.setFund(fund);
                history.setNavDate(navDate);
                history.setNav(nav);

                navHistoryRepository.save(history);

                imported++;

            } catch (Exception e) {

                System.out.println(
                        "Could not process NAV: "
                                + e.getMessage()
                );
            }
        }

        System.out.println(
                "Historical import completed for "
                        + fund.getName()
        );

        System.out.println(
                "Imported: " + imported
                        + " | Skipped: " + skipped
        );
    }


    // =========================================================
    // IMPORT 3 YEARS FOR ONE FUND
    // =========================================================

    public void importThreeYears(Long fundId) {

        LocalDate toDate =
                LocalDate.now();

        LocalDate fromDate =
                toDate.minusYears(3);

        importHistory(
                fundId,
                fromDate.toString(),
                toDate.toString()
        );
    }


    // =========================================================
    // IMPORT 3 YEARS FOR ALL FUNDS
    // =========================================================

    public void importAllFundsHistory() {

        List<Fund> funds =
                fundRepository.findAll();

        LocalDate toDate =
                LocalDate.now();

        LocalDate fromDate =
                toDate.minusYears(3);

        System.out.println(
                "================================================"
        );

        System.out.println(
                "STARTING HISTORICAL NAV IMPORT FOR ALL FUNDS"
        );

        System.out.println(
                "Funds: " + funds.size()
        );

        System.out.println(
                "From: " + fromDate
                        + " To: " + toDate
        );

        System.out.println(
                "================================================"
        );

        for (Fund fund : funds) {

            if (fund.getSchemeCode() == null ||
                    fund.getSchemeCode().isBlank()) {

                System.out.println(
                        "Skipping "
                                + fund.getName()
                                + " - no scheme code"
                );

                continue;
            }

            try {

                importHistory(
                        fund.getId(),
                        fromDate.toString(),
                        toDate.toString()
                );

            } catch (Exception e) {

                System.out.println(
                        "Failed for "
                                + fund.getName()
                                + ": "
                                + e.getMessage()
                );
            }
        }

        System.out.println(
                "================================================"
        );

        System.out.println(
                "ALL FUND HISTORICAL IMPORT COMPLETED"
        );

        System.out.println(
                "================================================"
        );
    }


    // =========================================================
    // UPDATE LATEST NAV
    // =========================================================

    public void updateLatestNav(
            Long fundId,
            String schemeCode
    ) {

        Fund fund = fundRepository.findById(fundId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Fund not found with id: "
                                        + fundId
                        )
                );

        String url =
                TIGZIG_URL
                        + "?scheme=" + schemeCode
                        + "&latest=true";

        System.out.println(
                "Fetching latest NAV for: "
                        + fund.getName()
        );

        TigZigNavResponse response =
                restClient
                        .get()
                        .uri(url)
                        .retrieve()
                        .body(TigZigNavResponse.class);

        if (response == null ||
                response.data == null ||
                response.data.isEmpty()) {

            System.out.println(
                    "No latest NAV available for "
                            + fund.getName()
            );

            return;
        }

        TigZigNavData latest =
                response.data.stream()
                        .max(
                                Comparator.comparing(
                                        item -> LocalDate.parse(
                                                item.date,
                                                DATE_FORMATTER
                                        )
                        )
                        )
                        .orElseThrow();

        LocalDate navDate =
                LocalDate.parse(
                        latest.date,
                        DATE_FORMATTER
                );

        BigDecimal nav =
                latest.nav;

        // Update current NAV in funds table
        fund.setNav(nav);

        fundRepository.save(fund);

        // Save history only if this date doesn't exist
        if (!navHistoryRepository
                .existsByFundAndNavDate(
                        fund,
                        navDate
                )) {

            FundNavHistory history =
                    new FundNavHistory();

            history.setFund(fund);
            history.setNavDate(navDate);
            history.setNav(nav);

            navHistoryRepository.save(history);

            System.out.println(
                    "Latest NAV saved: "
                            + navDate
                            + " -> "
                            + nav
            );

        } else {

            System.out.println(
                    "Latest NAV already exists: "
                            + navDate
                            + " -> "
                            + nav
            );
        }
    }


    // =========================================================
    // TIGZIG RESPONSE
    // =========================================================

    public static class TigZigNavResponse {

        public String scheme_code;
        public String scheme_name;
        public String isin;
        public String first_available_date;
        public String latest_available_date;
        public int count;

        public List<TigZigNavData> data;
    }


    public static class TigZigNavData {

        public String date;
        public BigDecimal nav;
    }
}