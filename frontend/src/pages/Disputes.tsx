import React, { useEffect, useState } from "react";
import { Table, Tag, Typography, Card, Button, Space, Badge, Alert } from "antd";
import { useNavigate } from "react-router-dom";
import { ExclamationCircleOutlined, EyeOutlined, CheckCircleOutlined } from "@ant-design/icons";
import api from "../api/client";
import { usePortfolio } from "../context/PortfolioContext";

const { Title, Text } = Typography;

const statusColors: Record<string, string> = {
  OPEN: "orange",
  UNDER_REVIEW: "blue",
  RESOLVED: "green",
  CLOSED: "default",
  WAITING_FOR_SELLER_RESPONSE: "volcano",
};

const Disputes: React.FC = () => {
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { selectedMerchant } = usePortfolio();
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    const params = selectedMerchant !== "all" ? { merchant_id: Number(selectedMerchant) } : {};
    api.get("/disputes", { params })
      .then((res) => {
        setDisputes(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [selectedMerchant]);

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
      title: "PayPal Dispute ID",
      dataIndex: "paypal_dispute_id",
      key: "ppid",
      width: 230,
      render: (v: string) => <span style={{ fontFamily: "monospace", fontWeight: 600 }}>{v}</span>,
    },
    {
      title: "Order Reference",
      dataIndex: "order_id",
      key: "order",
      width: 160,
      render: (v: number | null) => (v ? <Tag color="blue" style={{ margin: 0 }}>Order #{v}</Tag> : <Text type="secondary">-</Text>),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 170,
      render: (v: string) => <Tag color={statusColors[v] || "default"} style={{ margin: 0, fontWeight: 500 }}>{v?.replace("_", " ")}</Tag>,
    },
    {
      title: "Dispute Reason",
      dataIndex: "reason",
      key: "reason",
      minWidth: 220,
      ellipsis: true,
      render: (v: string) => <Text style={{ color: "#1D2D44", fontSize: 13 }}>{v}</Text>,
    },
    {
      title: "Received Date",
      dataIndex: "created_at",
      key: "created",
      width: 190,
      render: (v: string) => <span style={{ color: "#597599", fontSize: 12 }}>{v}</span>,
    },
    {
      title: "Action",
      key: "act",
      width: 120,
      align: "center" as const,
      render: (_: any, r: any) => (
        <Button size="small" type="link" icon={<EyeOutlined />} onClick={() => navigate(`/disputes/${r.id}`)}>
          View Case
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <Title level={3} style={{ color: "#003087", margin: 0, fontWeight: 700 }}>
            PayPal Dispute Resolution Center
          </Title>
          <Text style={{ color: "#597599", fontSize: 13 }}>
            Monitor, defend, and autonomously compile evidence packages for weather-related "Item Not Received" claims.
          </Text>
        </div>
        <Tag color="cyan">Webhook Automated Ingestion</Tag>
      </div>

      <Alert
        type="info"
        showIcon
        message="Automated Dispute Evidence Compiler Active"
        description="When weather hazards cause delayed transit, Day-0 Shield pre-packages shipping tracking notes, official meteorological advisory records, and merchant proactive notices into defense dossiers ready for one-click submission."
        style={{ marginBottom: 20, borderRadius: 10 }}
      />

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
          dataSource={disputes}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 15 }}
          scroll={{ x: 1050 }}
          locale={{
            emptyText: (
              <div style={{ padding: "40px 0", textAlign: "center" }}>
                <CheckCircleOutlined style={{ fontSize: 36, color: "#00A854", marginBottom: 12 }} />
                <div style={{ fontWeight: 600, color: "#003087", fontSize: 15 }}>No Open Disputes</div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  All orders are operating smoothly. In a live scenario, buyer claims will appear here instantly via PayPal Webhooks.
                </Text>
              </div>
            ),
          }}
        />
      </Card>
    </div>
  );
};

export default Disputes;
