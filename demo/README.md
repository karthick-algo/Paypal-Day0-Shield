# Day-0 Shield | Demo Video & Walkthrough Suite

Official video demonstration and automated recording tools for **Day-0 Shield: Autonomous Merchant Risk Sentinel for PayPal**.

---

## Demonstration Video Specifications

| Specification | Value |
| :--- | :--- |
| **Video File** | [`Day0_Shield_Demo_Walkthrough.mp4`](Day0_Shield_Demo_Walkthrough.mp4) |
| **Duration** | **1 minute 34 seconds** (Strictly under the 3-minute hackathon limit) |
| **Video Format** | MP4 (H.264 video, High Profile, 1440 × 900, 25 fps, YUV420p) |
| **Audio** | Silent / Clean Screen Capture (Unencumbered walkthrough) |
| **File Size** | **8.48 MB** (Lightweight, universal playback, submission-ready) |
| **Platform Compatibility** | Native playback on YouTube, Vimeo, QuickTime, VLC, and all web browsers |

---

## Video Scene Breakdown & Narration Timeline

```
0:00 ─── 0:08  Scene 1: Secure Authentication & Role-Based Approver Gateway
0:08 ─── 0:22  Scene 2: Executive Project Brief & Technical Architecture Dossier
0:22 ─── 0:43  Scene 3: Real-Time Climate Sentinel & Delhi Heatwave Simulation
0:43 ─── 0:51  Scene 4: Multi-Merchant Portfolio Context Scoping
0:51 ─── 1:01  Scene 5: At-Risk Commercial Exposure & Route Inspection Drawer
1:01 ─── 1:11  Scene 6: Human-in-the-Loop Action Approvals & Policy Gate
1:11 ─── 1:23  Scene 7: Autonomous AI Sentinel & Execution Trace Monitoring
1:23 ─── 1:30  Scene 8: PayPal Dispute Defense Center & Evidence Dossier
1:30 ─── 1:34  Scene 9: Tamper-Evident Security Audit Ledger
```

### Detailed Chapter Breakdown

1. **Scene 1 (0:00 - 0:08) - Secure Authentication Gateway**
   - The operator authenticates via an Argon2id-secured credentials gateway with demo account (`admin` / `admin123`) holding `APPROVER` privileges.
2. **Scene 2 (0:08 - 0:22) - Executive Project Brief & Architecture Dossier**
   - Direct access to the in-app project dossier detailing the problem statement, affected merchants, and the dual-layer architecture.
3. **Scene 3 (0:22 - 0:43) - Real-Time Climate Sentinel & Live Simulation**
   - The primary command center displays real-time weather and logistics telemetry. A Delhi Heatwave scenario is activated, showing real-time projected orders at risk, involuntary churn, and financial loss avoidance.
4. **Scene 4 (0:43 - 0:51) - Multi-Merchant Portfolio Context Scoping**
   - The operator seamlessly scopes risk across distinct retail entities using the global merchant switcher.
5. **Scene 5 (0:51 - 1:01) - At-Risk Commercial Exposure & Route Inspection**
   - AG Grid table highlighting orders and recurring subscriptions caught in the disruption zone, with detailed customer drawer inspection.
6. **Scene 6 (1:01 - 1:11) - Human-in-the-Loop Action Approvals**
   - AI-recommended remediation proposals staged in a safe approval queue requiring human sign-off before dispatching PayPal API mutations.
7. **Scene 7 (1:11 - 1:23) - Autonomous AI Sentinel & Execution Traces**
   - Live execution graph visualizing the LangGraph multi-agent decision DAG, inspecting node-by-node token consumption, step latency, and read-only tool assertions.
8. **Scene 8 (1:23 - 1:30) - PayPal Dispute Defense Center**
   - Direct inspection of existing customer disputes ingested via PayPal's Dispute API (`GET /v1/customer/disputes`), complete with auto-generated evidence dossiers.
9. **Scene 9 (1:30 - 1:34) - Tamper-Evident Security Audit Ledger**
   - Comprehensive audit trail recording every state transition, user decision, IP address, and cryptographic UUID idempotency key.

---

## Re-Running the Automated Playwright Recording

The entire video walkthrough is 100% reproducible using the automated Playwright script:

```bash
# 1. Start local backend server (if re-recording)
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8080

# 2. Record raw demonstration walkthrough to demo/Day0_Shield_Demo_Walkthrough.mp4
python demo/record_demo.py
```
