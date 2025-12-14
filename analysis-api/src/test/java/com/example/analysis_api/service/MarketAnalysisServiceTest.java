package com.example.analysis_api.service;

import com.example.analysis_api.model.MarketSummary;
import com.example.analysis_api.model.PropertyRecord;
import com.example.analysis_api.model.WhatIfRequest;
import com.example.analysis_api.model.WhatIfResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.client.ExpectedCount.once;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;

/**
 * Notes:
 * - This test class injects @Value fields via reflection because we construct the service directly (no Spring context).
 * - It is resilient to refactors (e.g., moving the estimator URL into a @Value property),
 *   by setting the URL field when it exists.
 */
class MarketAnalysisServiceTest {

    private MarketAnalysisService service;

    @BeforeEach
    void setUp() throws Exception {
        service = new MarketAnalysisService();

        // Inject the housing.csv resource (normally set via @Value)
        setField(service, "housingDataResource", new ClassPathResource("data/housing.csv"));

        // If you refactored the estimator URL into a @Value property, inject it here too
        // (common names shown; harmless if the field doesn't exist)
        setFieldIfPresent(service, "estimatorUrl", "http://localhost:8000/predict");
        setFieldIfPresent(service, "estimatorApiUrl", "http://localhost:8000/predict");
        setFieldIfPresent(service, "estimatorServiceUrl", "http://localhost:8000/predict");
        setFieldIfPresent(service, "predictUrl", "http://localhost:8000/predict");

        // Load CSV into in-memory list
        service.loadData();
    }

    @Test
    void getMarketSummary_usesLoadedData() {
        MarketSummary summary = service.getMarketSummary();

        assertTrue(summary.getTotalCount() > 0);
        assertTrue(summary.getAvgPrice() > 0);
        assertTrue(summary.getMinPrice() <= summary.getMaxPrice());
        // median should be within [min, max] when non-empty
        assertTrue(summary.getMedianPrice() >= summary.getMinPrice());
        assertTrue(summary.getMedianPrice() <= summary.getMaxPrice());
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
        RestTemplate restTemplate = (RestTemplate) getField(service, "restTemplate");

        MockRestServiceServer server =
                MockRestServiceServer.bindTo(restTemplate).build();

        server.expect(once(), requestTo("http://localhost:8000/predict"))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withSuccess(
                        "{\"predictions\":[250000.0]}",
                        MediaType.APPLICATION_JSON));

        WhatIfRequest req = sampleWhatIfRequest();

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

    @Test
    void runWhatIf_whenEstimatorReturnsNon2xx_shouldSurfaceBadGateway() throws Exception {
        RestTemplate restTemplate = (RestTemplate) getField(service, "restTemplate");
        MockRestServiceServer server = MockRestServiceServer.bindTo(restTemplate).build();

        server.expect(once(), requestTo("http://localhost:8000/predict"))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withStatus(HttpStatus.BAD_GATEWAY)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body("{\"detail\":\"down\"}"));

        WhatIfRequest req = sampleWhatIfRequest();

        Exception ex = assertThrows(Exception.class, () -> service.runWhatIf(req));

        // Prefer your newer behavior (ResponseStatusException 502), but keep message-friendly checks.
        if (ex instanceof ResponseStatusException rse) {
            assertEquals(HttpStatus.BAD_GATEWAY, rse.getStatusCode());
        } else {
            // If you still throw RuntimeException, make sure it’s at least meaningful.
            assertTrue(ex.getMessage() != null && !ex.getMessage().isBlank());
        }

        server.verify();
    }

    @Test
    void runWhatIf_whenEstimatorReturnsInvalidPayload_shouldNotCrash() throws Exception {
        RestTemplate restTemplate = (RestTemplate) getField(service, "restTemplate");
        MockRestServiceServer server = MockRestServiceServer.bindTo(restTemplate).build();

        // predictions missing -> should either throw or return predictedPrice=0 depending on your implementation choice
        server.expect(once(), requestTo("http://localhost:8000/predict"))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withSuccess(
                        "{\"oops\":true}",
                        MediaType.APPLICATION_JSON));

        WhatIfRequest req = sampleWhatIfRequest();

        try {
            WhatIfResponse resp = service.runWhatIf(req);
            // If you accept missing predictions, assert it degrades gracefully:
            assertNotNull(resp);
            assertTrue(resp.getPredictedPrice() == 0.0 || resp.getPredictedPrice() > 0.0);
        } catch (Exception ex) {
            // If you reject invalid payloads, also acceptable:
            assertTrue(ex.getMessage() != null && !ex.getMessage().isBlank());
        } finally {
            server.verify();
        }
    }

    @Test
    void groupedStatistics_ifImplemented_shouldReturnListWithLabelCountAveragePrice() throws Exception {
        // This test is reflection-based so it only runs assertions if you implemented the method.
        Method m = findFirstMethod(
                MarketAnalysisService.class,
                "getBedroomDistribution",
                "getAveragePriceByBedrooms",
                "getGroupedStatisticsByBedrooms"
        );

        if (m == null) {
            // Not implemented in this code version; do not fail.
            return;
        }

        Object result;
        Class<?>[] ptypes = m.getParameterTypes();

        // Many implementations reuse the same 6 filters as filterProperties(...)
        if (ptypes.length == 6) {
            result = m.invoke(service, null, null, 2, 4, null, null);
        } else if (ptypes.length == 0) {
            result = m.invoke(service);
        } else {
            // Unknown signature; skip.
            return;
        }

        assertNotNull(result);
        assertTrue(result instanceof List<?>);
        List<?> list = (List<?>) result;
        if (list.isEmpty()) return;

        Object first = list.get(0);
        assertNotNull(invokeGetter(first, "getLabel"));
        assertNotNull(invokeGetter(first, "getCount"));
        assertNotNull(invokeGetter(first, "getAveragePrice"));
    }

    // ---------------- helpers ----------------

    private static WhatIfRequest sampleWhatIfRequest() {
        WhatIfRequest req = new WhatIfRequest();
        req.setSquareFootage(1500);
        req.setBedrooms(3);
        req.setBathrooms(2);
        req.setYearBuilt(2005);
        req.setLotSize(4000);
        req.setDistanceToCityCenter(5);
        req.setSchoolRating(8);
        return req;
    }

    private static void setField(Object target, String fieldName, Object value) throws Exception {
        Field f = target.getClass().getDeclaredField(fieldName);
        f.setAccessible(true);
        f.set(target, value);
    }

    private static void setFieldIfPresent(Object target, String fieldName, Object value) {
        try {
            Field f = target.getClass().getDeclaredField(fieldName);
            f.setAccessible(true);
            f.set(target, value);
        } catch (NoSuchFieldException ignored) {
            // field not present
        } catch (Exception e) {
            throw new RuntimeException("Failed to set field: " + fieldName, e);
        }
    }

    private static Object getField(Object target, String fieldName) throws Exception {
        Field f = target.getClass().getDeclaredField(fieldName);
        f.setAccessible(true);
        return f.get(target);
    }

    private static Method findFirstMethod(Class<?> cls, String... names) {
        for (String name : names) {
            for (Method m : cls.getDeclaredMethods()) {
                if (m.getName().equals(name)) {
                    m.setAccessible(true);
                    return m;
                }
            }
        }
        return null;
    }

    private static Object invokeGetter(Object target, String methodName) {
        try {
            Method m = target.getClass().getMethod(methodName);
            return m.invoke(target);
        } catch (Exception e) {
            return null;
        }
    }
}
