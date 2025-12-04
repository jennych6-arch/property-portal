package com.example.analysis_api.model;

public class PropertyRecord {
    private double price;
    private double squareFootage;
    private int bedrooms;
    private double bathrooms;
    private int yearBuilt;
    private double lotSize;
    private double distanceToCityCenter;
    private double schoolRating;

    public PropertyRecord(double price,
                          double squareFootage,
                          int bedrooms,
                          double bathrooms,
                          int yearBuilt,
                          double lotSize,
                          double distanceToCityCenter,
                          double schoolRating) {
        this.price = price;
        this.squareFootage = squareFootage;
        this.bedrooms = bedrooms;
        this.bathrooms = bathrooms;
        this.yearBuilt = yearBuilt;
        this.lotSize = lotSize;
        this.distanceToCityCenter = distanceToCityCenter;
        this.schoolRating = schoolRating;
    }

    public double getPrice() {
        return price;
    }

    public double getSquareFootage() {
        return squareFootage;
    }

    public int getBedrooms() {
        return bedrooms;
    }

    public double getBathrooms() {
        return bathrooms;
    }

    public int getYearBuilt() {
        return yearBuilt;
    }

    public double getLotSize() {
        return lotSize;
    }

    public double getDistanceToCityCenter() {
        return distanceToCityCenter;
    }

    public double getSchoolRating() {
        return schoolRating;
    }
}
