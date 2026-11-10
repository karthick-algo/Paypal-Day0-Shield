import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Layout, Menu, Button, Typography, Space, Avatar, Dropdown, Tag, Select, Badge, Popover, Modal, Steps, Card, message } from "antd";
import {
  DashboardOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  UnorderedListOutlined,
  AuditOutlined,
  LogoutOutlined,
  UserOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SafetyCertificateOutlined,
  NodeIndexOutlined,
  FileTextOutlined,
  PlayCircleOutlined,
  ThunderboltOutlined,
  ArrowRightOutlined,
  RocketOutlined,
} from "@ant-design/icons";
import { useAuth } from "../auth/context";
import { usePortfolio } from "../context/PortfolioContext";
import { PayPalShieldLogo } from "./PayPalLogo";
import api from "../api/client";

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const menuItems = [
  { key: "/", icon: <DashboardOutlined />, label: "Dashboard" },
  { key: "/at-risk", icon: <WarningOutlined />, label: "At-Risk Exposure" },
  { key: "/approvals", icon: <CheckCircleOutlined />, label: "Action Approvals" },
  { key: "/langchain-monitor", icon: <NodeIndexOutlined />, label: "AI Agent Monitoring" },
  { key: "/policy-rag", icon: <SafetyCertificateOutlined />, label: "Policy RAG & Ingest" },
  { key: "/disputes", icon: <ExclamationCircleOutlined />, label: "Dispute Center" },
  { key: "/agent-log", icon: <UnorderedListOutlined />, label: "Agent Log" },
  { key: "/audit", icon: <AuditOutlined />, label: "Audit & Compliance" },
  { key: "/documentation", icon: <FileTextOutlined />, label: "Project Dossier" },
];

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [liveAgent, setLiveAgent] = useState({
    agent: "HazardSentinel",
    api: "GET /api/hazards/weather-live",
    status: "Worldwide: 15 Hubs Live",
    tool_access: "read_only",
    summary: "Continuous meteorological Open-Meteo WMO telemetry across 15 global hubs",
    latency_ms: 38,
    mode: "CONTINUOUS_SURVEILLANCE",
    pending_count: 0,
  });
  const { selectedMerchant, setSelectedMerchant, merchants, loading: loadingMerchants } = usePortfolio();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  // 3-Minute Interactive Demo Tour State
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [demoStep, setDemoStep] = useState(0);
  const [demoLoading, setDemoLoading] = useState(false);

  const handleTriggerDemoScenario = async (region = "Singapore", type = "typhoon", severity = 5) => {
    setDemoLoading(true);
    try {
      await api.post("/hazards/scenario", {
        type,
        region,
        severity,
        duration_days: 3,
      });
      message.success(`Day-0 Hazard Simulated: ${type.toUpperCase()} in ${region}! Exposure calculated across 15 hubs.`);
      setDemoStep(1);
      navigate("/at-risk");
    } catch (err: any) {
      message.error(err.response?.data?.detail || "Failed to trigger demo hazard scenario");
    } finally {
      setDemoLoading(false);
    }
  };

  const fetchLiveAgent = async () => {
    try {
      const res = await api.get("/agents/live-status");
      if (res.data) {
        setLiveAgent({
          agent: res.data.agent || "HazardSentinel",
          api: res.data.api || "GET /api/hazards/weather-live",
          status: res.data.status || "Worldwide: 15 Hubs Live",
          tool_access: res.data.tool_access || "read_only",
          summary: res.data.summary || "Continuous meteorological telemetry across 15 hubs",
          latency_ms: res.data.latency_ms || 42,
          mode: res.data.mode || "CONTINUOUS_SURVEILLANCE",
          pending_count: res.data.pending_count || 0,
        });
      }
    } catch {
      // fallback preserved
    }
  };

  useEffect(() => {
    fetchLiveAgent();
    const timer = setInterval(fetchLiveAgent, 3000);
    return () => clearInterval(timer);
  }, []);

  const userMenu = {
    items: [
      {
        key: "info",
        disabled: true,
        label: (
          <div style={{ padding: "2px 0" }}>
            <div style={{ fontWeight: 600, color: "#003087", fontSize: 13 }}>{user?.username}</div>
            <div style={{ fontSize: 11, color: "#8c8c8c" }}>Role: {user?.role?.toUpperCase()}</div>
          </div>
        ),
      },
      { type: "divider" as const },
      {
        key: "logout",
        icon: <LogoutOutlined />,
        danger: true,
        label: "Sign Out",
        onClick: () => {
          logout();
          navigate("/login");
        },
      },
    ],
  };

  return (
    <Layout style={{ minHeight: "100vh", background: "#F4F7FB" }}>
      {/* Sider without any bottom trigger button */}
      <Sider
        trigger={null}
        collapsed={collapsed}
        collapsedWidth={64}
        width={210}
        style={{
          height: "100vh",
          position: "fixed",
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
          background: "#00142D",
          borderRight: "1px solid rgba(255, 255, 255, 0.06)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Brand Logo Header */}
        <div
          style={{
            height: 52,
            padding: collapsed ? "0 8px" : "0 14px",
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "flex-start",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          <PayPalShieldLogo collapsed={collapsed} light />
        </div>

        {/* Menu Navigation */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 6px" }}>
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={({ key }) => navigate(key)}
            style={{ background: "transparent", borderRight: "none", fontSize: 13 }}
          />
        </div>
      </Sider>

      {/* Main Layout Area */}
      <Layout
        style={{
          marginLeft: collapsed ? 64 : 210,
          transition: "margin-left 0.2s cubic-bezier(0.2, 0, 0, 1)",
          background: "#F4F7FB",
          minWidth: 0,
        }}
      >
        {/* Sleek, Clean, Modern Top Header with Real-Time Agent Ticker */}
        <Header
          style={{
            background: "#FFFFFF",
            padding: "0 18px",
            height: 52,
            lineHeight: "52px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid #E5EBF2",
            position: "sticky",
            top: 0,
            zIndex: 90,
          }}
        >
          {/* Left Controls: Collapse Toggle & Merchant Selector */}
          <Space size={10} align="center">
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: 15, color: "#003087", padding: "4px 8px" }}
            />
            <Select
              value={selectedMerchant}
              onChange={setSelectedMerchant}
              size="small"
              loading={loadingMerchants}
              style={{ width: 200, fontSize: 12 }}
              options={[
                { value: "all", label: `All Portfolios (${merchants.length || 5})` },
                ...merchants.map((m) => ({
                  value: String(m.id),
                  label: `${m.name} (${m.ship_from_region})`,
                })),
              ]}
            />
            <Button
              type="primary"
              size="small"
              icon={<PlayCircleOutlined />}
              onClick={() => setDemoModalOpen(true)}
              style={{
                background: "linear-gradient(135deg, #0070BA 0%, #003087 100%)",
                borderColor: "#003087",
                fontWeight: 600,
                fontSize: 12,
                borderRadius: 6,
                boxShadow: "0 2px 6px rgba(0, 48, 135, 0.25)",
              }}
            >
              3-Min Demo Tour
            </Button>
          </Space>

          {/* Center Real-Time AI Agent & API Activity from Live SQLite Event Stream */}
          <Popover
            placement="bottom"
            trigger="hover"
            content={
              <div style={{ maxWidth: 360, padding: "4px 2px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, borderBottom: "1px solid #F0F0F0", paddingBottom: 6 }}>
                  <Text strong style={{ color: "#003087", fontSize: 13 }}>LangGraph Multi-Agent Telemetry</Text>
                  <Tag color="processing" style={{ margin: 0, fontSize: 10 }}>{liveAgent.mode}</Tag>
                </div>
                <div style={{ fontSize: 12, marginBottom: 4 }}>
                  <Text type="secondary">Current Node: </Text>
                  <Text strong style={{ color: "#0070BA" }}>{liveAgent.agent}</Text>
                </div>
                <div style={{ fontSize: 12, marginBottom: 4 }}>
                  <Text type="secondary">Active API: </Text>
                  <Text code style={{ fontSize: 11, color: "#2F54EB" }}>{liveAgent.api}</Text>
                </div>
                <div style={{ fontSize: 12, marginBottom: 4 }}>
                  <Text type="secondary">Telemetry Latency: </Text>
                  <Tag color="cyan" style={{ fontSize: 10 }}>{liveAgent.latency_ms} ms</Tag>
                </div>
                <div style={{ fontSize: 12, marginBottom: 6 }}>
                  <Text type="secondary">Security Sandbox: </Text>
                  <Tag color={liveAgent.tool_access === "read_only" ? "green" : "orange"} style={{ fontSize: 10 }}>
                    {liveAgent.tool_access === "read_only" ? "Strict READ-ONLY Sandbox" : "Human Sign-Off Gate Intercept"}
                  </Tag>
                </div>
                <div style={{ fontSize: 11, color: "#597599", background: "#F7FAFC", padding: "6px 8px", borderRadius: 6, marginBottom: 8 }}>
                  {liveAgent.summary}
                </div>
                <Button
                  type="primary"
                  size="small"
                  block
                  icon={<NodeIndexOutlined />}
                  onClick={() => navigate("/langchain-monitor")}
                  style={{ background: "#0070BA", borderColor: "#0070BA" }}
                >
                  View LangGraph Studio Traces
                </Button>
              </div>
            }
          >
            <div
              onClick={() => navigate("/langchain-monitor")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "#F0F5FF",
                border: "1px solid #D6E4FF",
                borderRadius: 20,
                padding: "2px 14px",
                lineHeight: "24px",
                boxShadow: "0 1px 3px rgba(0,48,135,0.05)",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              <Badge status="processing" color="#0070BA" />
              <Text style={{ fontSize: 11, color: "#003087", fontWeight: 600 }}>
                Agent: <span style={{ color: "#0070BA" }}>{liveAgent.agent}</span>
              </Text>
              <span style={{ color: "#ADC6FF", fontSize: 11 }}>|</span>
              <Text style={{ fontSize: 11, color: "#2F54EB", fontFamily: "monospace" }}>
                {liveAgent.api}
              </Text>
              <span style={{ color: "#ADC6FF", fontSize: 11 }}>|</span>
              <Tag
                color="green"
                style={{
                  fontSize: 10,
                  lineHeight: "16px",
                  margin: 0,
                  padding: "0 6px",
                  borderRadius: 4,
                  border: "none",
                  fontWeight: 600,
                }}
              >
                {liveAgent.status}
              </Tag>
            </div>
          </Popover>

          {/* Right Controls: User Profile */}
          <Space size={14} align="center">
            {/* User Dropdown */}
            <Dropdown menu={userMenu} placement="bottomRight" trigger={["click"]}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  cursor: "pointer",
                  padding: "4px 8px",
                  borderRadius: 6,
                }}
              >
                <Avatar size={26} style={{ backgroundColor: "#003087", fontSize: 12 }} icon={<UserOutlined />} />
                <span style={{ color: "#0F2644", fontSize: 13, fontWeight: 600 }}>{user?.username}</span>
                <Tag color="blue" style={{ fontSize: 10, lineHeight: "16px", margin: 0, padding: "0 6px" }}>
                  {user?.role?.toUpperCase()}
                </Tag>
              </div>
            </Dropdown>
          </Space>
        </Header>

        {/* Content Body */}
        <Content style={{ padding: "16px 20px", minHeight: "calc(100vh - 52px)" }}>
          {children}
        </Content>
      </Layout>

      {/* 3-Minute Seeded Demo Tour Modal */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ background: "#003087", padding: "6px 10px", borderRadius: 8, color: "#FFF", display: "flex", alignItems: "center" }}>
              <RocketOutlined style={{ fontSize: 16 }} />
            </div>
            <div>
              <div style={{ color: "#003087", fontWeight: 700, fontSize: 16 }}>
                Day-0 Shield: 3-Minute Interactive Demo Tour
              </div>
              <div style={{ color: "#597599", fontSize: 12, fontWeight: 400 }}>
                Experience the end-to-end commercial risk twin workflow across 5 verified phases
              </div>
            </div>
          </div>
        }
        open={demoModalOpen}
        onCancel={() => setDemoModalOpen(false)}
        footer={
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Button
              disabled={demoStep === 0}
              onClick={() => setDemoStep((s) => Math.max(0, s - 1))}
            >
              Previous Phase
            </Button>
            <Space>
              <Button onClick={() => setDemoModalOpen(false)}>Close Tour</Button>
              {demoStep < 4 ? (
                <Button
                  type="primary"
                  icon={<ArrowRightOutlined />}
                  onClick={() => {
                    const next = demoStep + 1;
                    setDemoStep(next);
                    if (next === 1) navigate("/at-risk");
                    else if (next === 2) navigate("/approvals");
                    else if (next === 3) navigate("/policy-rag");
                    else if (next === 4) navigate("/audit");
                  }}
                  style={{ background: "#0070BA", borderColor: "#0070BA" }}
                >
                  Next Phase
                </Button>
              ) : (
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={() => {
                    setDemoModalOpen(false);
                    message.success("Demo walkthrough complete! System is fully operational in sandbox.");
                  }}
                  style={{ background: "#52C41A", borderColor: "#52C41A" }}
                >
                  Finish Demo
                </Button>
              )}
            </Space>
          </div>
        }
        width={760}
        destroyOnClose
      >
        <div style={{ padding: "12px 0 20px 0" }}>
          <Steps
            current={demoStep}
            onChange={(s) => {
              setDemoStep(s);
              if (s === 0) navigate("/");
              else if (s === 1) navigate("/at-risk");
              else if (s === 2) navigate("/approvals");
              else if (s === 3) navigate("/policy-rag");
              else if (s === 4) navigate("/audit");
            }}
            size="small"
            items={[
              { title: "1. Detect", description: "Day-0 Hazard" },
              { title: "2. Quantify", description: "Exposure & CERI" },
              { title: "3. Intercept", description: "PayPal Gate" },
              { title: "4. Defend", description: "Policy RAG" },
              { title: "5. Verify", description: "Audit Ledger" },
            ]}
          />

          <div style={{ marginTop: 20 }}>
            {demoStep === 0 && (
              <Card
                style={{
                  background: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  borderRadius: 10,
                }}
              >
                <div style={{ marginBottom: 12 }}>
                  <Tag color="red" style={{ fontWeight: 600, fontSize: 11 }}>PHASE 1: DAY-0 DISRUPTION DETECTION</Tag>
                  <Typography.Title level={5} style={{ margin: "6px 0", color: "#003087" }}>
                    Simulate Live Meteorological Disaster Shocks
                  </Typography.Title>
                  <Typography.Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 16 }}>
                    Day-0 Shield ingests real-time WMO weather telemetry across 15 worldwide trade corridors. When extreme events strike, parcels freeze in sorting depots while buyers are still unaware. Simulate a shock below to trigger autonomous risk calculation:
                  </Typography.Paragraph>
                </div>
                <Space direction="vertical" style={{ width: "100%" }} size={10}>
                  <Button
                    type="primary"
                    block
                    icon={<ThunderboltOutlined />}
                    loading={demoLoading}
                    onClick={() => handleTriggerDemoScenario("Singapore", "typhoon", 5)}
                    style={{
                      height: 42,
                      background: "linear-gradient(135deg, #722ED1 0%, #391085 100%)",
                      borderColor: "#391085",
                      fontWeight: 600,
                    }}
                  >
                    Simulate Category-5 Malacca Strait Typhoon (Singapore Maritime Hub)
                  </Button>
                  <Button
                    block
                    icon={<WarningOutlined />}
                    loading={demoLoading}
                    onClick={() => handleTriggerDemoScenario("Rotterdam", "storm", 5)}
                    style={{ height: 42, color: "#D9381E", borderColor: "#FFA39E", fontWeight: 600 }}
                  >
                    Simulate Severe North Sea Storm (Rotterdam European Seaport)
                  </Button>
                </Space>
              </Card>
            )}

            {demoStep === 1 && (
              <Card
                style={{
                  background: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  borderRadius: 10,
                }}
              >
                <Tag color="orange" style={{ fontWeight: 600, fontSize: 11 }}>PHASE 2: EXPOSURE & CERI RISK ENGINE</Tag>
                <Typography.Title level={5} style={{ margin: "6px 0", color: "#003087" }}>
                  Quantify Gross Reserve Exposure and 60-Day Monte Carlo Curve
                </Typography.Title>
                <Typography.Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 16 }}>
                  The risk engine calculates the Composite Environmental Risk Index (CERI) across all active parcels traversing the disaster zone, running 1,000 stochastic simulation draws to forecast INR dispute velocity and calculate expected cashflow reserve holds.
                </Typography.Paragraph>
                <Button
                  type="primary"
                  block
                  icon={<WarningOutlined />}
                  onClick={() => {
                    navigate("/at-risk");
                    setDemoStep(2);
                  }}
                  style={{ height: 40, background: "#0070BA", borderColor: "#0070BA", fontWeight: 600 }}
                >
                  Inspect At-Risk Exposure Table & Consignment Drawer
                </Button>
              </Card>
            )}

            {demoStep === 2 && (
              <Card
                style={{
                  background: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  borderRadius: 10,
                }}
              >
                <Tag color="blue" style={{ fontWeight: 600, fontSize: 11 }}>PHASE 3: HUMAN-IN-THE-LOOP APPROVAL GATE</Tag>
                <Typography.Title level={5} style={{ margin: "6px 0", color: "#003087" }}>
                  Authorize Pre-Emptive PayPal Write Actions
                </Typography.Title>
                <Typography.Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 16 }}>
                  Autonomous agents must not execute financial writes without human oversight. The Action Approvals queue stages carrier tracking delay notices (PayPal Tracking API) and recurring billing pauses (PayPal Subscriptions API). Every authorized action executes idempotently using a unique UUIDv4 PayPal-Request-Id header.
                </Typography.Paragraph>
                <Button
                  type="primary"
                  block
                  icon={<CheckCircleOutlined />}
                  onClick={() => {
                    navigate("/approvals");
                    setDemoStep(3);
                  }}
                  style={{ height: 40, background: "#003087", borderColor: "#003087", fontWeight: 600 }}
                >
                  Review & Authorize Staged PayPal Interventions
                </Button>
              </Card>
            )}

            {demoStep === 3 && (
              <Card
                style={{
                  background: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  borderRadius: 10,
                }}
              >
                <Tag color="cyan" style={{ fontWeight: 600, fontSize: 11 }}>PHASE 4: SELLER PROTECTION POLICY RAG</Tag>
                <Typography.Title level={5} style={{ margin: "6px 0", color: "#003087" }}>
                  Admissibility Verification & Grounded Dispute Evidence
                </Typography.Title>
                <Typography.Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 16 }}>
                  Eliminates LLM policy hallucination by strictly grounding dispute defenses in Section 11.2 of the PayPal User Agreement and carrier force majeure clauses. Supports live URL crawling and custom merchant SLA text ingestion with TF-IDF cosine vector similarity scoring.
                </Typography.Paragraph>
                <Button
                  type="primary"
                  block
                  icon={<SafetyCertificateOutlined />}
                  onClick={() => {
                    navigate("/policy-rag");
                    setDemoStep(4);
                  }}
                  style={{ height: 40, background: "#0070BA", borderColor: "#0070BA", fontWeight: 600 }}
                >
                  Explore Policy Ingestion & Evidence Briefs
                </Button>
              </Card>
            )}

            {demoStep === 4 && (
              <Card
                style={{
                  background: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  borderRadius: 10,
                }}
              >
                <Tag color="green" style={{ fontWeight: 600, fontSize: 11 }}>PHASE 5: ZERO-TRUST AUDIT & COMPLIANCE</Tag>
                <Typography.Title level={5} style={{ margin: "6px 0", color: "#003087" }}>
                  Cryptographic Verification & Guardrails AI Security Ledger
                </Typography.Title>
                <Typography.Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 16 }}>
                  Inspect the immutable audit trail verifying cryptographic webhook signatures (/v1/notifications/verify-webhook-signature), Guardrails AI PII masking (names, addresses, OAuth secrets), prompt injection containment, and deterministic UUIDv4 idempotency tokens.
                </Typography.Paragraph>
                <Button
                  type="primary"
                  block
                  icon={<AuditOutlined />}
                  onClick={() => {
                    navigate("/audit");
                    setDemoModalOpen(false);
                    message.success("Demo walkthrough complete! System is fully verified.");
                  }}
                  style={{ height: 40, background: "#52C41A", borderColor: "#52C41A", fontWeight: 600 }}
                >
                  View Cryptographic Compliance & Audit Ledger
                </Button>
              </Card>
            )}
          </div>
        </div>
      </Modal>
    </Layout>
  );
};

export default AppLayout;
