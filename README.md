# 🏠 Property Insights Portal — Project 2

A multi-application property analytics portal.  
This project demonstrates a simple microservices architecture combining:

- **Task 1 ML API** — Dockerized FastAPI regression model  
- **Estimator API** — FastAPI backend that proxies to the Task 1 ML model  
- **Analysis API** — Java Spring Boot backend for market analytics  
- **Portal Frontend** — Next.js App Router frontend with two applications:
  - Property **Value Estimator**
  - Property **Market Analysis**

---

# 📁 Project Structure

```
property-portal/
├── estimator-api/        # FastAPI proxy backend → Task 1 ML API
├── analysis-api/         # Spring Boot backend for analytics + what-if + export
└── portal-frontend/      # Next.js App Router portal UI
```

---

# 🚀 How the System Works

## 1. Task 1 ML API (Dockerized FastAPI)
- Runs on `localhost:8000`  
- Loads the trained regression model + metadata  
- Supports:
  - `POST /predict` — single + batch predictions  
- All predictions in Project 2 flow through this container.

---

## 2. Estimator API (FastAPI Proxy)
- Endpoint:
  - `POST /predict` → forwards request to `http://localhost:8000/predict`
- Purpose:
  - Decouple frontend from ML container port  
  - Provide a clean backend-for-frontend
- Validates incoming data (server-side & client-side validation)
- Displays proper error messages

Workflow:

```
UI → estimator-api → Task 1 ML API (Docker)
```

---

## 3. Analysis API (Java Spring Boot)

### Features
- Initial dataset load into memory  
- Market summary (avg / min / max / median / count)  
- Grouped market statistics bar chart
- Cached with Spring `@Cacheable`  
- Filter segments (price, bedrooms, school rating)  
- What-if analysis → calls Task 1 ML API  
- CSV export  
- PDF stub export  
- CORS enabled for Next.js

### Endpoints
```
GET  /market/summary
GET  /market/avgPriceByBedrooms
GET  /market/segments
POST /market/what-if
GET  /market/export?type=csv
GET  /market/export?type=pdf
```

---

## 4. Portal Frontend (Next.js App Router)

### /estimator
- Uses **React Server Components** for initial data(features) loading
- Uses **Client Components** for interactive UI
- Implements **form validation**, **history**, **comparison**,
    **charts**
- Includes **custom hook** `useEstimatorHistory` for shared logic
- Loading and error boundaries included
- Form for property features  
- Calls estimator-api  
- Shows predicted price

### /analysis
- Server component loads summary + segments + grouped stats  
- Client component handles filters, what-if, export 
- Implements both client-side and backend input validation on what-if form
- Handles API call failures

---

# 🛠 How to Run

## 1. Start Task 1 ML API (Docker)

```
docker build -t housing-price-api .
docker run -p 8000:80 housing-price-api
```

---

## 2. Start Estimator API

```
cd estimator-api
uvicorn app.main:app --host 0.0.0.0 --port 9000
```

---

## 3. Start Analysis API

```
cd analysis-api
./mvnw spring-boot:run
```

---

## 4. Start Portal Frontend

```
cd portal-frontend
npm install
npm run dev
```

---

# 🧪 Quick Test Endpoints

## Estimator
```
Open:  
👉 http://localhost:3000/analysis
```

### Estimator
```
POST http://localhost:9000/predict
```

### Analysis
```
GET  http://localhost:8080/market/summary
GET  http://localhost:8080/market/segments
POST http://localhost:8080/market/what-if
GET  http://localhost:8080/market/export?type=pdf
```

---

# 🧩 Architecture Diagram

```
          ┌─────────────────┐
          │  Next.js (UI)   │
          └───────┬────────┘
                  │
   ┌──────────────┴──────────────┐
   │                              │
┌──▼───────────────┐     ┌────────▼─────────┐
│ estimator-api     │     │ analysis-api     │
│ FastAPI           │     │ Spring Boot      │
└───┬───────────────┘     └───────┬─────────┘
    │                             │
    │ HTTP proxy                  │ What-if:
    │                             │ calls ML container
┌───▼───────────────┐     ┌───────▼──────────┐
│ Task 1 ML API     │     │ housing.csv       │
│ Docker (FastAPI)  │     │ loaded in memory  │
└────────────────────┘     └──────────────────┘
```

---

# 💡 Notes

- All predictions flow through the Task 1 ML API  
- Estimator API is a backend-for-frontend  
- Analysis API demonstrates caching, data ingestion, what-if logic, PDF/CSV export  
- Next.js uses server components for initial data load  

---

## Architecture Decisions

### ✔ Backend Data Validation

Estimator API now validates required fields, numeric bounds, and
malformed input before calling ML container.
Analysis API validates input data of what-if prediction request and 
controller enforces validation.

### ✔ Client-Side Validation

EstimatorClient validates each field before submitting: 
- Required
- Ranges
- Type correctness
AnalysisCient validates input data type/range from what-if form.

### ✔ Server + Client Component Separation

-   `page.tsx` (server): fetches `/model-info` using RSC
-   `EstimatorClient.tsx` (client): handles UI, state, submission

### ✔ React Server Components for Initial Data Loading

`page.tsx` securely fetches model metadata:

``` ts
const res = await fetch("http://localhost:8000/model-info", { cache: "no-store" });
```

### ✔ Custom Hook for Shared Functionality

`useEstimatorHistory.ts` encapsulates: 
- LocalStorage persistence
- Add/clear history
- Comparison selection
- ChartData computation
