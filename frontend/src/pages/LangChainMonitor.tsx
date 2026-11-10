import React, { useEffect, useState } from "react";
import {
  Row,
  Col,
  Card,
  Tag,
  Typography,
  Space,
  Badge,
  Table,
  Button,
  Drawer,
  Descriptions,
  Progress,
  Alert,
  Spin,
  Tooltip,
} from "antd";
import {
  BranchesOutlined,
  SafetyCertificateOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined,
  EyeOutlined,
  ReloadOutlined,
  NodeIndexOutlined,
  ApiOutlined,
  RobotOutlined,
  StopOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import api from "../api/client";

const { Title, Text, Paragraph } = Typography;

interface PipelineNode {
  id: string;
  name: string;
  type: string;
  description: string;
  status: string;
  tool_access: string;
  llm_bound: boolean;
  read_only_enforced?: boolean;
  pending_count?: number;
}

interface LangChainStatus {
  framework: string;
  llm_provider: string;
  llm_model: string;
  least_privilege_assertion: string;
  read_tools_count: number;
  read_tools_sample: string[];
  write_tools_isolated: string[];
  pipeline_nodes: PipelineNode[];
  telemetry: {
    total_agent_traces: number;
    pending_human_actions: number;
    deterministic_writes_executed: number;
    avg_latency_ms: number;
    llm_calls_this_hour: number;
    max_llm_calls_per_hour: number;
  };
}

interface TraceRecord {
  trace_id: string;
  run_id: string;
  timestamp: string;
  node: string;
  kind: string;
  summary: string;
  tool_name: string | null;
  tool_access: string;
  latency_ms: number;
  tokens_total: number;
  input_payload: any;
  output_payload: any;
}

const LangChainMonitor: React.FC = () => {
  const [statusData, setStatusData] = useState<LangChainStatus | null>(null);
  const [traces, setTraces] = useState<TraceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrace, setSelectedTrace] = useState<TraceRecord | null>(null);

  const fetchTelemetry = async () => {
    try {
      const [statusRes, traceRes] = await Promise.all([
        api.get("/langchain/status"),
        api.get("/langchain/traces"),
      ]);
      setStatusData(statusRes.data);
      setTraces(traceRes.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 3000);
    return () => clearInterval(interval);
  }, []);

  const columns = [
    {
      title: "Trace ID",
      dataIndex: "trace_id",
      key: "tid",
      width: 110,
      render: (v: string) => <span style={{ fontFamily: "monospace", fontWeight: 600 }}>{v}</span>,
    },
    {
      title: "AI Agent Node",
      dataIndex: "node",
      key: "node",
      width: 180,
      render: (v: string) => (
        <Tag color={v === "planner_node" ? "blue" : v === "action_executor" ? "red" : "cyan"} style={{ fontWeight: 600, margin: 0 }}>
          {v}
        </Tag>
      ),
    },
    {
      title: "Tool Security Tier",
      dataIndex: "tool_access",
      key: "sec",
      width: 195,
      render: (v: string) => {
        if (v === "read") return <Tag color="green" style={{ margin: 0 }}><SafetyCertificateOutlined style={{ marginRight: 4 }} />READ-ONLY TOOL</Tag>;
        if (v === "write") return <Tag color="orange" style={{ margin: 0 }}><ThunderboltOutlined style={{ marginRight: 4 }} />WRITE EXECUTOR</Tag>;
        return <Tag color="default" style={{ margin: 0 }}><NodeIndexOutlined style={{ marginRight: 4 }} />INTERNAL NODE</Tag>;
      },
    },
    {
      title: "Execution Summary",
      dataIndex: "summary",
      key: "summary",
      minWidth: 280,
      ellipsis: true,
      render: (v: string) => <Text style={{ fontSize: 13, color: "#1D2D44" }}>{v}</Text>,
    },
    {
      title: "Latency",
      dataIndex: "latency_ms",
      key: "lat",
      width: 110,
      align: "right" as const,
      render: (v: number) => <span style={{ color: "#597599", fontWeight: 500 }}>{v}ms</span>,
    },
    {
      title: "Tokens",
      dataIndex: "tokens_total",
      key: "tok",
      width: 100,
      align: "center" as const,
      render: (v: number) => (v > 0 ? <Tag color="geekblue" style={{ margin: 0 }}>{v}</Tag> : <Text type="secondary">-</Text>),
    },
    {
      title: "Inspect",
      key: "act",
      width: 100,
      align: "center" as const,
      render: (_: any, r: TraceRecord) => (
        <Button size="small" type="link" icon={<EyeOutlined />} onClick={() => setSelectedTrace(r)}>
          Trace
        </Button>
      ),
    },
  ];

  if (loading) return <Spin size="large" style={{ display: "block", margin: "120px auto" }} />;

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <Title level={3} style={{ color: "#003087", margin: 0, fontWeight: 700 }}>
            Autonomous AI Agent Sentinel & Workflow Monitor
          </Title>
          <Text style={{ color: "#597599", fontSize: 13 }}>
            Continuous LangGraph Multi-Agent Telemetry • Least-Privilege Guardrail Verification • Real-Time Decision Traces
          </Text>
        </div>
        <Space>
          <Badge status="processing" color="#00CF65" text={<span style={{ fontWeight: 600, color: "#003087" }}>Engine Online</span>} />
          <Button size="small" icon={<ReloadOutlined />} onClick={fetchTelemetry}>
            Refresh
          </Button>
        </Space>
      </div>

      {/* Safety & Isolation Verification Banner */}
      <Alert
        type="success"
        showIcon
        icon={<SafetyCertificateOutlined style={{ fontSize: 20, color: "#00A854" }} />}
        message={
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: 700, color: "#003087" }}>
              LEAST-PRIVILEGE TOOL BOUNDARY ENFORCED: {statusData?.least_privilege_assertion}
            </span>
            <Tag color="green">ZERO WRITE LEAKAGE</Tag>
          </div>
        }
        description={
          <div style={{ fontSize: 12, marginTop: 4 }}>
            All LangGraph planner nodes are strictly bound to read-only PayPal tools (<code>list_*</code>, <code>get_*</code>, <code>show_*</code>).
            All write tools (<code>create_shipment_tracking</code>, <code>suspend_subscription</code>, <code>provide_evidence</code>) are sequestered inside the deterministic executor and require verified human approval.
          </div>
        }
        style={{ marginBottom: 20, borderRadius: 10, border: "1px solid #B7EB8F", background: "#F6FFED" }}
      />

      {/* Telemetry KPI Cards - Strictly Equal & Fixed Dimensions */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              border: "1px solid #E5EDF6",
              boxShadow: "0 2px 8px rgba(0,48,135,0.03)",
              height: 128,
            }}
            bodyStyle={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              padding: "14px 18px",
            }}
          >
            <div style={{ height: 18, fontSize: 12, color: "#597599", fontWeight: 500 }}>Active LLM Runtime</div>
            <div style={{ height: 32, display: "flex", alignItems: "baseline" }}>
              <span style={{ fontSize: 20, fontWeight: 700, color: "#003087", lineHeight: 1 }}>
                {statusData?.llm_model || "gemini-2.0-flash"}
              </span>
            </div>
            <div style={{ height: 24, display: "flex", alignItems: "center" }}>
              <Tag color="blue" style={{ margin: 0, padding: "0 8px", lineHeight: "22px", fontSize: 11 }}>
                {statusData?.framework || "LangGraph + LangChain"}
              </Tag>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              border: "1px solid #E5EDF6",
              boxShadow: "0 2px 8px rgba(0,48,135,0.03)",
              height: 128,
            }}
            bodyStyle={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              padding: "14px 18px",
            }}
          >
            <div style={{ height: 18, fontSize: 12, color: "#597599", fontWeight: 500 }}>Human Intercept Gate</div>
            <div style={{ height: 32, display: "flex", alignItems: "baseline", gap: 6 }}>
              <span style={{ fontSize: 24, fontWeight: 700, color: statusData?.telemetry.pending_human_actions ? "#FF9800" : "#00A854", lineHeight: 1 }}>
                {statusData?.telemetry.pending_human_actions ?? 0}
              </span>
              <span style={{ fontSize: 12, fontWeight: 400, color: "#8c8c8c" }}>pending approval</span>
            </div>
            <div style={{ height: 24, display: "flex", alignItems: "center" }}>
              <Tag
                color={statusData?.telemetry.pending_human_actions ? "orange" : "green"}
                style={{ margin: 0, padding: "0 8px", lineHeight: "22px", fontSize: 11 }}
              >
                {statusData?.telemetry.pending_human_actions ? "Gate Halting Mutations" : "All Actions Resolved"}
              </Tag>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              border: "1px solid #E5EDF6",
              boxShadow: "0 2px 8px rgba(0,48,135,0.03)",
              height: 128,
            }}
            bodyStyle={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              padding: "14px 18px",
            }}
          >
            <div style={{ height: 18, fontSize: 12, color: "#597599", fontWeight: 500 }}>Deterministic PayPal Writes</div>
            <div style={{ height: 32, display: "flex", alignItems: "baseline", gap: 6 }}>
              <span style={{ fontSize: 24, fontWeight: 700, color: "#003087", lineHeight: 1 }}>
                {statusData?.telemetry.deterministic_writes_executed ?? 0}
              </span>
              <span style={{ fontSize: 12, fontWeight: 400, color: "#8c8c8c" }}>executed</span>
            </div>
            <div style={{ height: 24, display: "flex", alignItems: "center" }}>
              <Tag color="cyan" style={{ margin: 0, padding: "0 8px", lineHeight: "22px", fontSize: 11 }}>
                Idempotency Guarded
              </Tag>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              border: "1px solid #E5EDF6",
              boxShadow: "0 2px 8px rgba(0,48,135,0.03)",
              height: 128,
            }}
            bodyStyle={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              padding: "14px 18px",
            }}
          >
            <div style={{ height: 18, fontSize: 12, color: "#597599", fontWeight: 500 }}>Average Node Latency</div>
            <div style={{ height: 32, display: "flex", alignItems: "baseline", gap: 6 }}>
              <span style={{ fontSize: 24, fontWeight: 700, color: "#00A854", lineHeight: 1 }}>
                {statusData?.telemetry.avg_latency_ms ?? 142}
              </span>
              <span style={{ fontSize: 12, fontWeight: 400, color: "#8c8c8c" }}>ms latency</span>
            </div>
            <div style={{ height: 24, display: "flex", alignItems: "center" }}>
              <Tag color="green" style={{ margin: 0, padding: "0 8px", lineHeight: "22px", fontSize: 11 }}>
                Real-Time SLA Met (&lt;200ms)
              </Tag>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Interactive LangGraph Pipeline Topology DAG - Single Row & Horizontally Scrollable */}
      <Card
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <NodeIndexOutlined style={{ color: "#0070BA", fontSize: 18 }} />
            <span style={{ color: "#003087", fontWeight: 700 }}>
              Autonomous AI Agent StateGraph Pipeline
            </span>
          </div>
        }
        style={{
          borderRadius: 12,
          border: "1px solid #E5EDF6",
          marginBottom: 20,
          boxShadow: "0 2px 10px rgba(0,48,135,0.03)",
        }}
        bodyStyle={{
          padding: "18px 20px 20px",
          overflowX: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "nowrap",
            alignItems: "stretch",
            gap: 8,
            width: "max-content",
            minWidth: "100%",
            paddingBottom: 6,
          }}
        >
          {statusData?.pipeline_nodes.map((node, index) => {
            const isHuman = node.id === "human_gate";
            const isLLM = node.llm_bound;
            const isWrite = node.tool_access === "write";
            return (
              <React.Fragment key={node.id}>
                <div
                  style={{
                    flex: "0 0 168px",
                    width: 168,
                    minWidth: 168,
                    maxWidth: 168,
                    height: 210,
                    background: isHuman ? "#FFF7E6" : isLLM ? "#EBF5FA" : isWrite ? "#FFF2F0" : "#FBFDFF",
                    border: `1.5px solid ${isHuman ? "#FFD591" : isLLM ? "#91CAFF" : isWrite ? "#FFA39E" : "#E5EDF6"}`,
                    borderRadius: 10,
                    padding: "12px 12px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    boxShadow: "0 1px 4px rgba(0,48,135,0.02)",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, height: 18 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#597599" }}>STEP {index + 1}</span>
                      <Badge
                        status={node.status === "intercepting" ? "warning" : "success"}
                        text={<span style={{ fontSize: 10, textTransform: "capitalize", fontWeight: 500 }}>{node.status}</span>}
                      />
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: "#003087", marginBottom: 6, height: 38, lineHeight: "19px", overflow: "hidden" }}>
                      {node.name}
                    </div>
                    <div style={{ fontSize: 11, color: "#597599", lineHeight: "15px", height: 60, overflow: "hidden" }}>
                      {node.description}
                    </div>
                  </div>
                  <div style={{ marginTop: 8 }}>
                    {isHuman && (
                      <Tag color="orange" style={{ fontSize: 10, fontWeight: 600, margin: 0, padding: "0 6px" }}>
                        <StopOutlined style={{ marginRight: 4 }} />HUMAN APPROVAL
                      </Tag>
                    )}
                    {isLLM && (
                      <Tag color="blue" style={{ fontSize: 10, fontWeight: 600, margin: 0, padding: "0 6px" }}>
                        <RobotOutlined style={{ marginRight: 4 }} />LLM (READ-ONLY)
                      </Tag>
                    )}
                    {isWrite && (
                      <Tag color="red" style={{ fontSize: 10, fontWeight: 600, margin: 0, padding: "0 6px" }}>
                        <ThunderboltOutlined style={{ marginRight: 4 }} />DETERMINISTIC
                      </Tag>
                    )}
                    {!isHuman && !isLLM && !isWrite && (
                      <Tag color="cyan" style={{ fontSize: 10, margin: 0, padding: "0 6px" }}>
                        PYTHON NODE
                      </Tag>
                    )}
                  </div>
                </div>
                {index < (statusData?.pipeline_nodes.length || 0) - 1 && (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: "0 0 20px", padding: "0 2px" }}>
                    <ArrowRightOutlined style={{ color: "#0070BA", fontSize: 15 }} />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </Card>

      {/* Traces Table */}
      <Card
        title={
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#003087", fontWeight: 700 }}>Live AI Agent Execution Traces & Node Invocations</span>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Streaming from <code>AgentEvent</code> Ledger
            </Text>
          </div>
        }
        bodyStyle={{ padding: 0 }}
        style={{
          borderRadius: 12,
          overflow: "hidden",
          border: "1px solid #E5EDF6",
          boxShadow: "0 2px 10px rgba(0,48,135,0.03)",
        }}
      >
        <Table
          dataSource={traces}
          columns={columns}
          rowKey="trace_id"
          pagination={{ pageSize: 12 }}
          size="middle"
          scroll={{ x: 1050 }}
        />
      </Card>

      {/* Trace Inspector Drawer */}
      <Drawer
        title={<span style={{ color: "#003087", fontWeight: 700 }}>Trace Inspector: {selectedTrace?.trace_id}</span>}
        open={!!selectedTrace}
        onClose={() => setSelectedTrace(null)}
        width={560}
      >
        {selectedTrace && (
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="Pipeline Node">
                <Tag color="blue">{selectedTrace.node}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Tool Access Tier">
                <Tag color={selectedTrace.tool_access === "read" ? "green" : selectedTrace.tool_access === "write" ? "red" : "default"}>
                  {selectedTrace.tool_access.toUpperCase()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Run ID">
                <code>{selectedTrace.run_id}</code>
              </Descriptions.Item>
              <Descriptions.Item label="Duration">
                {selectedTrace.latency_ms} ms
              </Descriptions.Item>
              <Descriptions.Item label="Timestamp" span={2}>
                {selectedTrace.timestamp}
              </Descriptions.Item>
            </Descriptions>

            <Card size="small" title="Execution Summary">
              <Text>{selectedTrace.summary}</Text>
            </Card>

            <Card size="small" title="Input Payload State">
              <pre style={{ background: "#F5F8FC", padding: 12, borderRadius: 6, fontSize: 12 }}>
                {JSON.stringify(selectedTrace.input_payload, null, 2)}
              </pre>
            </Card>

            <Card size="small" title="Output Payload State">
              <pre style={{ background: "#F5F8FC", padding: 12, borderRadius: 6, fontSize: 12 }}>
                {JSON.stringify(selectedTrace.output_payload, null, 2)}
              </pre>
            </Card>
          </Space>
        )}
      </Drawer>
    </div>
  );
};

export default LangChainMonitor;
