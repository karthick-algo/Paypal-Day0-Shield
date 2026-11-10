# Day-0 Shield | Documentation Suite

Comprehensive technical, architecture, and API documentation for **Day-0 Shield: Autonomous Merchant Risk Sentinel for PayPal**.

---

## Core Documentation Deliverables

| Document | Format | Description |
| :--- | :---: | :--- |
| [**Technical Dossier & PayPal API Integration Manual**](Day0_Shield_Technical_Dossier_PayPal_Integration.pdf) | **PDF (5 Pages, Print-Ready)** | Exhaustive technical dossier covering system architecture, mathematical risk formulas, and code-level mapping for all integrated PayPal REST endpoints. |
| [**Operations & Production Runbook**](RUNBOOK.md) | **Markdown** | Standard operating procedures, deployment commands, credential rotation (Argon2id, PayPal Sandbox, Secret Keys), and database administration. |
| [**Workflow Walkthrough Dossier**](Day0_Shield_Workflow_Walkthrough.pdf) | **PDF (Landscape A4)** | Comprehensive visual walkthrough capturing every stage of the live application flow with step-by-step scene analysis for human judges and Google NotebookLM. |

---

## Technical Dossier Summary (`Day0_Shield_Technical_Dossier_PayPal_Integration.pdf`)

The technical dossier is structured into five comprehensive chapters designed for technical judges, enterprise security auditors, and PayPal platform architects:

### Page 1: Executive Brief & Target Audience
- **Problem Statement:** How natural disasters, logistics blockades, and climate disruptions cause cascading shipping delays and unfulfillable subscriptions, driving spikes in chargebacks and merchant account holds.
- **Target Audience:** Cross-border e-commerce merchants, high-volume recurring subscription businesses, and multi-warehouse retailers using PayPal.
- **System Architecture:** Visual component layout spanning FastAPI backend, SQLite WAL storage, React + Ant Design frontend, and PayPal REST sandbox services.

### Page 2: Risk Modeling & Analytical Formulations
- **Compound Exposure Risk Index (CERI):**
  ```math
  \mathrm{CERI} = (w_1 \cdot S_{\mathrm{disruption}}) + (w_2 \cdot T_{\mathrm{shipping}}) + (w_3 \cdot V_{\mathrm{customer}}) + (w_4 \cdot C_{\mathrm{chargeback}})
  ```
- **Monte Carlo Churn Simulation:** 1,000-iteration probability estimation of merchant reserves and chargeback ratios before and after proactive intervention.
- **Tiered Severity Classification:** Low (Informational alerts), Medium (Fulfillment extensions), and High (Immediate subscription pauses & proactive outreach).

### Page 3: Code-Level PayPal Integration Matrix
Exhaustive reference linking system components to their exact backend source code locations:
- **Dispute Ingestion:** `backend/app/paypal/raw_client.py` -> `GET /v1/customer/disputes`
- **Dispute Evidence Submission:** `backend/app/paypal/raw_client.py` -> `POST /v1/customer/disputes/{id}/provide-evidence`
- **Subscription Pausing:** `backend/app/paypal/raw_client.py` -> `POST /v1/billing/subscriptions/{id}/suspend`
- **Subscription Resumption:** `backend/app/paypal/raw_client.py` -> `POST /v1/billing/subscriptions/{id}/activate`
- **Order Tracking Updates:** `backend/app/paypal/raw_client.py` -> `POST /v2/checkout/orders/{id}/track`
- **Webhook Ingestion:** `backend/app/routes/webhooks.py` -> `POST /api/webhooks/paypal`
- **PayPal Seller Protection RAG:** `backend/app/routes/rag.py` -> `GET /api/rag/query`, `POST /api/rag/ingest`
- **Worldwide Open-Meteo Corridors:** `backend/app/routes/hazard.py` -> `GET /api/hazards/weather-live` (15 global hubs across Americas, EMEA, APAC, South Asia)
- **Live Agent Telemetry:** `backend/app/routes/langchain_monitor.py` -> `GET /api/agents/live-status`
- **OAuth2 Token Lifecycle:** In-memory caching with 60-second safety buffer in `backend/app/paypal/raw_client.py`.

### Page 4: Autonomous Workflow Lifecycle
- **Step 1: Ingestion & Telemetry:** Real-time multi-hub Open-Meteo weather feeds across 15 worldwide trade hubs in a single scrollable row.
- **Step 2: Risk Scoring:** Real-time computation of affected orders and pending recurring payments.
- **Step 3: Policy-Gated Staging:** Automated proposal creation in the Action Approvals queue with RAG grounding.
- **Step 4: Human-in-the-Loop Sign-off:** Interactive approval modal with mandatory audit trails.
- **Step 5: PayPal API Execution:** Idempotent REST calls signed with UUID `PayPal-Request-Id` headers.
- **Step 6: Reconciliation:** Webhook confirmation and irreversible audit recording.

### Page 5: Security, Compliance & Safeguards
- **Guardrails AI:** 5-layer security enforcing prompt injection defense, PII token masking, probability boundary clamps, and read-only tool sandboxing.
- **Authentication:** Argon2id password hashing (`argon2-cffi`) with memory cost 65,536 KiB.
- **Session Security:** Cryptographically signed HMAC-SHA256 session cookies (`HttpOnly`, `SameSite=Lax`).
- **CSRF Defense:** Mandatory `X-CSRF-Token` headers on all mutating endpoints.
- **Circuit Breakers:** Hard maximum cap of 200 write operations per 24-hour UTC window.
- **Read-Only Verification:** `assert_read_only_tools()` enforcing read isolation for autonomous analytical agents.

---

## Chapter 6: Future Architecture & Enterprise Roadmap

Day-0 Shield is designed to scale from merchant-level risk sentinel to global autonomous commerce infrastructure:

1. **Autonomous Dynamic Multi-Carrier Rerouting:**
   - Fallback negotiation with secondary/tertiary freight carriers (DHL Express, FedEx Cross-Border, Maersk Line, Nippon Express) when corridor risk threshold exceeds P(dispute) > 0.70.
   - Dynamic label reassignment and PayPal Tracking API carrier synchronization prior to physical parcel dispatch.

2. **Cross-Border Multi-Currency FX Volatility & Dynamic Escrow Hedging:**
   - Synthetic currency hedging and dynamic settlement reserve buffers across USD, EUR, GBP, SGD, JPY, AED, INR during extended corridor freezes (>14 days).
   - Automated spot refund compliance protecting merchant margins against exchange rate fluctuations.

3. **Automated Customs & Border Protection (CBP) / Harmonized System (HS) Code EDI Ingestion:**
   - Real-time EDIFACT / ANSI X12 ingestion from US CBP ACE, EU TARIC, and UN ASYCUDA systems.
   - Pre-emptive detection of tariff queries, customs holds, and phytosanitary inspections before international carrier handoff.

4. **IoT Real-Time Cold-Chain & Shock Sensor Telemetry:**
   - LoRaWAN and 5G cellular GPS/temperature sensor ingestion for perishable goods and high-value semiconductor cargo.
   - Automated evidence compilation for Significantly Not As Described (SNAD) damaged disputes.

5. **Zero-Knowledge Dispute Proofs (zk-SNARKs):**
   - Cryptographic proofs validating carrier physical custody and delivery without exposing customer residential PII.
   - Direct verification on PayPal settlement rail for instant zero-touch dispute defense.

6. **Agent-to-Agent Federated Learning & Decentralized Fraud Graph:**
   - Privacy-preserving cross-merchant threat intelligence sharing.
   - Dynamic model training on emerging global corridor fraud rings without centralizing raw merchant transactions.
