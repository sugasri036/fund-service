package com.internship.fundservice.repository;

import com.internship.fundservice.entity.Fund;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface FundRepository extends JpaRepository<Fund, Long> {

    @Query("""
        SELECT f FROM Fund f
        WHERE (:search = '' OR
               LOWER(f.name) LIKE LOWER(CONCAT('%', :search, '%')))
        AND (:category = '' OR f.category = :category)
        """)
    Page<Fund> searchAndFilter(
            @Param("search") String search,
            @Param("category") String category,
            Pageable pageable
    );
}