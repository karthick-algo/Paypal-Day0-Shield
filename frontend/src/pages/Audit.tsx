import React, { useEffect, useState } from "react";
import { Table, Card, Row, Col, Statistic, Typography, Tag, Spin, Space, Badge } from "antd";
import {
  CheckCircleOutlined,
  WarningOutlined,
  ClockCircleOutlined,
  SafetyCertificateOutlined,
  LockOutlined,
  DatabaseOutlined,
  ApiOutlined,
} from "@ant-design/icons";
import api from "../api/client";

const { Title, Text } = Typography;

const Audit: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [logRes, metricRes] = await Promise.all([
        api.get("/audit"),
        api.get("/admin/metrics"),
      ]);
      setLogs(logRes.data);
      setMetrics(metricRes.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const columns = [
    {
      title: "Timestamp",
      dataIndex: "ts",
      key: "ts",
      width: 195,
      render: (v: string) => <span style={{ fontSize: 12, color: "#597599" }}>{v}</span>,
    },
    {
      title: "User Ref",
      dataIndex: "user_id",
      key: "user",
      width: 120,
      render: (v: number | null) => (v ? <Tag color="blue" style={{ margin: 0 }}>User #{v}</Tag> : <Text type="secondary">System</Text>),
    },
    {
      title: "Client IP",
      dataIndex: "ip",
      key: "ip",
      width: 130,
      render: (v: string) => <span style={{ fontFamily: "monospace", fontSize: 12 }}>{v}</span>,
    },
    {
      title: "Event Type",
      dataIndex: "event",
      key: "event",
      width: 190,
      render: (v: string) => {
        const isSuccess = v.includes("success") || v.includes("approved") || v.includes("executed");
        const isFail = v.includes("fail") || v.includes("locked") || v.includes("reject");
        return (
          <Tag color={isSuccess ? "green" : isFail ? "red" : "blue"} style={{ fontWeight: 600, margin: 0 }}>
            {v.toUpperCase()}
          </Tag>
        );
      },
    },
    {
      title: "Entity Scope",
      key: "entity",
      width: 160,
      render: (_: any, r: any) =>
        r.entity_type ? (
          <Tag color="geekblue" style={{ margin: 0 }}>{r.entity_type} #{r.entity_id}</Tag>
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
    {
      title: "Audit Detail Payload",
      dataIndex: "detail_json",
      key: "detail",
      minWidth: 300,
      render: (text: string | null) => (
        <span style={{ fontFamily: "monospace", fontSize: 11, color: "#0F2644" }}>
          {text || "-"}
        </span>
      ),
    },
  ];

  if (loading) return <Spin size="large" style={{ display: "block", margin: "100px auto" }} />;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <Title level={3} style={{ color: "#003087", margin: 0, fontWeight: 700 }}>
            Audit Log & System Telemetry
          </Title>
          <Text style={{ color: "#597599", fontSize: 13 }}>
            Append-Only Compliance Ledger • Tracks Authentications, Human Decisions & Idempotent PayPal Invocations
          </Text>
        </div>
        <Tag color="green" style={{ padding: "4px 8px" }}>
          <LockOutlined style={{ marginRight: 6 }} />
          Immutable DB Log
        </Tag>
      </div>

      {/* Health Metrics */}
      {metrics && (
        <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
          <Col xs={12} sm={6}>
            <Card style={{ borderRadius: 12, border: "1px solid #E5EDF6" }}>
              <Statistic
                title="Job Queue Depth"
                value={metrics.queue_depth}
                prefix={<ClockCircleOutlined style={{ color: "#0070BA" }} />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card style={{ borderRadius: 12, border: "1px solid #E5EDF6" }}>
              <Statistic
                title="Failed Jobs"
                value={metrics.failed_jobs}
                prefix={<WarningOutlined style={{ color: metrics.failed_jobs > 0 ? "#D9381E" : "#00A854" }} />}
                valueStyle={{ color: metrics.failed_jobs > 0 ? "#D9381E" : "#00A854" }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card style={{ borderRadius: 12, border: "1px solid #E5EDF6" }}>
              <Statistic
                title="Webhook Backlog"
                value={metrics.webhook_backlog}
                prefix={<ApiOutlined style={{ color: "#003087" }} />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card style={{ borderRadius: 12, border: "1px solid #E5EDF6" }}>
              <Statistic
                title="Daily PayPal Writes"
                value={metrics.writes_today}
                suffix={`/ ${metrics.max_daily_writes}`}
                prefix={<CheckCircleOutlined style={{ color: "#00A854" }} />}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Audit Log Table */}
      <Card
        bodyStyle={{ padding: 0 }}
        style={{
          borderRadius: 12,
          overflow: "hidden",
          border: "1px solid #E5EDF6",
          boxShadow: "0 2px 10px rgba(0,48,135,0.03)",
        }}
      >
        <Table
          dataSource={logs}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 15 }}
          size="small"
          scroll={{ x: 1100 }}
        />
      </Card>
    </div>
  );
};

export default Audit;
