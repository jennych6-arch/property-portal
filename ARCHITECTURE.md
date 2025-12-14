# Architecture Overview — Property Insights Portal (Project 2)

This document summarizes the overall system architecture for Project 2, covering cloud infrastructure, scaling and data considerations, and CI/CD + monitoring strategies.

---

## 1. Cloud Infrastructure

The system is composed of four independent services:

### **Task 1 ML API (FastAPI + Docker)**
- Loads a trained regression model (`model.joblib`) and metadata.
- Provides `/predict`, `/model-info`, and `/health` endpoints.
- Runs as a stateless container (e.g., Cloud Run, ECS, Kubernetes).

### **Estimator API (FastAPI)**
- Acts as a “backend-for-frontend.”
- Accepts requests from the frontend and forwards them to the Task 1 ML API.
- Provides a stable API boundary so the frontend does not directly depend on the ML container.

### **Analysis API (Spring Boot)**
- Loads the housing dataset (CSV) into memory on startup.
- Computes:
  - Market summary (avg, min, max, median)
  - Filtered property segments
  - What-if analysis (calls Task 1 ML API)
- Provides CSV and PDF export endpoints.
- Uses in-memory caching (`@Cacheable`) for summary and filtered segments.

### **Portal Frontend (Next.js App Router)**
- Two applications:
  - Property Value Estimator
  - Property Market Analysis
- Uses:
  - Server components for initial data load
  - Client components for interactivity
  - `loading.tsx` and `error.tsx` for UX and error boundaries
- Communicates only with the estimator-api and analysis-api, never directly with the ML container.

### Cloud Deployment Model

```
User Browser → Next.js Frontend → API Gateway → {Estimator API, Analysis API}
                                           ↘︎→ Task 1 ML API
```

All three backend services can run as separate stateless containers behind a shared HTTPS load balancer or API gateway.

The dataset and model artifacts can live in an object store (Cloud Storage / S3), loaded at container startup. Environment variables or a secrets manager provide configuration and keys.

---

## 2. Scaling and Data Strategy

### Stateless Services
All services are stateless:
- No session storage
- Requests can be routed to any instance
- Extremely easy to scale horizontally

### Caching
Analysis API uses Spring caching:
- `marketSummary` cached since it is aggregated and reused
- `segments` cached per filter combination
- `what-if` not cached (unique inputs + ML dependency)

Optional enhancements:
- API Gateway / CDN-level caching for repeated ML API requests
- Distributed caching if deployed at higher scale

### Data Storage
- Housing dataset: read-only CSV loaded into memory
- Model artifact: stored alongside ML API container
- Future features (saved sessions, predictions, favorites) could use a managed SQL DB

---

## 3. CI/CD and Monitoring

### Continuous Integration (CI)
On every push:
- Run Python tests for ML API + Estimator API
- Run Java tests for Analysis API
- Run TypeScript/Next.js lint + type checks
- Build Docker images (ML API + Analysis API)
- Optionally: preview deployments for frontend

### Continuous Delivery (CD)
On merge to `main`:
- Deploy new backend images to Cloud Run/ECS/Kubernetes
- Deploy updated Next.js frontend
- Load configuration through environment variables or Secrets Manager
- Apply rolling deployments to avoid downtime

### Monitoring & Observability
- Health endpoints for liveness/readiness checks
- Centralized request/error logs
- Metrics for latency, throughput, and error rates
- Frontend + backend error tracking (e.g., Sentry)
- Grafana dashboard for ML latency and request patterns

---

## Architecture Diagram (Text)

```
          ┌────────────────────────┐
          │     Next.js Frontend   │
          │  /estimator /analysis  │
          └───────────▲────────────┘
                      │
                      │ HTTP
                      │
      ┌───────────────┴──────────────────┐
      │                                    │
┌─────▼──────────────┐          ┌─────────▼──────────┐
│  Estimator API      │          │  Analysis API       │
│  FastAPI (Task 2)   │          │  Spring Boot        │
└──────────┬──────────┘          └──────────┬──────────┘
           │                                 │
           │ Proxies to ML API               │ Calls ML API for what-if
           │                                 │ Reads housing CSV
┌──────────▼──────────────┐    ┌────────────▼─────────────┐
│   Task 1 ML API          │    │    Housing Dataset CSV    │
│   FastAPI + Docker       │    │   Loaded into memory      │
└──────────────────────────┘    └───────────────────────────┘
```

---

## Summary

This architecture demonstrates:
- Clean service separation
- Stateless, horizontally scalable backends
- Integration of ML with Java + Python services
- Cloud-native deployment principles
- Extendability for future enhancements

Perfect for a simple, production-ready microservice demonstration.

