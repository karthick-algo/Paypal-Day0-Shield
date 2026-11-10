import React, { useEffect, useState } from "react";
import { Typography, Tag, Drawer, Descriptions, Spin, Card, Space, Button, Input, Select, Row, Col, Alert } from "antd";
import { AgGridReact } from "ag-grid-react";
import { ColDef } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import {
  WarningOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  ThunderboltOutlined,
  EyeOutlined,
  ReloadOutlined,
  ShopOutlined,
  InboxOutlined,
  SyncOutlined,
  DollarOutlined,
} from "@ant-design/icons";
import api from "../api/client";
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
  created_at: string;
}

const formatStatus = (status: string) => {
  switch (status) {
    case "pending_approval":
      return { label: "Pending", color: "gold" };
    case "approved":
      return { label: "Approved", color: "blue" };
    case "executed":
      return { label: "Executed", color: "green" };
    case "rejected":
      return { label: "Rejected", color: "red" };
    default:
      return { label: status, color: "default" };
  }
};

const AtRisk: React.FC = () => {
  const [rowData, setRowData] = useState<ActionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ActionRow | null>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const { selectedMerchant, currentMerchant } = usePortfolio();

  const fetchData = () => {
    setLoading(true);
    const params = selectedMerchant !== "all" ? { merchant_id: Number(selectedMerchant) } : {};
    api.get("/actions", { params })
      .then((res) => {
        setRowData(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [selectedMerchant]);

  const atRiskOrders = rowData.filter((r) => r.entity_type === "order").length;
  const atRiskSubs = rowData.filter((r) => r.entity_type === "subscription").length;
  const totalSavings = rowData.reduce((acc, r) => acc + (r.benefit_estimate || 0), 0);
  const pendingActions = rowData.filter((r) => r.status === "pending_approval").length;

  const columnDefs: ColDef<ActionRow>[] = [
    {
      field: "id",
      headerName: "ID",
      width: 95,
      minWidth: 90,
      pinned: "left",
      sortable: true,
      filter: false,
      suppressHeaderMenuButton: true,
      cellStyle: { display: "flex", alignItems: "center", color: "#597599", fontSize: 13, fontWeight: 500 },
    },
    {
      field: "entity_type",
      headerName: "Entity Ref",
      width: 155,
      minWidth: 150,
      sortable: true,
      filter: false,
      suppressHeaderMenuButton: true,
      cellRenderer: (params: any) => {
        const isOrder = params.value === "order";
        return (
          <div style={{ display: "flex", alignItems: "center", height: "100%" }}>
            <Tag
              color={isOrder ? "blue" : "purple"}
              style={{
                borderRadius: 4,
                padding: "1px 8px",
                fontSize: 12,
                lineHeight: "20px",
                margin: 0,
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              {isOrder ? <InboxOutlined style={{ marginRight: 4 }} /> : <SyncOutlined style={{ marginRight: 4 }} />}
              {isOrder ? "Order" : "Sub"} #{params.data?.entity_id}
            </Tag>
          </div>
        );
      },
    },
    {
      field: "action_type",
      headerName: "Proposed Action",
      width: 185,
      minWidth: 180,
      sortable: true,
      filter: false,
      suppressHeaderMenuButton: true,
      cellRenderer: (params: any) => {
        const title =
          params.value === "tracking_notice"
            ? "Tracking Notice"
            : params.value === "subscription_pause"
            ? "Pause Subscription"
            : params.value === "dispute_evidence"
            ? "Dispute Evidence"
            : params.value;
        return (
          <div style={{ display: "flex", alignItems: "center", height: "100%" }}>
            <Tag color="geekblue" style={{ borderRadius: 4, padding: "1px 8px", fontSize: 12, lineHeight: "20px", margin: 0 }}>
              {title}
            </Tag>
          </div>
        );
      },
    },
    {
      field: "status",
      headerName: "Status",
      width: 135,
      minWidth: 130,
      sortable: true,
      filter: false,
      suppressHeaderMenuButton: true,
      cellRenderer: (params: any) => {
        const s = formatStatus(params.value);
        return (
          <div style={{ display: "flex", alignItems: "center", height: "100%" }}>
            <Tag color={s.color} style={{ borderRadius: 4, padding: "1px 8px", fontSize: 11, lineHeight: "20px", fontWeight: 600, margin: 0 }}>
              {s.label}
            </Tag>
          </div>
        );
      },
    },
    {
      field: "rationale",
      headerName: "Agent Rationale",
      flex: 1,
      minWidth: 350,
      sortable: false,
      filter: false,
      suppressHeaderMenuButton: true,
      cellStyle: { display: "flex", alignItems: "center", fontSize: 12, color: "#1D2D44" },
    },
    {
      field: "benefit_estimate",
      headerName: "Projected Savings",
      width: 195,
      minWidth: 190,
      sortable: true,
      filter: false,
      suppressHeaderMenuButton: true,
      cellRenderer: (p: any) => (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: 150,
            height: "100%",
          }}
        >
          <span style={{ fontWeight: 600, color: "#00A854", fontSize: 13, width: 75, textAlign: "left" }}>
            ${p.value != null ? p.value.toFixed(2) : "0.00"}
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
    {
      headerName: "Action",
      width: 120,
      minWidth: 115,
      pinned: "right",
      sortable: false,
      filter: false,
      suppressHeaderMenuButton: true,
      cellRenderer: (params: any) => (
        <div style={{ display: "flex", alignItems: "center", height: "100%" }}>
          <Button
            size="small"
            type="link"
            icon={<EyeOutlined />}
            onClick={() => setSelected(params.data)}
            style={{ color: "#0070BA", fontSize: 12, padding: "2px 4px", fontWeight: 500 }}
          >
            Inspect
          </Button>
        </div>
      ),
    },
  ];

  const filteredData = rowData.filter((r) => {
    if (filterType !== "all" && r.entity_type !== filterType) return false;
    if (searchTerm && !r.rationale.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto" }}>
      {/* Title & Toolbar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <Title level={4} style={{ color: "#003087", margin: 0, fontWeight: 700 }}>
            At-Risk Commercial Exposure
          </Title>
          <Text style={{ color: "#597599", fontSize: 12 }}>
            Real-time exposure mapping across active weather zones • Modeled via Monte Carlo simulation
          </Text>
        </div>
        <Space size={8}>
          <Button size="small" icon={<ReloadOutlined />} onClick={fetchData}>
            Refresh
          </Button>
        </Space>
      </div>

      {/* 4 Equal-Sized Metric Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              background: "#FFFFFF",
              border: "1px solid #E5EDF6",
              boxShadow: "0 2px 10px rgba(0,48,135,0.04)",
              height: 140,
            }}
            bodyStyle={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              padding: "14px 16px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", height: 22 }}>
              <Text strong style={{ color: "#0F2644", fontSize: 13 }}>At-Risk Orders</Text>
              <Tag color="blue" style={{ fontSize: 10, margin: 0, padding: "0 8px", borderRadius: 12, lineHeight: "18px" }}>modeled</Tag>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, margin: "4px 0" }}>
              <InboxOutlined style={{ color: "#0070BA", fontSize: 22, alignSelf: "center", marginRight: 4 }} />
              <span style={{ color: "#0070BA", fontWeight: 700, fontSize: 28, lineHeight: 1 }}>{atRiskOrders}</span>
              <span style={{ color: "#8c8c8c", fontSize: 12 }}>orders</span>
            </div>
            <div style={{ fontSize: 11, color: "#597599", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              In transit within hazard impact perimeter
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              background: "#FFFFFF",
              border: "1px solid #E5EDF6",
              boxShadow: "0 2px 10px rgba(0,48,135,0.04)",
              height: 140,
            }}
            bodyStyle={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              padding: "14px 16px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", height: 22 }}>
              <Text strong style={{ color: "#0F2644", fontSize: 13 }}>At-Risk Subscriptions</Text>
              <Tag color="blue" style={{ fontSize: 10, margin: 0, padding: "0 8px", borderRadius: 12, lineHeight: "18px" }}>modeled</Tag>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, margin: "4px 0" }}>
              <SyncOutlined style={{ color: "#722ED1", fontSize: 22, alignSelf: "center", marginRight: 4 }} />
              <span style={{ color: "#722ED1", fontWeight: 700, fontSize: 28, lineHeight: 1 }}>{atRiskSubs}</span>
              <span style={{ color: "#8c8c8c", fontSize: 12 }}>plans</span>
            </div>
            <div style={{ fontSize: 11, color: "#597599", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              Recurring renewal in emergency lockdown zone
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              background: "#FFFFFF",
              border: "1px solid #E5EDF6",
              boxShadow: "0 2px 10px rgba(0,48,135,0.04)",
              height: 140,
            }}
            bodyStyle={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              padding: "14px 16px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", height: 22 }}>
              <Text strong style={{ color: "#0F2644", fontSize: 13 }}>Protected Savings</Text>
              <Tag color="blue" style={{ fontSize: 10, margin: 0, padding: "0 8px", borderRadius: 12, lineHeight: "18px" }}>modeled</Tag>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4, margin: "4px 0" }}>
              <DollarOutlined style={{ color: "#00A854", fontSize: 22, alignSelf: "center", marginRight: 2 }} />
              <span style={{ color: "#00A854", fontWeight: 700, fontSize: 28, lineHeight: 1 }}>
                ${totalSavings.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div style={{ fontSize: 11, color: "#597599", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              Estimated averted claim & churn losses
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              background: "#FFFFFF",
              border: "1px solid #E5EDF6",
              boxShadow: "0 2px 10px rgba(0,48,135,0.04)",
              height: 140,
            }}
            bodyStyle={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              padding: "14px 16px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", height: 22 }}>
              <Text strong style={{ color: "#0F2644", fontSize: 13 }}>Pending Sign-Offs</Text>
              <Tag color="cyan" style={{ fontSize: 10, margin: 0, padding: "0 6px", lineHeight: "18px" }}>Human Gate</Tag>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, margin: "4px 0" }}>
              <ThunderboltOutlined style={{ color: "#FA8C16", fontSize: 22, alignSelf: "center", marginRight: 4 }} />
              <span style={{ color: "#FA8C16", fontWeight: 700, fontSize: 28, lineHeight: 1 }}>{pendingActions}</span>
              <span style={{ color: "#8c8c8c", fontSize: 12 }}>pending</span>
            </div>
            <div style={{ fontSize: 11, color: "#597599", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              Awaiting human authorization in Approval Queue
            </div>
          </Card>
        </Col>
      </Row>

      {/* Compact Filter Toolbar */}
      <Card
        style={{
          borderRadius: 8,
          border: "1px solid #E5EDF6",
          marginBottom: 12,
        }}
        bodyStyle={{ padding: "8px 14px" }}
      >
        <Space wrap size="middle" style={{ width: "100%", justifyContent: "space-between" }}>
          <Space size="middle" wrap>
            <Input
              placeholder="Filter by rationale..."
              prefix={<SearchOutlined style={{ color: "#0070BA" }} />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: 240 }}
              size="small"
              allowClear
            />
            <Select
              value={filterType}
              onChange={setFilterType}
              style={{ width: 160 }}
              size="small"
              options={[
                { value: "all", label: "All Entities" },
                { value: "order", label: "Orders Only" },
                { value: "subscription", label: "Subscriptions Only" },
              ]}
            />
          </Space>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Showing <strong>{filteredData.length}</strong> of {rowData.length} records
          </Text>
        </Space>
      </Card>

      {/* Clean AG Grid Container */}
      <Card
        bodyStyle={{ padding: 0 }}
        style={{
          borderRadius: 8,
          overflow: "hidden",
          border: "1px solid #E5EDF6",
          boxShadow: "0 1px 4px rgba(0,48,135,0.03)",
        }}
      >
        {loading ? (
          <div style={{ padding: 40, textAlign: "center" }}>
            <Spin />
          </div>
        ) : (
          <div className="ag-theme-alpine" style={{ height: 520, width: "100%" }}>
            <AgGridReact<ActionRow>
              rowData={filteredData}
              columnDefs={columnDefs}
              rowHeight={42}
              headerHeight={42}
              defaultColDef={{
                sortable: true,
                filter: false,
                suppressHeaderMenuButton: true,
                resizable: true,
                wrapHeaderText: false,
                autoHeaderHeight: false,
              }}
              pagination
              paginationPageSize={12}
              paginationPageSizeSelector={[12, 20, 50, 100]}
              rowSelection={{ mode: 'singleRow' } as any}
              onRowClicked={(e) => setSelected(e.data ?? null)}
              animateRows
            />
          </div>
        )}
      </Card>

      {/* Inspection Drawer */}
      <Drawer
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "#003087", fontWeight: 700 }}>Exposure Record #{selected?.id}</span>
            {selected && <Tag color={formatStatus(selected.status).color}>{formatStatus(selected.status).label}</Tag>}
          </div>
        }
        open={!!selected}
        onClose={() => setSelected(null)}
        width={480}
      >
        {selected && (
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            <Alert
              type="info"
              showIcon
              message={`Recommended: ${selected.action_type.replace("_", " ").toUpperCase()}`}
              description={selected.rationale}
              style={{ borderRadius: 6 }}
            />

            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Target Entity">
                {selected.entity_type === "order" ? "Order" : "Subscription"} #{selected.entity_id}
              </Descriptions.Item>
              <Descriptions.Item label="Action Type">{selected.action_type}</Descriptions.Item>
              <Descriptions.Item label="Cost of Action">
                ${selected.cost_estimate != null ? selected.cost_estimate.toFixed(2) : "0.00"}
              </Descriptions.Item>
              <Descriptions.Item label="Projected Benefit">
                <span style={{ color: "#00A854", fontWeight: 600 }}>
                  ${selected.benefit_estimate != null ? selected.benefit_estimate.toFixed(2) : "0.00"}
                </span>
                <span style={{ fontSize: 10, color: "#8EADC9", marginLeft: 6 }}>(modeled)</span>
              </Descriptions.Item>
              <Descriptions.Item label="Created At">{selected.created_at}</Descriptions.Item>
            </Descriptions>

            <Card size="small" title="PayPal Protection Protocol">
              <Text style={{ fontSize: 12, color: "#597599" }}>
                This action is queued for merchant sign-off in the <strong>Approval Queue</strong>.
                When approved, a signed request with an idempotent <code>PayPal-Request-Id</code> will execute deterministically via the PayPal Sandbox API.
              </Text>
            </Card>
          </Space>
        )}
      </Drawer>
    </div>
  );
};

export default AtRisk;