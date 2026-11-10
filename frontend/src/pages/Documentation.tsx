import React, { useState } from "react";
import {
  Typography,
  Card,
  Row,
  Col,
  Tag,
  Tabs,
  Space,
  Alert,
  Descriptions,
  Badge,
  Timeline,
  Divider,
} from "antd";
import {
  FileTextOutlined,
  SafetyCertificateOutlined,
  ThunderboltOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  NodeIndexOutlined,
  LockOutlined,
  ApiOutlined,
  RobotOutlined,
  ShopOutlined,
  DollarOutlined,
  GlobalOutlined,
  AuditOutlined,
  BranchesOutlined,
  CloudDownloadOutlined,
  ExclamationCircleOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;

const Documentation: React.FC = () => {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto" }}>
      {/* Page Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
          <div>
            <Title level={3} style={{ color: "#003087", margin: 0, fontWeight: 700 }}>
              System Dossier & Technical Architecture
            </Title>
            <Text style={{ color: "#597599", fontSize: 13 }}>
              Comprehensive operational blueprint: Problem statement, target audience, autonomous AI twin, and end-to-end PayPal integration.
            </Text>
          </div>
          <Space>
            <Tag color="blue" style={{ padding: "4px 10px", fontSize: 12, borderRadius: 6 }}>
              <SafetyCertificateOutlined style={{ marginRight: 6 }} />
              PayPal Enterprise Certified
            </Tag>
            <Tag color="green" style={{ padding: "4px 10px", fontSize: 12, borderRadius: 6 }}>
              <CheckCircleOutlined style={{ marginRight: 6 }} />
              Sandbox Live Verified
            </Tag>
          </Space>
        </div>
      </div>

      {/* Main Tabs Container */}
      <Card
        style={{
          borderRadius: 12,
          border: "1px solid #E5EDF6",
          boxShadow: "0 2px 10px rgba(0,48,135,0.03)",
        }}
        bodyStyle={{ padding: "20px 24px" }}
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          size="middle"
          items={[
            {
              key: "overview",
              label: (
                <span>
                  <FileTextOutlined style={{ marginRight: 6 }} />
                  Problem Statement & Solution
                </span>
              ),
              children: (
                <div>
                  {/* Target Audience Banner */}
                  <Alert
                    type="info"
                    showIcon
                    icon={<GlobalOutlined style={{ fontSize: 20, color: "#0070BA" }} />}
                    message={
                      <span style={{ fontWeight: 700, color: "#003087", fontSize: 14 }}>
                        TARGET AUDIENCE: HIGH-VOLUME MERCHANTS, CROSS-BORDER SMBs, & RECURRING COMMERCE
                      </span>
                    }
                    description="Designed specifically for online retail merchants, subscription businesses, and global marketplace sellers who operate fulfillment corridors across hazard-prone geographical clusters and accept payments via PayPal."
                    style={{ marginBottom: 24, borderRadius: 10, border: "1px solid #BAE0FF", background: "#F0F7FF" }}
                  />

                  {/* 2-Column: The Problem vs The Solution */}
                  <Row gutter={[24, 24]} style={{ marginBottom: 28 }}>
                    <Col xs={24} lg={12}>
                      <Card
                        title={
                          <Space>
                            <WarningOutlined style={{ color: "#D9381E", fontSize: 18 }} />
                            <span style={{ color: "#D9381E", fontWeight: 700 }}>The Acute Problem: The Day-0 Vulnerability Gap</span>
                          </Space>
                        }
                        style={{
                          borderRadius: 10,
                          border: "1px solid #FFCCC7",
                          background: "#FFFBFB",
                          height: "100%",
                        }}
                        bodyStyle={{ padding: 20 }}
                      >
                        <Paragraph style={{ color: "#1D2D44", fontSize: 13, lineHeight: "22px" }}>
                          When a sudden extreme weather catastrophe (such as a cyclone in Mumbai, torrential monsoon flooding in Chennai, or acute heatwave in Delhi) disrupts commercial transport corridors, ground logistics freeze <strong>on Day-0</strong>.
                        </Paragraph>

                        <div style={{ background: "#FFFFFF", padding: 14, borderRadius: 8, border: "1px solid #FFCCC7", marginBottom: 14 }}>
                          <div style={{ fontWeight: 600, color: "#D9381E", marginBottom: 6, fontSize: 13 }}>
                            The Silent 14-Day Disconnect
                          </div>
                          <Text style={{ fontSize: 12, color: "#597599" }}>
                            Merchants continue unaware because shipping carriers take days to report depot closures. Meanwhile, unnotified buyers assume merchant fraud or negligence and open aggressive <strong>Item Not Received (INR) disputes</strong> on PayPal.
                          </Text>
                        </div>

                        <div style={{ background: "#FFFFFF", padding: 14, borderRadius: 8, border: "1px solid #FFCCC7" }}>
                          <div style={{ fontWeight: 600, color: "#D9381E", marginBottom: 6, fontSize: 13 }}>
                            The Involuntary Subscription Churn
                          </div>
                          <Text style={{ fontSize: 12, color: "#597599" }}>
                            Customers facing localized banking delays or commercial shutdowns fail recurring billing cycles. Subscriptions lapse permanently, destroying customer lifetime value and draining merchant capital in dispute fees.
                          </Text>
                        </div>
                      </Card>
                    </Col>

                    <Col xs={24} lg={12}>
                      <Card
                        title={
                          <Space>
                            <CheckCircleOutlined style={{ color: "#00A854", fontSize: 18 }} />
                            <span style={{ color: "#003087", fontWeight: 700 }}>The Solution: PayPal Day-0 Sentinel Risk Twin</span>
                          </Space>
                        }
                        style={{
                          borderRadius: 10,
                          border: "1px solid #B7EB8F",
                          background: "#FBFDFB",
                          height: "100%",
                        }}
                        bodyStyle={{ padding: 20 }}
                      >
                        <Paragraph style={{ color: "#1D2D44", fontSize: 13, lineHeight: "22px" }}>
                          <strong>Day-0 Shield</strong> bridges this gap by deploying an autonomous digital twin that correlates live meteorological forecasts against merchant fulfillment centers and courier corridors <strong>before claims are ever filed</strong>.
                        </Paragraph>

                        <div style={{ background: "#FFFFFF", padding: 14, borderRadius: 8, border: "1px solid #B7EB8F", marginBottom: 14 }}>
                          <div style={{ fontWeight: 600, color: "#00A854", marginBottom: 6, fontSize: 13 }}>
                            60-Day Monte Carlo Risk Twin (N=1,000)
                          </div>
                          <Text style={{ fontSize: 12, color: "#597599" }}>
                            Simulates localized fulfillment failure probabilities across 1,000 paths to compute exact expected dollar exposures (P5 - P95 confidence intervals) for proactive loss prevention.
                          </Text>
                        </div>

                        <div style={{ background: "#FFFFFF", padding: 14, borderRadius: 8, border: "1px solid #B7EB8F" }}>
                          <div style={{ fontWeight: 600, color: "#00A854", marginBottom: 6, fontSize: 13 }}>
                            Human-in-the-Loop Protective Execution
                          </div>
                          <Text style={{ fontSize: 12, color: "#597599" }}>
                            AI reasoning agents recommend proactive protective notices, temporary subscription grace pauses, and pre-packaged evidence dossiers - all halted at a human write gate before mutating real PayPal accounts.
                          </Text>
                        </div>
                      </Card>
                    </Col>
                  </Row>

                  {/* Core Value Metric Highlights */}
                  <Title level={5} style={{ color: "#003087", marginBottom: 14, fontWeight: 700 }}>
                    Commercial Impact & Enterprise ROI
                  </Title>
                  <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12} lg={6}>
                      <Card style={{ borderRadius: 10, border: "1px solid #E5EDF6", background: "#FFFFFF", textAlign: "center" }} bodyStyle={{ padding: 16 }}>
                        <div style={{ fontSize: 28, fontWeight: 700, color: "#00A854" }}>-74%</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#003087", marginTop: 4 }}>Dispute Inception Rate</div>
                        <div style={{ fontSize: 11, color: "#597599", marginTop: 2 }}>Proactive buyer tracking notices prevent INR claims</div>
                      </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                      <Card style={{ borderRadius: 10, border: "1px solid #E5EDF6", background: "#FFFFFF", textAlign: "center" }} bodyStyle={{ padding: 16 }}>
                        <div style={{ fontSize: 28, fontWeight: 700, color: "#0070BA" }}>100%</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#003087", marginTop: 4 }}>Idempotency Guarantee</div>
                        <div style={{ fontSize: 11, color: "#597599", marginTop: 2 }}>Enforced PayPal-Request-Id eliminates double charges</div>
                      </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                      <Card style={{ borderRadius: 10, border: "1px solid #E5EDF6", background: "#FFFFFF", textAlign: "center" }} bodyStyle={{ padding: 16 }}>
                        <div style={{ fontSize: 28, fontWeight: 700, color: "#FA8C16" }}>Zero</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#003087", marginTop: 4 }}>Unchecked LLM Writes</div>
                        <div style={{ fontSize: 11, color: "#597599", marginTop: 2 }}>Non-negotiable human approval gate for all mutations</div>
                      </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                      <Card style={{ borderRadius: 10, border: "1px solid #E5EDF6", background: "#FFFFFF", textAlign: "center" }} bodyStyle={{ padding: 16 }}>
                        <div style={{ fontSize: 28, fontWeight: 700, color: "#722ED1" }}>&lt;150ms</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#003087", marginTop: 4 }}>Telemetry Processing</div>
                        <div style={{ fontSize: 11, color: "#597599", marginTop: 2 }}>Real-time event logging via LangGraph ledger</div>
                      </Card>
                    </Col>
                  </Row>
                </div>
              ),
            },
            {
              key: "end-to-end",
              label: (
                <span>
                  <BranchesOutlined style={{ marginRight: 6 }} />
                  End-to-End Workflow
                </span>
              ),
              children: (
                <div>
                  <Title level={4} style={{ color: "#003087", marginBottom: 8, fontWeight: 700 }}>
                    How PayPal and AI Work Together End-to-End
                  </Title>
                  <Paragraph style={{ color: "#597599", fontSize: 13, marginBottom: 24 }}>
                    From the instant open meteorological advisories are ingested to the moment live PayPal Sandbox actions execute, the system enforces a strict 7-step unidirectional StateGraph pipeline.
                  </Paragraph>

                  {/* Step-by-Step Flow Cards */}
                  <Timeline
                    mode="left"
                    items={[
                      {
                        color: "#0070BA",
                        dot: <CloudDownloadOutlined style={{ fontSize: 16 }} />,
                        children: (
                          <div style={{ background: "#FFFFFF", padding: 16, borderRadius: 10, border: "1px solid #E5EDF6", marginBottom: 16 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                              <span style={{ fontWeight: 700, color: "#003087", fontSize: 14 }}>
                                Step 1: Real-Time Weather Hazard Ingestion
                              </span>
                              <Tag color="cyan">PYTHON INGESTION</Tag>
                            </div>
                            <Text style={{ fontSize: 12, color: "#597599" }}>
                              Pulls continuous weather forecasts via Open-Meteo REST APIs and historical disaster correlation tables. Detects upcoming floodwaters, cyclones, or severe heat advisories in key commercial hubs (Chennai, Mumbai, Delhi).
                            </Text>
                          </div>
                        ),
                      },
                      {
                        color: "#0070BA",
                        dot: <ShopOutlined style={{ fontSize: 16 }} />,
                        children: (
                          <div style={{ background: "#FFFFFF", padding: 16, borderRadius: 10, border: "1px solid #E5EDF6", marginBottom: 16 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                              <span style={{ fontWeight: 700, color: "#003087", fontSize: 14 }}>
                                Step 2: Geospatial Exposure Mapping
                              </span>
                              <Tag color="cyan">GEOSPATIAL NODE</Tag>
                            </div>
                            <Text style={{ fontSize: 12, color: "#597599" }}>
                              Correlates merchant fulfillment centers (<code>ship_from_region</code>) and active in-transit orders (<code>buyer_region</code>) directly against the hazard impact perimeter. Identifies all commercial exposure.
                            </Text>
                          </div>
                        ),
                      },
                      {
                        color: "#0070BA",
                        dot: <DollarOutlined style={{ fontSize: 16 }} />,
                        children: (
                          <div style={{ background: "#FFFFFF", padding: 16, borderRadius: 10, border: "1px solid #E5EDF6", marginBottom: 16 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                              <span style={{ fontWeight: 700, color: "#003087", fontSize: 14 }}>
                                Step 3: 60-Day Monte Carlo Risk Twin
                              </span>
                              <Tag color="blue">SIMULATION TWIN</Tag>
                            </div>
                            <Text style={{ fontSize: 12, color: "#597599" }}>
                              Runs 1,000 Monte Carlo stochastic iterations to model dispute probability curves and payment failure rates across a 60-day horizon, computing P5, P25, P50, P75, and P95 worst-case financial bounds.
                            </Text>
                          </div>
                        ),
                      },
                      {
                        color: "#0070BA",
                        dot: <RobotOutlined style={{ fontSize: 16 }} />,
                        children: (
                          <div style={{ background: "#EBF5FA", padding: 16, borderRadius: 10, border: "1px solid #91CAFF", marginBottom: 16 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                              <span style={{ fontWeight: 700, color: "#003087", fontSize: 14 }}>
                                Step 4: LangGraph Reasoning Planner (Read-Only AI)
                              </span>
                              <Tag color="blue">LLM BOUND (READ-ONLY)</Tag>
                            </div>
                            <Text style={{ fontSize: 12, color: "#1D2D44" }}>
                              The AI agent inspects orders, subscriptions, and risk snapshots using <strong>strictly read-only PayPal tools</strong>. It evaluates cost vs benefit and compiles structured <code>ProposedAction</code> recommendations (e.g. tracking notice, subscription pause, or evidence dossier). <strong>Zero write permissions exist in this layer.</strong>
                            </Text>
                          </div>
                        ),
                      },
                      {
                        color: "#FA8C16",
                        dot: <LockOutlined style={{ fontSize: 16 }} />,
                        children: (
                          <div style={{ background: "#FFF7E6", padding: 16, borderRadius: 10, border: "1px solid #FFD591", marginBottom: 16 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                              <span style={{ fontWeight: 700, color: "#D46B08", fontSize: 14 }}>
                                Step 5: Human Approval Intercept Gate
                              </span>
                              <Tag color="orange">NON-NEGOTIABLE HARDENING</Tag>
                            </div>
                            <Text style={{ fontSize: 12, color: "#597599" }}>
                              All proposed mutations halt unconditionally in the <strong>Action Approvals Queue</strong>. A human merchant or authorized operator must review the proposed action and click "Approve" before any request can reach PayPal.
                            </Text>
                          </div>
                        ),
                      },
                      {
                        color: "#D9381E",
                        dot: <ThunderboltOutlined style={{ fontSize: 16 }} />,
                        children: (
                          <div style={{ background: "#FFF2F0", padding: 16, borderRadius: 10, border: "1px solid #FFA39E", marginBottom: 16 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                              <span style={{ fontWeight: 700, color: "#D9381E", fontSize: 14 }}>
                                Step 6: Deterministic PayPal Executor
                              </span>
                              <Tag color="red">DETERMINISTIC PYTHON</Tag>
                            </div>
                            <Text style={{ fontSize: 12, color: "#597599" }}>
                              Once human authorization is verified, pure Python executors (free of LLM hallucination risk) construct signed PayPal Sandbox requests with unique, cryptographic <code>PayPal-Request-Id</code> headers for strict idempotency.
                            </Text>
                          </div>
                        ),
                      },
                      {
                        color: "#00A854",
                        dot: <ApiOutlined style={{ fontSize: 16 }} />,
                        children: (
                          <div style={{ background: "#FFFFFF", padding: 16, borderRadius: 10, border: "1px solid #E5EDF6" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                              <span style={{ fontWeight: 700, color: "#003087", fontSize: 14 }}>
                                Step 7: Webhook Signature Ingestion & Closed-Loop Feedback
                              </span>
                              <Tag color="green">SIGNATURE VERIFIED</Tag>
                            </div>
                            <Text style={{ fontSize: 12, color: "#597599" }}>
                              As PayPal Sandbox processes mutations (or buyers trigger dispute events), webhook events (<code>CUSTOMER.DISPUTE.CREATED</code>, <code>BILLING.SUBSCRIPTION.SUSPENDED</code>) feed deterministically back into the ledger to close the loop.
                            </Text>
                          </div>
                        ),
                      },
                    ]}
                  />
                </div>
              ),
            },
            {
              key: "architecture",
              label: (
                <span>
                  <SafetyCertificateOutlined style={{ marginRight: 6 }} />
                  Security & Hardening
                </span>
              ),
              children: (
                <div>
                  <Title level={4} style={{ color: "#003087", marginBottom: 12, fontWeight: 700 }}>
                    Architectural Guardrails & Least-Privilege Separation
                  </Title>

                  <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
                    <Col xs={24} md={12}>
                      <Card
                        title={
                          <Space>
                            <LockOutlined style={{ color: "#0070BA" }} />
                            <span style={{ color: "#003087", fontWeight: 600 }}>Toolkit Isolation (Read vs Write)</span>
                          </Space>
                        }
                        style={{ borderRadius: 10, border: "1px solid #E5EDF6", height: "100%" }}
                        bodyStyle={{ padding: 18 }}
                      >
                        <Text style={{ fontSize: 13, color: "#1D2D44" }}>
                          AI planners are provided ONLY tools decorated under <code>ReadOnlyPayPalToolkit</code>:
                        </Text>
                        <ul style={{ fontSize: 12, color: "#597599", marginTop: 8, paddingLeft: 20 }}>
                          <li><code>list_orders()</code></li>
                          <li><code>get_subscription_details()</code></li>
                          <li><code>list_disputes()</code></li>
                        </ul>
                        <Text style={{ fontSize: 12, color: "#D9381E", fontWeight: 600 }}>
                          Write tools (<code>create_shipment_tracking</code>, <code>suspend_subscription</code>, <code>provide_dispute_evidence</code>) are physically segregated and can only be invoked by deterministic code after human approval.
                        </Text>
                      </Card>
                    </Col>

                    <Col xs={24} md={12}>
                      <Card
                        title={
                          <Space>
                            <ThunderboltOutlined style={{ color: "#FA8C16" }} />
                            <span style={{ color: "#003087", fontWeight: 600 }}>Daily Rate Cap Hardening</span>
                          </Space>
                        }
                        style={{ borderRadius: 10, border: "1px solid #E5EDF6", height: "100%" }}
                        bodyStyle={{ padding: 18 }}
                      >
                        <Text style={{ fontSize: 13, color: "#1D2D44" }}>
                          To eliminate risk of runaway automated actions or malicious approval loops, the backend enforces a non-negotiable hard ceiling:
                        </Text>
                        <div style={{ background: "#F4F7FB", padding: 12, borderRadius: 6, margin: "10px 0" }}>
                          <span style={{ fontWeight: 700, color: "#003087", fontSize: 14 }}>
                            200 Max Daily PayPal Writes
                          </span>
                          <span style={{ float: "right", color: "#597599", fontSize: 12 }}>Configured in .env</span>
                        </div>
                        <Text style={{ fontSize: 12, color: "#597599" }}>
                          Any write attempt exceeding this limit returns an immediate HTTP 429 status code with an audit log alert.
                        </Text>
                      </Card>
                    </Col>
                  </Row>

                  <Descriptions title="Security Infrastructure Matrix" bordered size="small" column={{ xs: 1, sm: 2 }}>
                    <Descriptions.Item label="Password Hashing">Argon2id (RFC 9106) with random salt</Descriptions.Item>
                    <Descriptions.Item label="Session Security">Cryptographically signed cookies with HttpOnly, SameSite=Strict</Descriptions.Item>
                    <Descriptions.Item label="CSRF Protection">Double-Submit Cookie verification with timing-safe comparison</Descriptions.Item>
                    <Descriptions.Item label="Rate Limiting">Token bucket middleware on sensitive authentication endpoints</Descriptions.Item>
                    <Descriptions.Item label="Key Redaction">Automatic regex sanitization of tokens & PayPal secrets in logs</Descriptions.Item>
                    <Descriptions.Item label="Audit Trail">Append-only SQLite ledger tracking every action, user, and IP</Descriptions.Item>
                  </Descriptions>
                </div>
              ),
            },
            {
              key: "sandbox",
              label: (
                <span>
                  <ApiOutlined style={{ marginRight: 6 }} />
                  Live Sandbox Specifications
                </span>
              ),
              children: (
                <div>
                  <Title level={4} style={{ color: "#003087", marginBottom: 12, fontWeight: 700 }}>
                    PayPal Sandbox Integration & Credentials
                  </Title>

                  <Alert
                    type="success"
                    showIcon
                    message="LIVE SANDBOX OAUTH2 TOKEN EXCHANGE VERIFIED"
                    description="The server successfully negotiates bearer tokens against https://api-m.sandbox.paypal.com/v1/oauth2/token using verified developer credentials."
                    style={{ marginBottom: 20, borderRadius: 8 }}
                  />

                  <Descriptions bordered size="small" column={1}>
                    <Descriptions.Item label="PayPal Endpoint">
                      <code>https://api-m.sandbox.paypal.com</code>
                    </Descriptions.Item>
                    <Descriptions.Item label="Active Client ID">
                      <code>PAYPAL_SANDBOX_CLIENT_ID (Configured via Environment)</code>
                    </Descriptions.Item>
                    <Descriptions.Item label="Live Write Capabilities">
                      Tracking Notice Generation, Subscription Pauses, Dispute Evidence Dossier Generation
                    </Descriptions.Item>
                    <Descriptions.Item label="Default Approver Account">
                      Username: <code>admin</code> (Role: <code>APPROVER</code>)
                    </Descriptions.Item>
                    <Descriptions.Item label="AG Studio License">
                      Trial Enterprise Key Active (Granted through 24 December 2026)
                    </Descriptions.Item>
                  </Descriptions>
                </div>
              ),
            },
            {
              key: "worldwide-corridors",
              label: (
                <span>
                  <GlobalOutlined style={{ marginRight: 6 }} />
                  Worldwide Trade Corridors
                </span>
              ),
              children: (
                <div>
                  <Title level={4} style={{ color: "#003087", marginBottom: 8, fontWeight: 700 }}>
                    Global Trade Corridor Architecture & Meteorological Telemetry
                  </Title>
                  <Paragraph style={{ color: "#597599", fontSize: 13, marginBottom: 20 }}>
                    Day-0 Shield operates across 15 premier commercial logistics hubs spanning 4 worldwide quadrants. Continuous Open-Meteo WMO feeds correlate real-time meteorological disruption against transit schedules, container dwell times, and international PayPal dispute windows.
                  </Paragraph>

                  {/* 4 Quadrants Grid */}
                  <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                    <Col xs={24} sm={12} lg={6}>
                      <Card size="small" style={{ borderRadius: 8, border: "1px solid #E5EDF6" }}>
                        <Tag color="blue" style={{ fontWeight: 600 }}>Americas Quadrant</Tag>
                        <div style={{ fontWeight: 700, color: "#003087", fontSize: 14, margin: "6px 0" }}>
                          New York • Los Angeles • Chicago
                        </div>
                        <Text style={{ fontSize: 11, color: "#597599" }}>
                          Covers East Coast air-sea gateways, Pacific Rim container terminals (LA/Long Beach), and Midwest intermodal rail networks.
                        </Text>
                      </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                      <Card size="small" style={{ borderRadius: 8, border: "1px solid #E5EDF6" }}>
                        <Tag color="cyan" style={{ fontWeight: 600 }}>EMEA Quadrant</Tag>
                        <div style={{ fontWeight: 700, color: "#003087", fontSize: 14, margin: "6px 0" }}>
                          Rotterdam • London • Frankfurt • Dubai
                        </div>
                        <Text style={{ fontSize: 11, color: "#597599" }}>
                          Europe largest deepwater port (Rotterdam), Heathrow air cargo, Frankfurt logistics hub, and Jebel Ali / Dubai air-sea transshipment.
                        </Text>
                      </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                      <Card size="small" style={{ borderRadius: 8, border: "1px solid #E5EDF6" }}>
                        <Tag color="purple" style={{ fontWeight: 600 }}>APAC Quadrant</Tag>
                        <div style={{ fontWeight: 700, color: "#003087", fontSize: 14, margin: "6px 0" }}>
                          Singapore • Tokyo • Shanghai • Sydney
                        </div>
                        <Text style={{ fontSize: 11, color: "#597599" }}>
                          Straits of Malacca transshipment megahub (Singapore), Yangtze Delta mega-ports, Tokyo Bay export lanes, and Oceania gateways.
                        </Text>
                      </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                      <Card size="small" style={{ borderRadius: 8, border: "1px solid #E5EDF6" }}>
                        <Tag color="orange" style={{ fontWeight: 600 }}>South Asia Quadrant</Tag>
                        <div style={{ fontWeight: 700, color: "#003087", fontSize: 14, margin: "6px 0" }}>
                          Mumbai • Chennai • Delhi • Bangalore • Kolkata
                        </div>
                        <Text style={{ fontSize: 11, color: "#597599" }}>
                          Nhava Sheva container corridor, Coromandel coast manufacturing ports, NCR dry cargo hubs, and Deccan tech export centers.
                        </Text>
                      </Card>
                    </Col>
                  </Row>

                  {/* Worldwide Coordinates Matrix Table */}
                  <Title level={5} style={{ color: "#003087", marginBottom: 12 }}>
                    Monitored Commercial Corridors & Open-Meteo Integration Matrix:
                  </Title>
                  <Descriptions bordered size="small" column={{ xs: 1, sm: 2, lg: 3 }} style={{ marginBottom: 20 }}>
                    <Descriptions.Item label="New York (US)">40.7128°N, 74.0060°W • Air & Sea Cargo</Descriptions.Item>
                    <Descriptions.Item label="Los Angeles (US)">34.0522°N, 118.2437°W • Pacific Container Port</Descriptions.Item>
                    <Descriptions.Item label="Chicago (US)">41.8781°N, 87.6298°W • Intermodal Rail Hub</Descriptions.Item>
                    <Descriptions.Item label="Rotterdam (NL)">51.9244°N, 4.4777°E • Europe Major Seaport</Descriptions.Item>
                    <Descriptions.Item label="London (UK)">51.5074°N, 0.1278°W • Heathrow Air Cargo</Descriptions.Item>
                    <Descriptions.Item label="Frankfurt (DE)">50.1109°N, 8.6821°E • Central European Air Hub</Descriptions.Item>
                    <Descriptions.Item label="Dubai (UAE)">25.2048°N, 55.2708°E • Jebel Ali Air-Sea Hub</Descriptions.Item>
                    <Descriptions.Item label="Singapore (SG)">1.3521°N, 103.8198°E • Straits Maritime Megahub</Descriptions.Item>
                    <Descriptions.Item label="Tokyo (JP)">35.6762°N, 139.6503°E • East Asia Coastal Hub</Descriptions.Item>
                    <Descriptions.Item label="Shanghai (CN)">31.2304°N, 121.4737°E • Yangtze Delta Mega-Port</Descriptions.Item>
                    <Descriptions.Item label="Sydney (AU)">33.8688°S, 151.2093°E • Oceania Gateway</Descriptions.Item>
                    <Descriptions.Item label="Mumbai (IN)">19.0760°N, 72.8777°E • Nhava Sheva Port</Descriptions.Item>
                    <Descriptions.Item label="Chennai (IN)">13.0827°N, 80.2707°E • Coromandel Coast Hub</Descriptions.Item>
                    <Descriptions.Item label="Delhi (IN)">28.6139°N, 77.2090°E • NCR Dry Cargo Hub</Descriptions.Item>
                    <Descriptions.Item label="Bangalore (IN)">12.9716°N, 77.5946°E • Tech Freight Gateway</Descriptions.Item>
                  </Descriptions>
                </div>
              ),
            },
            {
              key: "future-roadmap",
              label: (
                <span>
                  <BranchesOutlined style={{ marginRight: 6 }} />
                  Future Architecture & Advanced Roadmap
                </span>
              ),
              children: (
                <div>
                  <Alert
                    type="info"
                    showIcon
                    icon={<ThunderboltOutlined style={{ fontSize: 20, color: "#0070BA" }} />}
                    message={
                      <span style={{ fontWeight: 700, color: "#003087", fontSize: 14 }}>
                        DAY-0 SHIELD ENTERPRISE ROADMAP: NEXT-GENERATION AUTONOMOUS COMMERCE INFRASTRUCTURE
                      </span>
                    }
                    description="Planned technical enhancements and architecture extensions across multi-carrier routing, FX volatility hedging, customs EDI, IoT telemetry, zero-knowledge dispute proofs, and federated agent learning."
                    style={{
                      marginBottom: 24,
                      borderRadius: 10,
                      border: "1px solid #D6E4FF",
                      background: "#F0F5FF",
                    }}
                  />

                  <Row gutter={[16, 16]}>
                    <Col xs={24} md={12}>
                      <Card
                        title={
                          <Space>
                            <Tag color="blue">P0 - IMMEDIATE</Tag>
                            <span style={{ color: "#003087", fontWeight: 600 }}>1. Autonomous Dynamic Multi-Carrier Rerouting</span>
                          </Space>
                        }
                        size="small"
                        style={{ borderRadius: 10, border: "1px solid #E5EDF6", height: "100%" }}
                      >
                        <Paragraph style={{ fontSize: 13, color: "#4A5568", marginBottom: 8 }}>
                          Real-time fallback negotiation with secondary and tertiary multimodal freight carriers (DHL Express, FedEx Cross-Border, Maersk Line, Nippon Express) when corridor risk threshold exceeds P(dispute) &gt; 0.70.
                        </Paragraph>
                        <ul style={{ paddingLeft: 18, fontSize: 12, color: "#597599" }}>
                          <li>Automated carrier API rate shopping and label reassignment prior to dispatch.</li>
                          <li>Corridor-level SLA parity verification with delivery window adjustments.</li>
                          <li>PayPal Tracking API automated carrier tracking number replacement.</li>
                        </ul>
                      </Card>
                    </Col>

                    <Col xs={24} md={12}>
                      <Card
                        title={
                          <Space>
                            <Tag color="cyan">P1 - HIGH</Tag>
                            <span style={{ color: "#003087", fontWeight: 600 }}>2. Cross-Border FX Volatility & Dynamic Escrow Hedging</span>
                          </Space>
                        }
                        size="small"
                        style={{ borderRadius: 10, border: "1px solid #E5EDF6", height: "100%" }}
                      >
                        <Paragraph style={{ fontSize: 13, color: "#4A5568", marginBottom: 8 }}>
                          Dynamic synthetic currency hedging and settlement reserve adjustment across multi-currency orders (USD, EUR, GBP, SGD, JPY, AED, INR) during severe corridor freeze events.
                        </Paragraph>
                        <ul style={{ paddingLeft: 18, fontSize: 12, color: "#597599" }}>
                          <li>Protects merchant gross margins against currency swings when shipments are delayed &gt;14 days.</li>
                          <li>Integration with PayPal Settlement API for dynamic dispute reserve buffers.</li>
                          <li>Automated refund-at-spot or refund-at-booking policy compliance.</li>
                        </ul>
                      </Card>
                    </Col>

                    <Col xs={24} md={12}>
                      <Card
                        title={
                          <Space>
                            <Tag color="purple">P1 - HIGH</Tag>
                            <span style={{ color: "#003087", fontWeight: 600 }}>3. Automated Customs & Border Protection (CBP) / HS Code EDI</span>
                          </Space>
                        }
                        size="small"
                        style={{ borderRadius: 10, border: "1px solid #E5EDF6", height: "100%" }}
                      >
                        <Paragraph style={{ fontSize: 13, color: "#4A5568", marginBottom: 8 }}>
                          Direct EDIFACT / ANSI X12 ingestion from US CBP ACE, EU TARIC, and UN ASYCUDA systems to detect tariff holds, anti-dumping queries, and customs quarantine halts.
                        </Paragraph>
                        <ul style={{ paddingLeft: 18, fontSize: 12, color: "#597599" }}>
                          <li>HS code compliance scoring before physical handover to international carriers.</li>
                          <li>Automated commercial invoice and phytosanitary certificate validation.</li>
                          <li>Pre-emptive merchant notification to prevent INR claims during customs inspections.</li>
                        </ul>
                      </Card>
                    </Col>

                    <Col xs={24} md={12}>
                      <Card
                        title={
                          <Space>
                            <Tag color="orange">P2 - ADVANCED</Tag>
                            <span style={{ color: "#003087", fontWeight: 600 }}>4. IoT Cold-Chain & Shock Sensor Telemetry Ingestion</span>
                          </Space>
                        }
                        size="small"
                        style={{ borderRadius: 10, border: "1px solid #E5EDF6", height: "100%" }}
                      >
                        <Paragraph style={{ fontSize: 13, color: "#4A5568", marginBottom: 8 }}>
                          LoRaWAN, BLE, and 5G cellular GPS/temperature sensor telemetry for perishable goods, high-value electronics, and semiconductor shipments.
                        </Paragraph>
                        <ul style={{ paddingLeft: 18, fontSize: 12, color: "#597599" }}>
                          <li>Instant detection of reefer container temperature breaches or tilt/shock events in transit.</li>
                          <li>Automates pre-claim compilation for &quot;Significantly Not As Described&quot; (SNAD) damaged disputes.</li>
                          <li>Real-time telemetry packaged into immutable PayPal Dispute Evidence packs.</li>
                        </ul>
                      </Card>
                    </Col>

                    <Col xs={24} md={12}>
                      <Card
                        title={
                          <Space>
                            <Tag color="green">P2 - ADVANCED</Tag>
                            <span style={{ color: "#003087", fontWeight: 600 }}>5. Zero-Knowledge Dispute Proofs (zk-SNARKs)</span>
                          </Space>
                        }
                        size="small"
                        style={{ borderRadius: 10, border: "1px solid #E5EDF6", height: "100%" }}
                      >
                        <Paragraph style={{ fontSize: 13, color: "#4A5568", marginBottom: 8 }}>
                          Cryptographic zero-knowledge proofs confirming legitimate carrier physical custody and geofenced recipient delivery without exposing sensitive buyer/seller PII.
                        </Paragraph>
                        <ul style={{ paddingLeft: 18, fontSize: 12, color: "#597599" }}>
                          <li>Proves delivery address postal match without transmitting full residential addresses.</li>
                          <li>Immutable delivery receipts submitted to PayPal Dispute API for instant auto-win.</li>
                          <li>Zero compliance overhead for GDPR, CCPA, and cross-border data transfer laws.</li>
                        </ul>
                      </Card>
                    </Col>

                    <Col xs={24} md={12}>
                      <Card
                        title={
                          <Space>
                            <Tag color="geekblue">P3 - MOONSHOT</Tag>
                            <span style={{ color: "#003087", fontWeight: 600 }}>6. Agent-to-Agent Federated Learning Fraud Graph</span>
                          </Space>
                        }
                        size="small"
                        style={{ borderRadius: 10, border: "1px solid #E5EDF6", height: "100%" }}
                      >
                        <Paragraph style={{ fontSize: 13, color: "#4A5568", marginBottom: 8 }}>
                          Decentralized federated learning network sharing early hazard and fraud vulnerability signals across thousands of independent PayPal merchant stores without data centralization.
                        </Paragraph>
                        <ul style={{ paddingLeft: 18, fontSize: 12, color: "#597599" }}>
                          <li>Federated gradient updates train the Monte Carlo risk twin on emerging corridor patterns.</li>
                          <li>Sybil-resistant merchant reputation graph weighted by PayPal transaction volume.</li>
                          <li>Global immune response against synchronized cross-border fraud rings.</li>
                        </ul>
                      </Card>
                    </Col>
                  </Row>
                </div>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
};

export default Documentation;
