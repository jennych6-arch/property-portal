package com.example.analysis_api.model;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public class WhatIfRequest {
    @Min(value = 100, message = "squareFootage must be >= 100")
    private double squareFootage;

    @Min(value = 0, message = "bedrooms must be >= 0")
    private int bedrooms;

    @Min(value = 0, message = "bathrooms must be >= 0")
    private double bathrooms;

    @Min(value = 1800, message = "yearBuilt must be >= 1800")
    private int yearBuilt;

    @Min(value = 0, message = "lotSize must be >= 0")
    private double lotSize;

    @Min(value = 0, message = "distanceToCityCenter must be >= 0")
    private double distanceToCityCenter;

    @Min(value = 0, message = "schoolRating must be between 0 and 10")
    @Max(value = 10, message = "schoolRating must be between 0 and 10")
    private double schoolRating;

    public WhatIfRequest() {}

    public WhatIfRequest(double squareFootage,
                        int bedrooms,
                        double bathrooms,
                        int yearBuilt,
                        double lotSize,
                        double distanceToCityCenter,
                        double schoolRating) {
        this.squareFootage = squareFootage;
        this.bedrooms = bedrooms;
        this.bathrooms = bathrooms;
        this.yearBuilt = yearBuilt;
        this.lotSize = lotSize;
        this.distanceToCityCenter = distanceToCityCenter;
        this.schoolRating = schoolRating;
    }

    public double getSquareFootage() {
        return squareFootage;
    }

    public void setSquareFootage(double squareFootage) {
        this.squareFootage = squareFootage;
    }

    public int getBedrooms() {
        return bedrooms;
    }

    public void setBedrooms(int bedrooms) {
        this.bedrooms = bedrooms;
    }

    public double getBathrooms() {
        return bathrooms;
    }

    public void setBathrooms(double bathrooms) {
        this.bathrooms = bathrooms;
    }

    public int getYearBuilt() {
        return yearBuilt;
    }

    public void setYearBuilt(int yearBuilt) {
        this.yearBuilt = yearBuilt;
    }

    public double getLotSize() {
        return lotSize;
    }

    public void setLotSize(double lotSize) {
        this.lotSize = lotSize;
    }

    public double getDistanceToCityCenter() {
        return distanceToCityCenter;
    }

    public void setDistanceToCityCenter(double distanceToCityCenter) {
        this.distanceToCityCenter = distanceToCityCenter;
    }

    public double getSchoolRating() {
        return schoolRating;
    }

    public void setSchoolRating(double schoolRating) {
        this.schoolRating = schoolRating;
    }
}
