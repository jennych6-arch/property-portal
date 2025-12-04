package com.example.analysis_api.model;

public class MarketSummary {
    private double avgPrice;
    private double minPrice;
    private double maxPrice;
    private double medianPrice;
    private long totalCount;

    public MarketSummary(double avgPrice, double minPrice, double maxPrice, double medianPrice, long totalCount) {
        this.avgPrice = avgPrice;
        this.minPrice = minPrice;
        this.maxPrice = maxPrice;
        this.medianPrice = medianPrice;
        this.totalCount = totalCount;
    }

    public double getAvgPrice() {
        return avgPrice;
    }

    public double getMinPrice() {
        return minPrice;
    }

    public double getMaxPrice() {
        return maxPrice;
    }

    public double getMedianPrice() {
        return medianPrice;
    }

    public long getTotalCount() {
        return totalCount;
    }
}
