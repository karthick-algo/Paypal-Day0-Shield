import React, { useEffect, useState } from "react";
import { Timeline, Tag, Typography, Card, Spin, Empty, Space, Badge, Select, Row, Col } from "antd";
import { UnorderedListOutlined, SafetyCertificateOutlined, EyeOutlined, EditOutlined, SyncOutlined, ThunderboltOutlined, NodeIndexOutlined } from "@ant-design/icons";
import api from "../api/client";

const { Title, Text } = Typography;

const accessColors: Record<string, string> = {
  read: "green",
  write: "orange",
  none: "default",
};

const AgentLog: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [nodeFilter, setNodeFilter] = useState<string>("all");

  const fetchLog = async () => {
    try {
      const res = await api.get("/dashboard/agent-log");
      setEvents(res.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLog();
    const interval = setInterval(fetchLog, 3000);
    return () => clearInterval(interval);
  }, []);

  const filteredEvents = events.filter((e) => {
    if (nodeFilter !== "all" && e.node !== nodeFilter) return false;
    return true;
  });

  if (loading) return <Spin size="large" style={{ display: "block", margin: "100px auto" }} />;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <Title level={3} style={{ color: "#003087", margin: 0, fontWeight: 700 }}>
            LangGraph Agent Activity Stream
          </Title>
          <Text style={{ color: "#597599", fontSize: 13 }}>
            Inspect real-time reasoning steps, tool invocations, and least-privilege boundaries enforced across all AI agents.
          </Text>
        </div>
        <Space>
          <Badge status="processing" color="#00CF65" text={<span style={{ fontSize: 12, color: "#003087", fontWeight: 600 }}>Streaming Live</span>} />
        </Space>
      </div>

      <Card
        style={{
          borderRadius: 12,
          border: "1px solid #E5EDF6",
          marginBottom: 16,
        }}
        bodyStyle={{ padding: "12px 18px" }}
      >
        <Space align="center">
          <Text strong style={{ color: "#003087", fontSize: 13 }}>Filter by Node:</Text>
          <Select
            value={nodeFilter}
            onChange={setNodeFilter}
            style={{ width: 200 }}
            options={[
              { value: "all", label: "All Nodes" },
              { value: "hazard_node", label: "hazard_node" },
              { value: "exposure_node", label: "exposure_node" },
              { value: "planner_node", label: "planner_node" },
              { value: "action_executor", label: "action_executor" },
            ]}
          />
          <Text type="secondary" style={{ fontSize: 12 }}>
            Showing {filteredEvents.length} events
          </Text>
        </Space>
      </Card>

      {filteredEvents.length === 0 ? (
        <Card style={{ borderRadius: 12, textAlign: "center", padding: "40px 0" }}>
          <Empty description="No agent events yet. Trigger a scenario from the Dashboard to see real-time reasoning." />
        </Card>
      ) : (
        <Card
          style={{
            borderRadius: 12,
            border: "1px solid #E5EDF6",
            boxShadow: "0 2px 10px rgba(0,48,135,0.03)",
          }}
        >
          <Timeline
            mode="left"
            items={filteredEvents.map((e) => {
              const isWrite = e.tool_access === "write";
              const isRead = e.tool_access === "read";
              return {
                color: isWrite ? "#D9381E" : isRead ? "#00A854" : "#0070BA",
                children: (
                  <div
                    style={{
                      background: "#FBFDFF",
                      padding: "12px 16px",
                      borderRadius: 8,
                      border: "1px solid #E5EDF6",
                      marginBottom: 12,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <Space>
                        <Tag color="blue" style={{ fontWeight: 600 }}>{e.node}</Tag>
                        {e.tool_name && (
                          <Tag color="cyan">
                            {isWrite ? <EditOutlined /> : <EyeOutlined />} {e.tool_name}
                          </Tag>
                        )}
                        {e.tool_access && (
                          <Tag
                            color={accessColors[e.tool_access]}
                            style={{ fontWeight: 700, fontSize: 10, textTransform: "uppercase" }}
                          >
                            {e.tool_access === "read" ? (
                              <span><SafetyCertificateOutlined style={{ marginRight: 4 }} />READ-ONLY TOOL</span>
                            ) : e.tool_access === "write" ? (
                              <span><ThunderboltOutlined style={{ marginRight: 4 }} />WRITE-ONLY (HUMAN GUARDED)</span>
                            ) : (
                              <span><NodeIndexOutlined style={{ marginRight: 4 }} />INTERNAL</span>
                            )}
                          </Tag>
                        )}
                      </Space>
                      <span style={{ fontSize: 11, color: "#8C9FB5" }}>{e.created_at}</span>
                    </div>
                    <div style={{ color: "#0F2644", fontSize: 13, lineHeight: 1.5 }}>
                      {e.summary}
                    </div>
                    {e.run_id && (
                      <div style={{ marginTop: 6, fontSize: 11, color: "#8C9FB5" }}>
                        Run ID: <code>{e.run_id}</code>
                      </div>
                    )}
                  </div>
                ),
              };
            })}
          />
        </Card>
      )}
    </div>
  );
};

export default AgentLog;
