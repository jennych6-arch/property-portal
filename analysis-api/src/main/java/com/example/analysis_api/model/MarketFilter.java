package com.example.analysis_api.model;

public class MarketFilter {

    private Double minPrice;
    private Double maxPrice;
    private Integer minBedrooms;
    private Integer maxBedrooms;
    private Double minSchoolRating;
    private Double maxSchoolRating;

    public MarketFilter() {}

    public MarketFilter(
            Double minPrice,
            Double maxPrice,
            Integer minBedrooms,
            Integer maxBedrooms,
            Double minSchoolRating,
            Double maxSchoolRating
    ) {
        this.minPrice = minPrice;
        this.maxPrice = maxPrice;
        this.minBedrooms = minBedrooms;
        this.maxBedrooms = maxBedrooms;
        this.minSchoolRating = minSchoolRating;
        this.maxSchoolRating = maxSchoolRating;
    }

    // Getters
    public Double getMinPrice() { return minPrice; }
    public Double getMaxPrice() { return maxPrice; }
    public Integer getMinBedrooms() { return minBedrooms; }
    public Integer getMaxBedrooms() { return maxBedrooms; }
    public Double getMinSchoolRating() { return minSchoolRating; }
    public Double getMaxSchoolRating() { return maxSchoolRating; }

    // Setters
    public void setMinPrice(Double minPrice) { this.minPrice = minPrice; }
    public void setMaxPrice(Double maxPrice) { this.maxPrice = maxPrice; }
    public void setMinBedrooms(Integer minBedrooms) { this.minBedrooms = minBedrooms; }
    public void setMaxBedrooms(Integer maxBedrooms) { this.maxBedrooms = maxBedrooms; }
    public void setMinSchoolRating(Double minSchoolRating) { this.minSchoolRating = minSchoolRating; }
    public void setMaxSchoolRating(Double maxSchoolRating) { this.maxSchoolRating = maxSchoolRating; }

    @Override
    public String toString() {
        return "MarketFilter{" +
                "minPrice=" + minPrice +
                ", maxPrice=" + maxPrice +
                ", minBedrooms=" + minBedrooms +
                ", maxBedrooms=" + maxBedrooms +
                ", minSchoolRating=" + minSchoolRating +
                ", maxSchoolRating=" + maxSchoolRating +
                '}';
    }
}
