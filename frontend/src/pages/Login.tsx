import React, { useState } from "react";
import { Card, Form, Input, Button, Alert, Typography, Space, Tag, Divider } from "antd";
import { UserOutlined, LockOutlined, SafetyCertificateOutlined, ThunderboltOutlined, CloudSyncOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/context";
import { PayPalShieldLogo } from "../components/PayPalLogo";

const { Title, Text, Paragraph } = Typography;

const Login: React.FC = () => {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const { login } = useAuth();
  const navigate = useNavigate();

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    setError("");
    try {
      await login(values.username, values.password);
      navigate("/", { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.detail || "Invalid credentials. Please verify username and password.");
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = () => {
    form.setFieldsValue({ username: "admin", password: "admin123" });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "radial-gradient(circle at 50% 20%, #003087 0%, #001C3D 55%, #000B1A 100%)",
        padding: 20,
      }}
    >
      <div style={{ maxWidth: 440, width: "100%" }}>
        {/* Brand Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ display: "inline-block", background: "rgba(255,255,255,0.06)", padding: "12px 20px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)" }}>
            <PayPalShieldLogo light />
          </div>
          <Title level={4} style={{ color: "#FFFFFF", marginTop: 16, marginBottom: 4, fontWeight: 600 }}>
            Merchant Risk & Day-0 Protection
          </Title>
          <Text style={{ color: "#99B2D1", fontSize: 13 }}>
            Continuous Weather Hazard Modeling & Dispute Prevention
          </Text>
        </div>

        {/* Login Card */}
        <Card
          bordered={false}
          style={{
            borderRadius: 16,
            boxShadow: "0 12px 40px rgba(0, 0, 0, 0.4)",
            background: "#FFFFFF",
            padding: "8px 12px",
          }}
        >
          {error && (
            <Alert
              message={error}
              type="error"
              showIcon
              style={{ marginBottom: 20, borderRadius: 8 }}
              closable
              onClose={() => setError("")}
            />
          )}

          <Form form={form} onFinish={onFinish} layout="vertical" size="large">
            <Form.Item
              name="username"
              label={<Text strong style={{ color: "#003087" }}>PayPal Merchant ID / Username</Text>}
              rules={[{ required: true, message: "Please enter your username" }]}
              initialValue="admin"
            >
              <Input prefix={<UserOutlined style={{ color: "#0070BA" }} />} placeholder="e.g. admin" />
            </Form.Item>

            <Form.Item
              name="password"
              label={<Text strong style={{ color: "#003087" }}>Password</Text>}
              rules={[{ required: true, message: "Please enter your password" }]}
              initialValue="admin123"
            >
              <Input.Password prefix={<LockOutlined style={{ color: "#0070BA" }} />} placeholder="••••••••" />
            </Form.Item>

            <Form.Item style={{ marginBottom: 12 }}>
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={loading}
                style={{
                  height: 44,
                  fontSize: 15,
                  fontWeight: 600,
                  background: "#0070BA",
                  borderColor: "#0070BA",
                  borderRadius: 8,
                }}
              >
                Log In to Protection Suite
              </Button>
            </Form.Item>
          </Form>

          {/* Quick Demo Credentials Pill */}
          <div
            onClick={fillDemoCredentials}
            style={{
              padding: "10px 14px",
              background: "#F5F8FC",
              borderRadius: 8,
              border: "1px dashed #CCE5F5",
              cursor: "pointer",
              textAlign: "center",
              marginTop: 10,
              transition: "all 0.2s",
            }}
          >
            <Text type="secondary" style={{ fontSize: 12 }}>
              Demo Access: <Tag color="blue" style={{ margin: "0 4px" }}>admin</Tag> / <Tag color="blue" style={{ margin: "0 4px" }}>admin123</Tag>
              <span style={{ color: "#0070BA", marginLeft: 4, fontWeight: 500 }}>(click to auto-fill)</span>
            </Text>
          </div>

          <Divider style={{ margin: "20px 0 16px" }} />

          {/* Security Features */}
          <Space direction="vertical" size={8} style={{ width: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <SafetyCertificateOutlined style={{ color: "#00A854" }} />
              <Text style={{ fontSize: 12, color: "#597599" }}>
                Strict Sandbox Isolation • Zero Live Fund Transfers
              </Text>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <ThunderboltOutlined style={{ color: "#0070BA" }} />
              <Text style={{ fontSize: 12, color: "#597599" }}>
                Human-in-the-Loop Approval for Every PayPal Write
              </Text>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <CloudSyncOutlined style={{ color: "#FF9800" }} />
              <Text style={{ fontSize: 12, color: "#597599" }}>
                60-Day Monte Carlo Risk Twin Simulation
              </Text>
            </div>
          </Space>
        </Card>

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: 20 }}>
          <Text style={{ color: "#597599", fontSize: 12 }}>
            Day-0 Shield for PayPal Merchants • AI Hackathon 2026
          </Text>
        </div>
      </div>
    </div>
  );
};

export default Login;
