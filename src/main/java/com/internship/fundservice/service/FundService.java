package com.internship.fundservice.service;

import com.internship.fundservice.entity.Fund;
import com.internship.fundservice.repository.FundRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class FundService {

    private final FundRepository fundRepository;

    public FundService(FundRepository fundRepository) {
        this.fundRepository = fundRepository;
    }

    public Page<Fund> getFunds(
            String search,
            String category,
            int page,
            int size
    ) {

        Pageable pageable = PageRequest.of(page, size);

        return fundRepository.searchAndFilter(
                search,
                category,
                pageable
        );
    }

    public Fund getFundById(Long id) {

        return fundRepository.findById(id)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Fund not found with id: " + id
                        )
                );
    }

    public Fund createFund(Fund fund) {
        return fundRepository.save(fund);
    }

    public Fund updateFund(
            Long id,
            Fund updatedFund
    ) {

        Fund existingFund = getFundById(id);

        existingFund.setName(
                updatedFund.getName()
        );

        existingFund.setCategory(
                updatedFund.getCategory()
        );

        existingFund.setRiskLevel(
                updatedFund.getRiskLevel()
        );

        existingFund.setNav(
                updatedFund.getNav()
        );

        existingFund.setOneYearReturn(
                updatedFund.getOneYearReturn()
        );

        existingFund.setThreeYearReturn(
                updatedFund.getThreeYearReturn()
        );

        existingFund.setFiveYearReturn(
                updatedFund.getFiveYearReturn()
        );

        existingFund.setMinimumInvestment(
                updatedFund.getMinimumInvestment()
        );

        existingFund.setDescription(
                updatedFund.getDescription()
        );

        return fundRepository.save(existingFund);
    }

    public void deleteFund(Long id) {

        Fund fund = getFundById(id);

        fundRepository.delete(fund);
    }
}