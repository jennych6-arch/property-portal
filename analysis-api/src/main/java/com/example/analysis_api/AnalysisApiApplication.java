package com.example.analysis_api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching
public class AnalysisApiApplication {
    public static void main(String[] args) {
        SpringApplication.run(AnalysisApiApplication.class, args);
    }
}
