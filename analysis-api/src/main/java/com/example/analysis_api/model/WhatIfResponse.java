package com.example.analysis_api.model;

public class WhatIfResponse {
    private double predictedPrice;
    private double marketAverage;
    private double differenceFromAverage;

    public WhatIfResponse(double predictedPrice, double marketAverage) {
        this.predictedPrice = predictedPrice;
        this.marketAverage = marketAverage;
        this.differenceFromAverage = predictedPrice - marketAverage;
    }

    public double getPredictedPrice() {
        return predictedPrice;
    }

    public double getMarketAverage() {
        return marketAverage;
    }

    public double getDifferenceFromAverage() {
        return differenceFromAverage;
    }
}
