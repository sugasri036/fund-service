package com.internship.fundservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class FundServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(
                FundServiceApplication.class,
                args
        );
    }
}