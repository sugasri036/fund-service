package com.internship.fundservice.controller;

import com.internship.fundservice.entity.Fund;
import com.internship.fundservice.repository.FundRepository;
import com.internship.fundservice.service.NavHistoryImportService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.concurrent.CompletableFuture;

@RestController
@RequestMapping("/api/funds")
public class NavHistoryImportController {

    private final NavHistoryImportService importService;

    private final FundRepository fundRepository;


    public NavHistoryImportController(

            NavHistoryImportService importService,

            FundRepository fundRepository

    ) {

        this.importService =
                importService;

        this.fundRepository =
                fundRepository;
    }


    // =====================================================
    // IMPORT HISTORY FOR ONE FUND
    // =====================================================

    @PostMapping("/{fundId}/import-history")
    public ResponseEntity<String> importHistory(

            @PathVariable Long fundId

    ) {

        Fund fund =
                fundRepository.findById(fundId)

                        .orElseThrow(
                                () ->
                                        new RuntimeException(
                                                "Fund not found with id: "
                                                        + fundId
                                        )
                        );


        if (fund.getSchemeCode() == null ||
                fund.getSchemeCode().isBlank()) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            "Fund has no scheme code: "
                                    + fund.getName()
                    );
        }


        LocalDate toDate =
                LocalDate.now();


        LocalDate fromDate =
                toDate.minusYears(3);


        CompletableFuture.runAsync(() -> {

            try {

                importService.importHistory(

                        fundId,

                        fromDate.toString(),

                        toDate.toString()

                );


                System.out.println(
                        "History import completed for: "
                                + fund.getName()
                );


            } catch (Exception e) {

                System.out.println(
                        "Error importing history for "
                                + fund.getName()
                                + ": "
                                + e.getMessage()
                );
            }
        });


        return ResponseEntity.accepted()
                .body(
                        "Historical NAV import started for "
                                + fund.getName()
                );
    }


    // =====================================================
    // IMPORT HISTORY FOR ALL FUNDS
    // =====================================================

    @PostMapping("/import-all-history")
    public ResponseEntity<String> importAllHistory() {

        LocalDate toDate =
                LocalDate.now();


        LocalDate fromDate =
                toDate.minusYears(3);


        List<Fund> funds =
                fundRepository.findAll();


        CompletableFuture.runAsync(() -> {

            int processed = 0;


            System.out.println(
                    "========== BULK NAV HISTORY IMPORT STARTED =========="
            );


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

                    importService.importHistory(

                            fund.getId(),

                            fromDate.toString(),

                            toDate.toString()

                    );

                    processed++;


                } catch (Exception e) {

                    System.out.println(
                            "Error importing history for "
                                    + fund.getName()
                                    + ": "
                                    + e.getMessage()
                    );
                }
            }


            System.out.println(
                    "========== BULK NAV HISTORY IMPORT COMPLETED =========="
            );


            System.out.println(
                    "Funds processed: "
                            + processed
            );

        });


        return ResponseEntity.accepted()
                .body(
                        "Historical NAV import started for "
                                + funds.size()
                                + " funds."
                );
    }
}