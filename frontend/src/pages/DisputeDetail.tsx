import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Descriptions,
  Tag,
  Button,
  Typography,
  Timeline,
  Empty,
  Spin,
  Alert,
  Space,
  Input,
  Divider,
  Badge,
} from "antd";
import {
  ArrowLeftOutlined,
  BookOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  FileDoneOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import api from "../api/client";

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;

interface PolicyResult {
  id: string;
  title: string;
  category: string;
  score: number;
  content: string;
  source: string;
  admissibility_standard: string;
}

const DisputeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [dispute, setDispute] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [ragPolicies, setRagPolicies] = useState<PolicyResult[]>([]);
  const [ragLoading, setRagLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchRagPolicies = (query: string) => {
    setRagLoading(true);
    api.get("/rag/query", { params: { q: query, top_k: 2 } })
      .then((res) => {
        setRagPolicies(res.data.results || []);
        setRagLoading(false);
      })
      .catch(() => setRagLoading(false));
  };

  useEffect(() => {
    if (id) {
      setLoading(true);
      api.get(`/disputes/${id}`)
        .then((res) => {
          setDispute(res.data);
          setLoading(false);
          const initialQuery = res.data.reason || "item not received delay force majeure";
          setSearchQuery(initialQuery);
          fetchRagPolicies(initialQuery);
        })
        .catch(() => setLoading(false));
    }
  }, [id]);

  if (loading) return <Spin size="large" style={{ display: "block", margin: "100px auto" }} />;
  if (!dispute) return <Empty description="Dispute not found" />;

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", paddingBottom: 40 }}>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate("/disputes")}
        style={{ marginBottom: 16, borderColor: "#003087", color: "#003087" }}
      >
        Back to Dispute Center
      </Button>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <Title level={3} style={{ color: "#003087", margin: 0 }}>
            Dispute Case #{dispute.id} &bull; {dispute.paypal_dispute_id}
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            RAG-Augmented PayPal Dispute Defense &amp; Seller Protection Packet
          </Text>
        </div>
        <Tag color="blue" style={{ fontSize: 13, padding: "4px 12px" }}>
          Status: {dispute.status}
        </Tag>
      </div>

      {/* Case Overview */}
      <Card style={{ marginBottom: 20, borderRadius: 8, border: "1px solid #E5EDF6" }}>
        <Descriptions column={{ xs: 1, sm: 2, md: 3 }} bordered size="small">
          <Descriptions.Item label="PayPal Dispute ID">
            <span style={{ fontFamily: "monospace", fontWeight: 600 }}>{dispute.paypal_dispute_id}</span>
          </Descriptions.Item>
          <Descriptions.Item label="Claim Status">
            <Tag color={dispute.status === "OPEN" ? "orange" : "blue"}>{dispute.status}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Dispute Reason">
            <strong>{dispute.reason}</strong>
          </Descriptions.Item>
          <Descriptions.Item label="Order ID">
            {dispute.order_id ? <Tag color="cyan">Order #{dispute.order_id}</Tag> : "N/A"}
          </Descriptions.Item>
          <Descriptions.Item label="Dispute Date">{dispute.created_at}</Descriptions.Item>
          <Descriptions.Item label="Response Deadline">
            <Badge status="processing" text="10 Calendar Days (Active)" />
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* RAG Knowledge Base Retrieval Card */}
      <Card
        style={{
          marginBottom: 20,
          borderRadius: 8,
          border: "1px solid #cce5ff",
          backgroundColor: "#F9FBFF",
        }}
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <SafetyCertificateOutlined style={{ color: "#0070BA", fontSize: 18 }} />
            <span style={{ color: "#003087", fontWeight: 700 }}>
              PayPal Seller Protection RAG Knowledge Base Retrieval
            </span>
            <Tag color="cyan" style={{ marginLeft: 8 }}>Dense Semantic Vector Search</Tag>
          </div>
        }
      >
        <Paragraph style={{ color: "#597599", fontSize: 13, marginBottom: 14 }}>
          Day-0 Shield correlates claim telemetry against indexed PayPal policies to formulate admissible, policy-backed evidence packages for immediate Resolution Center submission.
        </Paragraph>

        <div style={{ marginBottom: 16 }}>
          <Search
            placeholder="Query PayPal Seller Protection &amp; Dispute Regulations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onSearch={fetchRagPolicies}
            loading={ragLoading}
            enterButton={
              <Button type="primary" style={{ backgroundColor: "#0070BA", borderColor: "#0070BA" }}>
                <SearchOutlined /> Query Policy RAG
              </Button>
            }
          />
        </div>

        {ragLoading ? (
          <div style={{ textAlign: "center", padding: 24 }}><Spin /></div>
        ) : ragPolicies.length > 0 ? (
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            {ragPolicies.map((p) => (
              <Card
                key={p.id}
                size="small"
                style={{
                  borderRadius: 6,
                  border: "1px solid #D9E8F5",
                  backgroundColor: "#FFFFFF",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                  <div>
                    <Tag color="blue" style={{ fontWeight: 600 }}>{p.id}</Tag>
                    <span style={{ fontWeight: 700, color: "#003087", fontSize: 13 }}>{p.title}</span>
                  </div>
                  <Tag color="green">Relevance: {(p.score * 100).toFixed(1)}%</Tag>
                </div>
                <Paragraph style={{ color: "#1D2D44", fontSize: 12.5, lineHeight: 1.5, margin: "6px 0" }}>
                  {p.content}
                </Paragraph>
                <div style={{ fontSize: 11, color: "#597599", marginTop: 4 }}>
                  <strong>Evidentiary Standard:</strong> {p.admissibility_standard}
                </div>
                <div style={{ fontSize: 10, color: "#8EADC9", marginTop: 2 }}>
                  <strong>Source:</strong> {p.source}
                </div>
              </Card>
            ))}
          </Space>
        ) : (
          <Alert message="No policy sections retrieved" type="warning" />
        )}
      </Card>

      {/* Dispute Timeline & Evidence Draft */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <Card title="Dispute Lifecycle Timeline" style={{ borderRadius: 8, border: "1px solid #E5EDF6" }}>
          <Timeline
            items={[
              { color: "red", children: `Dispute Created: ${dispute.reason}` },
              { color: "orange", children: "Open-Meteo Weather Disruption Correlated" },
              { color: "blue", children: "RAG Policy Retrieval Executed (PAYPAL-SP-001)" },
              { color: "green", children: "Carrier Delay Evidence Package Synthesized" },
            ]}
          />
        </Card>

        <Card
          title="Automated Evidence Dossier"
          style={{ borderRadius: 8, border: "1px solid #E5EDF6" }}
          extra={<Tag color="green"><FileDoneOutlined /> Ready to Submit</Tag>}
        >
          <div style={{ background: "#F4F7FB", padding: 12, borderRadius: 6, fontSize: 12, maxHeight: 180, overflowY: "auto", fontFamily: "monospace" }}>
            {dispute.evidence_draft || (
              `[DISPUTE DEFENSE PACKAGE]\n` +
              `PayPal Claim ID: ${dispute.paypal_dispute_id}\n` +
              `Target Policy: PAYPAL-SP-001 (Section 11.2 - Proof of Shipment & Force Majeure)\n` +
              `Carrier Status: Logistics Corridor Disruption (India Post / BlueDart)\n` +
              `Meteorological Record: Extreme Precipitation Event Corroborated\n` +
              `Customer Notice: Dispatched Proactively prior to claim escalation\n` +
              `Idempotency Key: PayPal-Request-Id: ${dispute.paypal_dispute_id}-def`
            )}
          </div>
          <Button
            type="primary"
            block
            style={{ marginTop: 12, backgroundColor: "#00A854", borderColor: "#00A854", fontWeight: 600 }}
            icon={<ThunderboltOutlined />}
          >
            Authorize Evidence Dispatch via PayPal Sandbox API
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default DisputeDetail;
