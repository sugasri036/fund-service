package com.internship.fundservice.controller;

import com.internship.fundservice.entity.Fund;
import com.internship.fundservice.service.FundService;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/funds")
public class FundController {

    private final FundService fundService;

    public FundController(FundService fundService) {
        this.fundService = fundService;
    }

    @GetMapping
    public ResponseEntity<Page<Fund>> getFunds(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "100") int size
    ) {

        return ResponseEntity.ok(
                fundService.getFunds(
                        search,
                        category,
                        page,
                        size
                )
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<Fund> getFund(
            @PathVariable Long id
    ) {

        return ResponseEntity.ok(
                fundService.getFundById(id)
        );
    }

    @PostMapping
    public ResponseEntity<Fund> createFund(
            @RequestBody Fund fund
    ) {

        return ResponseEntity.ok(
                fundService.createFund(fund)
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<Fund> updateFund(
            @PathVariable Long id,
            @RequestBody Fund fund
    ) {

        return ResponseEntity.ok(
                fundService.updateFund(id, fund)
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFund(
            @PathVariable Long id
    ) {

        fundService.deleteFund(id);

        return ResponseEntity.noContent().build();
    }
}