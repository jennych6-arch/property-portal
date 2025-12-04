package com.example.analysis_api.service;

import com.example.analysis_api.model.MarketSummary;
import com.example.analysis_api.model.PropertyRecord;
import com.example.analysis_api.model.WhatIfRequest;
import com.example.analysis_api.model.WhatIfResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestTemplate;

import java.lang.reflect.Field;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.client.ExpectedCount.once;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class MarketAnalysisServiceTest {

    private MarketAnalysisService service;

    @BeforeEach
    void setUp() throws Exception {
        service = new MarketAnalysisService();

        // Inject the housing.csv resource (normally set via @Value)
        Field resourceField =
                MarketAnalysisService.class.getDeclaredField("housingDataResource");
        resourceField.setAccessible(true);
        resourceField.set(service, new ClassPathResource("data/housing.csv"));

        // Load CSV into in-memory list
        service.loadData();
    }

    @Test
    void getMarketSummary_usesLoadedData() {
        MarketSummary summary = service.getMarketSummary();

        assertTrue(summary.getTotalCount() > 0);
        assertTrue(summary.getAvgPrice() > 0);
        assertTrue(summary.getMinPrice() <= summary.getMaxPrice());
    }

    @Test
    void filterProperties_appliesMinBedroomsFilter() {
        List<PropertyRecord> result =
                service.filterProperties(null, null, 3, null, null, null);

        assertFalse(result.isEmpty());
        assertTrue(result.stream().allMatch(p -> p.getBedrooms() >= 3));
    }

    @Test
    void runWhatIf_callsEstimatorAndBuildsResponse() throws Exception {
        // Get the private RestTemplate instance from the service
        Field rtField =
                MarketAnalysisService.class.getDeclaredField("restTemplate");
        rtField.setAccessible(true);
        RestTemplate restTemplate = (RestTemplate) rtField.get(service);

        // Mock the HTTP call to the FastAPI /predict endpoint
        MockRestServiceServer server =
                MockRestServiceServer.bindTo(restTemplate).build();

        server.expect(once(), requestTo("http://localhost:8000/predict"))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withSuccess(
                        "{\"predictions\":[250000.0]}",
                        MediaType.APPLICATION_JSON));

        // Build a sample request
        WhatIfRequest req = new WhatIfRequest();
        req.setSquareFootage(1500);
        req.setBedrooms(3);
        req.setBathrooms(2);
        req.setYearBuilt(2005);
        req.setLotSize(4000);
        req.setDistanceToCityCenter(5);
        req.setSchoolRating(8);

        WhatIfResponse resp = service.runWhatIf(req);

        assertEquals(250000.0, resp.getPredictedPrice(), 0.001);
        assertNotEquals(0.0, resp.getMarketAverage(), 0.001);
        assertEquals(
                resp.getPredictedPrice() - resp.getMarketAverage(),
                resp.getDifferenceFromAverage(),
                0.0001
        );

        server.verify();
    }
}
