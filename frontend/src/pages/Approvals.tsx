import React, { useEffect, useState } from "react";
import { Table, Button, Tag, Popconfirm, Progress, Space, Typography, message, Card, Row, Col, Alert } from "antd";
import { CheckOutlined, CloseOutlined, SafetyCertificateOutlined, ThunderboltOutlined, InfoCircleOutlined, InboxOutlined, SyncOutlined } from "@ant-design/icons";
import api from "../api/client";
import { useAuth } from "../auth/context";
import { usePortfolio } from "../context/PortfolioContext";

const { Title, Text } = Typography;

interface ActionRow {
  id: number;
  entity_type: string;
  entity_id: number;
  action_type: string;
  status: string;
  rationale: string;
  cost_estimate: number | null;
  benefit_estimate: number | null;
  paypal_request_id: string | null;
}

const Approvals: React.FC = () => {
  const [actions, setActions] = useState<ActionRow[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);
  const [loading, setLoading] = useState(true);
  const [deciding, setDeciding] = useState(false);
  const [stats, setStats] = useState({ writes_today: 0, max_daily_writes: 200 });
  const { user } = useAuth();
  const { selectedMerchant } = usePortfolio();

  const fetchData = async () => {
    try {
      const merchantParam = selectedMerchant !== "all" ? { merchant_id: Number(selectedMerchant) } : {};
      const [actRes, statsRes] = await Promise.all([
        api.get("/actions", { params: { status: "pending_approval", ...merchantParam } }),
        api.get("/dashboard/stats", { params: merchantParam }),
      ]);
      setActions(actRes.data);
      setStats({ writes_today: statsRes.data.writes_today, max_daily_writes: statsRes.data.max_daily_writes });
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedMerchant]);

  const handleDecide = async (decision: "approved" | "rejected") => {
    if (selectedKeys.length === 0) {
      message.warning("Select actions to approve or reject");
      return;
    }
    setDeciding(true);
    try {
      const res = await api.post("/actions/decide", {
        action_ids: selectedKeys.map(Number),
        decision,
      });
      message.success(
        `Successfully ${decision} ${res.data.count} actions! PayPal-Request-Id assigned for idempotent execution.`
      );
      setSelectedKeys([]);
      fetchData();
    } catch (err: any) {
      message.error(err.response?.data?.detail || "Action decision failed");
    } finally {
      setDeciding(false);
    }
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 75,
      align: "center" as const,
      render: (v: number) => <span style={{ color: "#597599", fontWeight: 500 }}>#{v}</span>,
    },
    {
      title: "Entity Reference",
      key: "entity",
      width: 175,
      render: (_: any, r: ActionRow) => {
        const isOrder = r.entity_type === "order";
        return (
          <Tag color={isOrder ? "blue" : "purple"} style={{ padding: "2px 8px", fontSize: 12, margin: 0 }}>
            {isOrder ? <InboxOutlined style={{ marginRight: 4 }} /> : <SyncOutlined style={{ marginRight: 4 }} />}
            {isOrder ? "Order" : "Subscription"} #{r.entity_id}
          </Tag>
        );
      },
    },
    {
      title: "Proposed Action",
      dataIndex: "action_type",
      key: "action_type",
      width: 195,
      render: (v: string) => (
        <Tag color="geekblue" style={{ padding: "2px 8px", fontSize: 12, margin: 0, fontWeight: 500 }}>
          {v?.replace("_", " ")?.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "Agent Rationale",
      dataIndex: "rationale",
      key: "rationale",
      minWidth: 320,
      render: (text: string) => <Text style={{ fontSize: 13, color: "#1D2D44" }}>{text}</Text>,
    },
    {
      title: "Est. Cost",
      dataIndex: "cost_estimate",
      key: "cost",
      width: 120,
      align: "right" as const,
      render: (v: number | null) => (
        <span style={{ color: "#597599", fontWeight: 500 }}>
          ${v != null ? v.toFixed(2) : "0.00"}
        </span>
      ),
    },
    {
      title: "Projected Benefit",
      dataIndex: "benefit_estimate",
      key: "benefit",
      width: 190,
      render: (v: number | null) => (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: 150,
          }}
        >
          <span style={{ color: "#00A854", fontWeight: 600, fontSize: 13, width: 75, textAlign: "left" }}>
            ${v != null ? v.toFixed(2) : "0.00"}
          </span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 500,
              color: "#0070BA",
              background: "#E6F4FF",
              border: "1px solid #91CAFF",
              padding: "1px 8px",
              borderRadius: 12,
              lineHeight: "16px",
              display: "inline-block",
              textAlign: "center",
            }}
          >
            modeled
          </span>
        </div>
      ),
    },
  ];

  const isApprover = user?.role === "approver";

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <Title level={3} style={{ color: "#003087", margin: 0, fontWeight: 700 }}>
            Human-in-the-Loop Approval Queue
          </Title>
          <Text style={{ color: "#597599", fontSize: 13 }}>
            Review and authoritatively approve or reject AI-recommended protective interventions.
          </Text>
        </div>
        <Tag color="cyan" style={{ padding: "4px 10px", fontSize: 12 }}>
          <SafetyCertificateOutlined style={{ marginRight: 6 }} />
          Enforcing Non-Negotiable Hardening
        </Tag>
      </div>

      {/* Top Status & Controls */}
      <Card
        style={{
          borderRadius: 12,
          border: "1px solid #E5EDF6",
          marginBottom: 20,
          boxShadow: "0 2px 10px rgba(0,48,135,0.03)",
        }}
      >
        <Row gutter={[24, 16]} align="middle">
          <Col xs={24} md={12}>
            <div style={{ marginBottom: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Text strong style={{ color: "#0F2644", fontSize: 13 }}>
                Daily PayPal Write Rate Cap
              </Text>
              <span style={{ color: "#597599", fontSize: 12 }}>
                {stats.writes_today} of {stats.max_daily_writes} writes used
              </span>
            </div>
            <Progress
              percent={Math.round((stats.writes_today / stats.max_daily_writes) * 100)}
              strokeColor={{ "0%": "#0070BA", "100%": "#00CF65" }}
            />
          </Col>

          <Col xs={24} md={12} style={{ textAlign: "right" }}>
            {isApprover ? (
              <Space size="middle">
                <Popconfirm
                  title={`Approve ${selectedKeys.length} selected action(s)?`}
                  description="This will execute live PayPal Sandbox mutations with idempotency guarantees."
                  onConfirm={() => handleDecide("approved")}
                  disabled={selectedKeys.length === 0}
                >
                  <Button
                    type="primary"
                    icon={<CheckOutlined />}
                    disabled={selectedKeys.length === 0}
                    loading={deciding}
                    style={
                      selectedKeys.length > 0
                        ? {
                            background: "#00A854",
                            borderColor: "#00A854",
                            color: "#FFFFFF",
                            fontWeight: 600,
                            height: 38,
                            borderRadius: 6,
                            boxShadow: "0 2px 6px rgba(0, 168, 84, 0.25)",
                          }
                        : {
                            background: "#F5F5F5",
                            borderColor: "#D9D9D9",
                            color: "rgba(0, 0, 0, 0.25)",
                            height: 38,
                            borderRadius: 6,
                            fontWeight: 500,
                          }
                    }
                  >
                    Approve Selected ({selectedKeys.length})
                  </Button>
                </Popconfirm>

                <Popconfirm
                  title={`Reject ${selectedKeys.length} selected action(s)?`}
                  onConfirm={() => handleDecide("rejected")}
                  disabled={selectedKeys.length === 0}
                >
                  <Button
                    danger
                    icon={<CloseOutlined />}
                    disabled={selectedKeys.length === 0}
                    loading={deciding}
                    style={{
                      height: 38,
                      borderRadius: 6,
                      fontWeight: selectedKeys.length > 0 ? 600 : 500,
                    }}
                  >
                    Reject Selected
                  </Button>
                </Popconfirm>
              </Space>
            ) : (
              <Alert
                type="warning"
                message="Viewer Role: Read-only access. Only users with the Approver role can authorize PayPal writes."
                showIcon
              />
            )}
          </Col>
        </Row>
      </Card>

      {/* Actions Table */}
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
          dataSource={actions}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 15 }}
          scroll={{ x: 1100 }}
          rowSelection={
            isApprover
              ? {
                  selectedRowKeys: selectedKeys,
                  onChange: setSelectedKeys,
                }
              : undefined
          }
        />
      </Card>
    </div>
  );
};

export default Approvals;
