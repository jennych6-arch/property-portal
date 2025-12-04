package com.example.analysis_api.model;

public class WhatIfRequest {
    private double squareFootage;
    private int bedrooms;
    private double bathrooms;
    private int yearBuilt;
    private double lotSize;
    private double distanceToCityCenter;
    private int schoolRating;

    public double getSquareFootage() { return squareFootage; }
    public void setSquareFootage(double squareFootage) { this.squareFootage = squareFootage; }

    public int getBedrooms() { return bedrooms; }
    public void setBedrooms(int bedrooms) { this.bedrooms = bedrooms; }

    public double getBathrooms() { return bathrooms; }
    public void setBathrooms(double bathrooms) { this.bathrooms = bathrooms; }

    public int getYearBuilt() { return yearBuilt; }
    public void setYearBuilt(int yearBuilt) { this.yearBuilt = yearBuilt; }

    public double getLotSize() { return lotSize; }
    public void setLotSize(double lotSize) { this.lotSize = lotSize; }

    public double getDistanceToCityCenter() { return distanceToCityCenter; }
    public void setDistanceToCityCenter(double distanceToCityCenter) { this.distanceToCityCenter = distanceToCityCenter; }

    public int getSchoolRating() { return schoolRating; }
    public void setSchoolRating(int schoolRating) { this.schoolRating = schoolRating; }
}
