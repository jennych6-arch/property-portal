package com.example.analysis_api.controller;

import com.example.analysis_api.model.MarketSummary;
import com.example.analysis_api.model.PropertyRecord;
import com.example.analysis_api.model.WhatIfRequest;
import com.example.analysis_api.model.WhatIfResponse;
import com.example.analysis_api.service.MarketAnalysisService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.example.analysis_api.model.GroupedStatistics;
import jakarta.validation.Valid;


import java.nio.charset.StandardCharsets;
import java.util.List;

@RestController
@RequestMapping("/market")
@CrossOrigin(origins = "http://localhost:3000")
public class MarketController {

    private final MarketAnalysisService analysisService;

    public MarketController(MarketAnalysisService analysisService) {
        this.analysisService = analysisService;
    }

    @GetMapping("/health")
    public String health() {
        return "ok";
    }

    @GetMapping("/summary")
    public MarketSummary getSummary() {
        return analysisService.getMarketSummary();
    }

    @GetMapping("/segments")
    public List<PropertyRecord> getSegments(
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice,
            @RequestParam(required = false) Integer minBedrooms,
            @RequestParam(required = false) Integer maxBedrooms,
            @RequestParam(required = false, name = "minSchoolRating") Double minSchoolRating,
            @RequestParam(required = false, name = "maxSchoolRating") Double maxSchoolRating
    ) {
        return analysisService.filterProperties(
                minPrice,
                maxPrice,
                minBedrooms,
                maxBedrooms,
                minSchoolRating,
                maxSchoolRating
        );
    }

    // Grouped statistics: avg price by bedrooms
    @GetMapping("/distribution/bedrooms")
    public List<GroupedStatistics> getDistributionByBedrooms(
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice,
            @RequestParam(required = false) Integer minBedrooms,
            @RequestParam(required = false) Integer maxBedrooms,
            @RequestParam(required = false, name = "minSchoolRating") Double minSchoolRating,
            @RequestParam(required = false, name = "maxSchoolRating") Double maxSchoolRating
    ) {
        return analysisService.getAveragePriceByBedrooms(
                minPrice,
                maxPrice,
                minBedrooms,
                maxBedrooms,
                minSchoolRating,
                maxSchoolRating
        );
    }

    @PostMapping("/what-if")
    public WhatIfResponse runWhatIf(@Valid @RequestBody WhatIfRequest request) {
        return analysisService.runWhatIf(request);
    }

    /**
     * Export endpoint:
     *  GET /market/export?type=csv
     *  GET /market/export?type=pdf
     */
    @GetMapping("/export")
    public ResponseEntity<byte[]> export(@RequestParam String type) {
        if ("csv".equalsIgnoreCase(type)) {
            return exportCsv();
        } else if ("pdf".equalsIgnoreCase(type)) {
            return exportPdf();
        } else {
            byte[] body = ("Unsupported export format: " + type)
                    .getBytes(StandardCharsets.UTF_8);
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(body);
        }
    }

    private ResponseEntity<byte[]> exportCsv() {
        StringBuilder sb = new StringBuilder();
        sb.append("price,squareFootage,bedrooms,bathrooms,yearBuilt,lotSize,distanceToCityCenter,schoolRating\n");

        List<PropertyRecord> records = analysisService.getAllProperties();
        for (PropertyRecord p : records) {
            sb.append(String.format(
                    "%f,%d,%d,%f,%d,%d,%f,%d%n",
                    p.getPrice(),
                    p.getSquareFootage(),
                    p.getBedrooms(),
                    p.getBathrooms(),
                    p.getYearBuilt(),
                    p.getLotSize(),
                    p.getDistanceToCityCenter(),
                    p.getSchoolRating()
            ));
        }

        byte[] csvBytes = sb.toString().getBytes(StandardCharsets.UTF_8);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.TEXT_PLAIN);
        headers.set(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=market_data.csv");

        return new ResponseEntity<>(csvBytes, headers, HttpStatus.OK);
    }

    private ResponseEntity<byte[]> exportPdf() {
        // Minimal valid PDF – just a stub for the assignment.
        String pdf = "%PDF-1.4\n" +
                "1 0 obj <<>> endobj\n" +
                "2 0 obj << /Length 44 >> stream\n" +
                "BT /F1 24 Tf 100 700 Td (Market Analysis PDF Export) Tj ET\n" +
                "endstream endobj\n" +
                "3 0 obj << /Type /Catalog /Pages 4 0 R >> endobj\n" +
                "4 0 obj << /Type /Pages /Kids [5 0 R] /Count 1 >> endobj\n" +
                "5 0 obj << /Type /Page /Parent 4 0 R /MediaBox [0 0 612 792] /Contents 2 0 R >> endobj\n" +
                "xref\n0 6\n0000000000 65535 f \n" +
                "0000000010 00000 n \n" +
                "0000000053 00000 n \n" +
                "0000000120 00000 n \n" +
                "0000000175 00000 n \n" +
                "0000000240 00000 n \n" +
                "trailer << /Size 6 /Root 3 0 R >>\n" +
                "startxref\n305\n%%EOF";

        byte[] pdfBytes = pdf.getBytes(StandardCharsets.UTF_8);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.set(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=market_analysis.pdf");

        return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
    }
}