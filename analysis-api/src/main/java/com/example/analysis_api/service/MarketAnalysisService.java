package com.example.analysis_api.service;

import com.example.analysis_api.model.MarketSummary;
import com.example.analysis_api.model.PropertyRecord;
import com.example.analysis_api.model.WhatIfRequest;
import com.example.analysis_api.model.WhatIfResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import com.example.analysis_api.model.GroupedStatistics;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.server.ResponseStatusException;
import jakarta.annotation.PostConstruct;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class MarketAnalysisService {

    @Value("classpath:data/housing.csv")
    private Resource housingDataResource;

    @Value("${estimator.api.url:http://localhost:8000/predict}")
    private String estimatorUrl;

    // This will hold all properties in memory
    private List<PropertyRecord> properties = new ArrayList<>();

    private final RestTemplate restTemplate = new RestTemplate();

    @PostConstruct
    public void loadData() {
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(housingDataResource.getInputStream(), StandardCharsets.UTF_8))) {

            String header = reader.readLine(); // skip header line
            String line;
            while ((line = reader.readLine()) != null) {
                String[] parts = line.split(",");
                // We expect 9 columns:
                // id, square_footage, bedrooms, bathrooms, year_built,
                // lot_size, distance_to_city_center, school_rating, price
                if (parts.length < 9)
                    continue;

                double squareFootage = Double.parseDouble(parts[1]);
                int bedrooms = Integer.parseInt(parts[2]);
                double bathrooms = Double.parseDouble(parts[3]);
                int yearBuilt = Integer.parseInt(parts[4]);
                double lotSize = Double.parseDouble(parts[5]);
                double distanceToCityCenter = Double.parseDouble(parts[6]);
                double schoolRating = Double.parseDouble(parts[7]);
                double price = Double.parseDouble(parts[8]);

                properties.add(new PropertyRecord(
                        price,
                        squareFootage,
                        bedrooms,
                        bathrooms,
                        yearBuilt,
                        lotSize,
                        distanceToCityCenter,
                        schoolRating));
            }
            System.out.println("Loaded " + properties.size() + " property records.");
        } catch (Exception e) {
            throw new RuntimeException("Failed to load housing data", e);
        }
    }

    // Aggregate statistics – cached
    @Cacheable("marketSummary")
    public MarketSummary getMarketSummary() {
        if (properties.isEmpty()) {
            return new MarketSummary(0, 0, 0, 0, 0);
        }

        List<Double> prices = properties.stream()
                .map(PropertyRecord::getPrice)
                .sorted()
                .collect(Collectors.toList());

        double min = prices.get(0);
        double max = prices.get(prices.size() - 1);
        double sum = prices.stream().mapToDouble(Double::doubleValue).sum();
        double avg = sum / prices.size();

        double median;
        int n = prices.size();
        if (n % 2 == 0) {
            median = (prices.get(n / 2 - 1) + prices.get(n / 2)) / 2.0;
        } else {
            median = prices.get(n / 2);
        }

        return new MarketSummary(avg, min, max, median, prices.size());
    }

    // Grouped statistics: average price by number of bedrooms (for a filtered
    // subset)
    @Cacheable("avgPriceByBedrooms")
    public List<GroupedStatistics> getAveragePriceByBedrooms(
            Double minPrice,
            Double maxPrice,
            Integer minBedrooms,
            Integer maxBedrooms,
            Double minSchoolRating,
            Double maxSchoolRating) {
        // 1) Get the filtered subset first, reusing your existing filter logic
        List<PropertyRecord> filtered = filterProperties(
                minPrice,
                maxPrice,
                minBedrooms,
                maxBedrooms,
                minSchoolRating,
                maxSchoolRating);

        if (filtered.isEmpty()) {
            return List.of();
        }

        // 2) Group by bedrooms
        Map<Integer, List<PropertyRecord>> byBedrooms = filtered.stream()
                .collect(Collectors.groupingBy(PropertyRecord::getBedrooms));

        // 3) For each group, compute count + average price, and map to GroupedStatistic
        return byBedrooms.entrySet().stream()
                .sorted(Map.Entry.comparingByKey()) // sort by bedroom count
                .map(entry -> {
                    int bedrooms = entry.getKey();
                    List<PropertyRecord> group = entry.getValue();

                    double avgPrice = group.stream()
                            .mapToDouble(PropertyRecord::getPrice)
                            .average()
                            .orElse(0.0);

                    return new GroupedStatistics(
                            String.valueOf(bedrooms), // label
                            group.size(),
                            avgPrice);
                })
                .collect(Collectors.toList());
    }

    // Filtered list for segments
    @Cacheable("segments")
    public List<PropertyRecord> filterProperties(
            Double minPrice,
            Double maxPrice,
            Integer minBedrooms,
            Integer maxBedrooms,
            Double minSchoolRating,
            Double maxSchoolRating) {
        return properties.stream()
                .filter(p -> minPrice == null || p.getPrice() >= minPrice)
                .filter(p -> maxPrice == null || p.getPrice() <= maxPrice)
                .filter(p -> minBedrooms == null || p.getBedrooms() >= minBedrooms)
                .filter(p -> maxBedrooms == null || p.getBedrooms() <= maxBedrooms)
                .filter(p -> minSchoolRating == null || p.getSchoolRating() >= minSchoolRating)
                .filter(p -> maxSchoolRating == null || p.getSchoolRating() <= maxSchoolRating)
                .collect(Collectors.toList());
    }

    /// What-if: call Python model ML container
    public WhatIfResponse runWhatIf(WhatIfRequest req) {
        Map<String, Object> features = new HashMap<>();
        features.put("square_footage", req.getSquareFootage());
        features.put("bedrooms", req.getBedrooms());
        features.put("bathrooms", req.getBathrooms());
        features.put("year_built", req.getYearBuilt());
        features.put("lot_size", req.getLotSize());
        features.put("distance_to_city_center", req.getDistanceToCityCenter());
        features.put("school_rating", req.getSchoolRating());

        Map<String, Object> body = new HashMap<>();
        body.put("features", features);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        final ResponseEntity<Map> response;
        try {
            response = restTemplate.exchange(
                    estimatorUrl, // configurable
                    HttpMethod.POST,
                    entity,
                    Map.class);
        } catch (Exception e) {
            // ML service unreachable / timeout / connection error
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Estimator service is unavailable",
                    e);
        }

        if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
            // ML service responded but not OK
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Estimator service returned a non-success response");
        }

        Object preds = response.getBody().get("predictions");
        if (!(preds instanceof List<?> list) || list.isEmpty() || !(list.get(0) instanceof Number num)) {
            // payload shape not as expected
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Estimator service returned an invalid predictions payload");
        }

        double predictedPrice = num.doubleValue();

        double marketAvg = getMarketSummary().getAvgPrice();
        return new WhatIfResponse(predictedPrice, marketAvg);
    }

    public List<PropertyRecord> getAllProperties() {
        return properties;
    }
}
