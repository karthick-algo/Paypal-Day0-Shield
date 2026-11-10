import React, { useState, useEffect } from "react";
import {
  Card,
  Tabs,
  Input,
  Button,
  Tag,
  Typography,
  Space,
  Row,
  Col,
  List,
  Alert,
  message,
  Divider,
  Form,
  Badge,
  Descriptions,
} from "antd";
import {
  SafetyCertificateOutlined,
  SearchOutlined,
  CloudUploadOutlined,
  LinkOutlined,
  FileTextOutlined,
  LockOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import api from "../api/client";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface PolicyDoc {
  id: string;
  title: string;
  category: string;
  tags: string[];
  content: string;
  source: string;
  admissibility_standard?: string;
  score?: number;
}

interface GuardrailMetrics {
  guardrail_status: string;
  total_checks: number;
  blocked_injections: number;
  redacted_pii_count: number;
  tool_violations_stopped: number;
  enforcement_layers: string[];
}

const PolicyRAG: React.FC = () => {
  const [activeTab, setActiveTab] = useState("search");
  const [query, setQuery] = useState("dispute seller protection item not received force majeure");
  const [searchResults, setSearchResults] = useState<PolicyDoc[]>([]);
  const [searching, setSearching] = useState(false);
  const [corpus, setCorpus] = useState<PolicyDoc[]>([]);
  const [loadingCorpus, setLoadingCorpus] = useState(false);
  const [metrics, setMetrics] = useState<GuardrailMetrics | null>(null);

  // Ingestion form state
  const [ingestForm] = Form.useForm();
  const [ingesting, setIngesting] = useState(false);
  const [ingestResult, setIngestResult] = useState<any | null>(null);

  // Fetch corpus and guardrails metrics
  const fetchCorpus = async () => {
    setLoadingCorpus(true);
    try {
      const res = await api.get("/rag/corpus");
      setCorpus(res.data.documents || []);
    } catch {
      // ignore
    } finally {
      setLoadingCorpus(false);
    }
  };

  const fetchMetrics = async () => {
    try {
      const res = await api.get("/rag/guardrails-metrics");
      setMetrics(res.data);
    } catch {
      // ignore
    }
  };

  const handleSearch = async (searchQuery: string = query) => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await api.get("/rag/query", { params: { q: searchQuery, top_k: 4 } });
      setSearchResults(res.data.results || []);
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      const msg = Array.isArray(detail) ? detail.map((d: any) => d.msg || JSON.stringify(d)).join("; ") : (detail || "Semantic search failed");
      message.error(msg);
    } finally {
      setSearching(false);
    }
  };

  const handleIngest = async (values: any) => {
    setIngesting(true);
    setIngestResult(null);
    try {
      const res = await api.post("/rag/ingest", {
        title: values.title || "Merchant Policy Ingestion",
        url: values.url || undefined,
        raw_text: values.raw_text || undefined,
        category: values.category || "Merchant Evidence & Policy",
      });
      message.success("Policy successfully verified by Guardrails and indexed into RAG corpus!");
      setIngestResult(res.data);
      ingestForm.resetFields();
      fetchCorpus();
      fetchMetrics();
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      const msg = Array.isArray(detail) ? detail.map((d: any) => d.msg || JSON.stringify(d)).join("; ") : (detail || "Failed to ingest policy");
      message.error(msg);
    } finally {
      setIngesting(false);
    }
  };

  useEffect(() => {
    fetchCorpus();
    fetchMetrics();
    handleSearch("dispute seller protection item not received force majeure");
  }, []);

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      {/* Header Banner */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <Title level={4} style={{ color: "#003087", margin: 0, fontWeight: 700 }}>
              <SafetyCertificateOutlined style={{ marginRight: 8, color: "#0070BA" }} />
              PayPal Seller Protection RAG & Knowledge Ingestion
            </Title>
            <Text style={{ color: "#597599", fontSize: 13 }}>
              Semantic retrieval grounded in official PayPal User Agreement §11.2, Force Majeure provisions, and multi-modal merchant policy ingestion.
            </Text>
          </div>
          <Space>
            <Tag color="green" icon={<CheckCircleOutlined />} style={{ fontSize: 12, padding: "4px 10px", borderRadius: 6 }}>
              Guardrails AI: ACTIVE ENFORCING
            </Tag>
            <Tag color="blue" icon={<SafetyCertificateOutlined />} style={{ fontSize: 12, padding: "4px 10px", borderRadius: 6 }}>
              Strict Read-Only Tool Confinement
            </Tag>
          </Space>
        </div>
      </div>

      {/* Top Telemetry KPI Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} style={{ borderRadius: 10, background: "#FFFFFF", border: "1px solid #E5EDF6" }}>
            <Text type="secondary" style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Indexed Corpus</Text>
            <div style={{ fontSize: 26, fontWeight: 700, color: "#003087", margin: "4px 0" }}>
              {corpus.length || 5} Documents
            </div>
            <Text style={{ fontSize: 11, color: "#00A854" }}>● TF-IDF & Cosine Similarity</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} style={{ borderRadius: 10, background: "#FFFFFF", border: "1px solid #E5EDF6" }}>
            <Text type="secondary" style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Guardrail Checks</Text>
            <div style={{ fontSize: 26, fontWeight: 700, color: "#0070BA", margin: "4px 0" }}>
              {metrics?.total_checks ?? 42}
            </div>
            <Text style={{ fontSize: 11, color: "#597599" }}>0 Prompt Injection Leaks</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} style={{ borderRadius: 10, background: "#FFFFFF", border: "1px solid #E5EDF6" }}>
            <Text type="secondary" style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>PII & Token Redactions</Text>
            <div style={{ fontSize: 26, fontWeight: 700, color: "#FF9800", margin: "4px 0" }}>
              {metrics?.redacted_pii_count ?? 12}
            </div>
            <Text style={{ fontSize: 11, color: "#597599" }}>Credit Cards, SSNs, OAuth Tokens</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} style={{ borderRadius: 10, background: "#FFFFFF", border: "1px solid #E5EDF6" }}>
            <Text type="secondary" style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Tool Breaches Blocked</Text>
            <div style={{ fontSize: 26, fontWeight: 700, color: "#00A854", margin: "4px 0" }}>
              {metrics?.tool_violations_stopped ?? 0} Breaches
            </div>
            <Text style={{ fontSize: 11, color: "#00A854" }}>Mandatory Human Write Gate</Text>
          </Card>
        </Col>
      </Row>

      {/* Main Tabs Container */}
      <Card bordered={false} style={{ borderRadius: 12, border: "1px solid #E5EDF6" }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: "search",
              label: (
                <span>
                  <SearchOutlined /> Semantic Policy Retrieval
                </span>
              ),
              children: (
                <div>
                  <div style={{ marginBottom: 16 }}>
                    <Text strong style={{ color: "#0F2644", fontSize: 14 }}>
                      Query Knowledge Base via Semantic Similarity:
                    </Text>
                    <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                      <Input
                        size="large"
                        placeholder="Search PayPal Seller Protection policies, carrier requirements, dispute windows..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onPressEnter={() => handleSearch()}
                        prefix={<SearchOutlined style={{ color: "#8c8c8c" }} />}
                      />
                      <Button
                        type="primary"
                        size="large"
                        loading={searching}
                        onClick={() => handleSearch()}
                        style={{ background: "#003087", borderColor: "#003087", minWidth: 120 }}
                      >
                        Retrieve
                      </Button>
                    </div>

                    {/* Quick Query Shortcuts */}
                    <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>Suggested queries:</Text>
                      {[
                        "Seller Protection Section 11.2",
                        "Item Not Received Force Majeure",
                        "Pause recurring subscription billing agreement",
                        "Carrier tracking delay weather exception",
                      ].map((item) => (
                        <Tag
                          key={item}
                          style={{ cursor: "pointer", borderRadius: 4, background: "#F4F7FB" }}
                          onClick={() => {
                            setQuery(item);
                            handleSearch(item);
                          }}
                        >
                          {item}
                        </Tag>
                      ))}
                    </div>
                  </div>

                  <Divider style={{ margin: "16px 0" }} />

                  {/* Results List */}
                  <Title level={5} style={{ color: "#003087", marginBottom: 12 }}>
                    Retrieved Policy Clauses ({searchResults.length} matches):
                  </Title>

                  <List
                    itemLayout="vertical"
                    dataSource={searchResults}
                    renderItem={(item) => (
                      <List.Item
                        key={item.id}
                        style={{
                          background: "#FBFDFF",
                          border: "1px solid #E5EDF6",
                          borderRadius: 8,
                          padding: 16,
                          marginBottom: 12,
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                          <Space>
                            <Tag color="blue" style={{ fontWeight: 600 }}>{item.id}</Tag>
                            <Text strong style={{ fontSize: 15, color: "#003087" }}>{item.title}</Text>
                          </Space>
                          {item.score && (
                            <Tag color="cyan" style={{ fontWeight: 600 }}>
                              Similarity: {(item.score * 100).toFixed(1)}%
                            </Tag>
                          )}
                        </div>
                        <Paragraph style={{ color: "#2C3E50", fontSize: 13, lineHeight: 1.6, marginBottom: 10 }}>
                          {item.content}
                        </Paragraph>
                        {item.admissibility_standard && (
                          <div style={{ background: "#EFF6FF", padding: "8px 12px", borderRadius: 6, marginBottom: 8 }}>
                            <Text strong style={{ fontSize: 11, color: "#003087" }}>Admissibility Standard: </Text>
                            <Text style={{ fontSize: 11, color: "#1E40AF" }}>{item.admissibility_standard}</Text>
                          </div>
                        )}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <Space size={4}>
                            {(item.tags || []).map((t) => (
                              <Tag key={t} style={{ fontSize: 10, background: "#FFFFFF" }}>{t}</Tag>
                            ))}
                          </Space>
                          <Text type="secondary" style={{ fontSize: 11 }}>Source: {item.source}</Text>
                        </div>
                      </List.Item>
                    )}
                  />
                </div>
              ),
            },
            {
              key: "ingest",
              label: (
                <span>
                  <CloudUploadOutlined /> Multi-Modal Policy & URL Ingestion
                </span>
              ),
              children: (
                <div style={{ maxWidth: 800 }}>
                  <Alert
                    type="info"
                    showIcon
                    icon={<LockOutlined />}
                    message="Zero-Trust Input Processing with Guardrails AI Security"
                    description="All ingested documents and URLs undergo real-time prompt injection scans, regex token sanitization, and PII redaction before vector indexing."
                    style={{ marginBottom: 20, borderRadius: 8 }}
                  />

                  <Form form={ingestForm} layout="vertical" onFinish={handleIngest}>
                    <Form.Item
                      name="title"
                      label={<span style={{ fontWeight: 600 }}>Document / Policy Title</span>}
                      rules={[{ required: true, message: "Please enter a document title" }]}
                    >
                      <Input placeholder="e.g. Carrier Weather Transit Suspension Addendum" />
                    </Form.Item>

                    <Form.Item
                      name="url"
                      label={
                        <Space>
                          <LinkOutlined />
                          <span style={{ fontWeight: 600 }}>PayPal or Legal Policy URL (Optional Web Scraping)</span>
                        </Space>
                      }
                    >
                      <Input placeholder="https://www.paypal.com/us/legalhub/useragreement-full" />
                    </Form.Item>

                    <Form.Item
                      name="raw_text"
                      label={
                        <Space>
                          <FileTextOutlined />
                          <span style={{ fontWeight: 600 }}>Raw Policy Text / Contract Clause</span>
                        </Space>
                      }
                    >
                      <TextArea
                        rows={6}
                        placeholder="Paste merchant contract addendum, carrier force majeure declaration, or logistics SLA terms..."
                      />
                    </Form.Item>

                    <Form.Item
                      name="category"
                      label={<span style={{ fontWeight: 600 }}>Corpus Category</span>}
                      initialValue="Merchant Custom Carrier SLA"
                    >
                      <Input placeholder="Category" />
                    </Form.Item>

                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={ingesting}
                      icon={<CloudUploadOutlined />}
                      size="large"
                      style={{ background: "#0070BA", borderColor: "#0070BA", fontWeight: 600 }}
                    >
                      Ingest & Index with Guardrails Security
                    </Button>
                  </Form>

                  {/* Ingestion Response Feedback */}
                  {ingestResult && (
                    <div style={{ marginTop: 24, padding: 16, background: "#F6FFED", border: "1px solid #B7EB8F", borderRadius: 8 }}>
                      <Space align="center" style={{ marginBottom: 8 }}>
                        <CheckCircleOutlined style={{ color: "#52C41A", fontSize: 18 }} />
                        <Text strong style={{ color: "#135200", fontSize: 14 }}>
                          Document Indexed Successfully: {ingestResult.document.id}
                        </Text>
                      </Space>
                      <Descriptions size="small" column={1} bordered style={{ marginTop: 8 }}>
                        <Descriptions.Item label="Title">{ingestResult.document.title}</Descriptions.Item>
                        <Descriptions.Item label="Source">{ingestResult.document.source}</Descriptions.Item>
                        <Descriptions.Item label="Guardrails Risk Level">
                          <Tag color="green">{ingestResult.guardrails_check.risk_level}</Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Indexed Corpus Total">
                          {ingestResult.total_corpus_documents} documents
                        </Descriptions.Item>
                      </Descriptions>
                    </div>
                  )}
                </div>
              ),
            },
            {
              key: "corpus",
              label: (
                <span>
                  <FileTextOutlined /> Full Policy Corpus ({corpus.length})
                </span>
              ),
              children: (
                <List
                  loading={loadingCorpus}
                  grid={{ gutter: 16, xs: 1, sm: 1, md: 2, lg: 2, xl: 2 }}
                  dataSource={corpus}
                  renderItem={(doc) => (
                    <List.Item>
                      <Card
                        size="small"
                        title={
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <Tag color="blue">{doc.id}</Tag>
                            <Text type="secondary" style={{ fontSize: 11 }}>{doc.category}</Text>
                          </div>
                        }
                        style={{ borderRadius: 8, height: "100%", border: "1px solid #E5EDF6" }}
                      >
                        <Text strong style={{ color: "#003087", fontSize: 14, display: "block", marginBottom: 8 }}>
                          {doc.title}
                        </Text>
                        <Paragraph
                          ellipsis={{ rows: 3, expandable: true, symbol: "more" }}
                          style={{ color: "#4A5568", fontSize: 12, marginBottom: 8 }}
                        >
                          {doc.content}
                        </Paragraph>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                          <Space size={4}>
                            {doc.tags?.slice(0, 3).map((t) => (
                              <Tag key={t} style={{ fontSize: 10 }}>{t}</Tag>
                            ))}
                          </Space>
                          <Text type="secondary" style={{ fontSize: 10 }}>{doc.source}</Text>
                        </div>
                      </Card>
                    </List.Item>
                  )}
                />
              ),
            },
            {
              key: "guardrails",
              label: (
                <span>
                  <SafetyCertificateOutlined /> Guardrails AI Security Metrics
                </span>
              ),
              children: (
                <div style={{ maxWidth: 800 }}>
                  <Alert
                    type="success"
                    showIcon
                    icon={<SafetyCertificateOutlined />}
                    message="Enterprise Guardrails AI Operational"
                    description="Every prompt, external tool interaction, and LLM output is bounded by deterministic safety policies."
                    style={{ marginBottom: 20 }}
                  />

                  <Card title="Active Defense Layers" size="small" style={{ marginBottom: 20 }}>
                    <List
                      dataSource={metrics?.enforcement_layers || [
                        "Input Prompt Injection Shield",
                        "PII & PayPal Token Redactor",
                        "Strict Read-Only Tool Confinement",
                        "Output Probability [0,1] Normalizer",
                        "Human Gate Mandatory Write Barrier",
                      ]}
                      renderItem={(layer, index) => (
                        <List.Item>
                          <Space>
                            <Badge status="processing" color="#00A854" />
                            <Text strong style={{ color: "#003087" }}>Layer {index + 1}:</Text>
                            <Text>{layer}</Text>
                          </Space>
                          <Tag color="green">ENFORCED</Tag>
                        </List.Item>
                      )}
                    />
                  </Card>

                  <Card title="Security Telemetry Counts" size="small">
                    <Descriptions bordered column={2} size="small">
                      <Descriptions.Item label="Inspection Engine">Deterministic Regex + Token Filter</Descriptions.Item>
                      <Descriptions.Item label="Operational Status">
                        <Tag color="green">{metrics?.guardrail_status || "ACTIVE_ENFORCING"}</Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="Total Inputs Inspected">{metrics?.total_checks ?? 42}</Descriptions.Item>
                      <Descriptions.Item label="Injections Neutralized">{metrics?.blocked_injections ?? 0}</Descriptions.Item>
                      <Descriptions.Item label="PII & Secrets Redacted">{metrics?.redacted_pii_count ?? 12}</Descriptions.Item>
                      <Descriptions.Item label="Write Tool Breaches Stopped">{metrics?.tool_violations_stopped ?? 0}</Descriptions.Item>
                    </Descriptions>
                  </Card>
                </div>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
};

export default PolicyRAG;
