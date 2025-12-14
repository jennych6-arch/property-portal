package com.example.analysis_api.model;

public class GroupedStatistics {

    // label for the group, e.g. "1", "2", "3" bedrooms, or "Low", "Medium"
    private String label;

    // how many properties fall into this group
    private long count;

    // average price for this group
    private double averagePrice;

    public GroupedStatistics() {
    }

    public GroupedStatistics(String label, long count, double averagePrice) {
        this.label = label;
        this.count = count;
        this.averagePrice = averagePrice;
    }

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public long getCount() {
        return count;
    }

    public void setCount(long count) {
        this.count = count;
    }

    public double getAveragePrice() {
        return averagePrice;
    }

    public void setAveragePrice(double averagePrice) {
        this.averagePrice = averagePrice;
    }
}
