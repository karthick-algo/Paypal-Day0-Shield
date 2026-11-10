import React, { useEffect, useState } from "react";
import { Row, Col, Card, Button, Alert, Tag, Space, Typography, message, Tooltip as AntTooltip, Radio } from "antd";
import {
  ThunderboltOutlined,
  WarningOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  FireOutlined,
  CloudDownloadOutlined,
  CompassOutlined,
  AlertOutlined,
  ShopOutlined,
  GlobalOutlined,
  EnvironmentOutlined,
  LeftOutlined,
  RightOutlined,
} from "@ant-design/icons";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import api from "../api/client";
import { usePortfolio } from "../context/PortfolioContext";

const { Title, Text, Paragraph } = Typography;

interface Stats {
  at_risk_orders: number;
  at_risk_subscriptions: number;
  total_exposure_usd: number;
  active_hazards: number;
  pending_actions: number;
  writes_today: number;
  max_daily_writes: number;
}

interface ChartPoint {
  day: number;
  p5: number;
  p25: number;
  p50: number;
  p75: number;
  p95: number;
}

interface WeatherItem {
  city: string;
  region: string;
  country: string;
  hub_type: string;
  latitude: number;
  longitude: number;
  temperature: number;
  windspeed: number;
  weather_code: number;
  condition: string;
  status: string;
  risk_factor: number;
  source: string;
  updated_at: string;
}

const DEFAULT_WEATHER: WeatherItem[] = [
  // Americas
  { city: "New York", region: "Americas", country: "United States", hub_type: "Air & Sea Cargo Hub", latitude: 40.7128, longitude: -74.006, temperature: 14.2, windspeed: 15.1, weather_code: 1, condition: "Mainly clear", status: "NORMAL", risk_factor: 0.65, source: "Open-Meteo", updated_at: "" },
  { city: "Los Angeles", region: "Americas", country: "United States", hub_type: "Pacific Maritime Port", latitude: 34.0522, longitude: -118.2437, temperature: 21.0, windspeed: 12.0, weather_code: 0, condition: "Clear sky", status: "NORMAL", risk_factor: 0.70, source: "Open-Meteo", updated_at: "" },
  { city: "Chicago", region: "Americas", country: "United States", hub_type: "Inland Rail & Intermodal", latitude: 41.8781, longitude: -87.6298, temperature: 9.8, windspeed: 19.4, weather_code: 2, condition: "Partly cloudy", status: "NORMAL", risk_factor: 0.55, source: "Open-Meteo", updated_at: "" },
  // EMEA
  { city: "London", region: "EMEA", country: "United Kingdom", hub_type: "Heathrow Global Gateway", latitude: 51.5074, longitude: -0.1278, temperature: 11.5, windspeed: 16.5, weather_code: 3, condition: "Overcast", status: "NORMAL", risk_factor: 0.60, source: "Open-Meteo", updated_at: "" },
  { city: "Rotterdam", region: "EMEA", country: "Netherlands", hub_type: "Europe Major Seaport", latitude: 51.9244, longitude: 4.4777, temperature: 10.8, windspeed: 22.1, weather_code: 61, condition: "Slight rain", status: "ELEVATED", risk_factor: 0.80, source: "Open-Meteo", updated_at: "" },
  { city: "Frankfurt", region: "EMEA", country: "Germany", hub_type: "Central European Air Freight", latitude: 50.1109, longitude: 8.6821, temperature: 12.0, windspeed: 14.0, weather_code: 2, condition: "Partly cloudy", status: "NORMAL", risk_factor: 0.50, source: "Open-Meteo", updated_at: "" },
  { city: "Dubai", region: "EMEA", country: "UAE", hub_type: "Jebel Ali Transshipment", latitude: 25.2048, longitude: 55.2708, temperature: 31.5, windspeed: 18.2, weather_code: 0, condition: "Clear sky", status: "NORMAL", risk_factor: 0.60, source: "Open-Meteo", updated_at: "" },
  // APAC
  { city: "Singapore", region: "APAC", country: "Singapore", hub_type: "Straits Maritime Megahub", latitude: 1.3521, longitude: 103.8198, temperature: 29.4, windspeed: 14.8, weather_code: 80, condition: "Rain showers", status: "NORMAL", risk_factor: 0.85, source: "Open-Meteo", updated_at: "" },
  { city: "Tokyo", region: "APAC", country: "Japan", hub_type: "East Asia Coastal Logistics", latitude: 35.6762, longitude: 139.6503, temperature: 16.2, windspeed: 15.0, weather_code: 1, condition: "Mainly clear", status: "NORMAL", risk_factor: 0.75, source: "Open-Meteo", updated_at: "" },
  { city: "Shanghai", region: "APAC", country: "China", hub_type: "Yangtze Delta Container Port", latitude: 31.2304, longitude: 121.4737, temperature: 18.5, windspeed: 17.2, weather_code: 2, condition: "Partly cloudy", status: "NORMAL", risk_factor: 0.85, source: "Open-Meteo", updated_at: "" },
  { city: "Sydney", region: "APAC", country: "Australia", hub_type: "Oceania Trade Terminal", latitude: -33.8688, longitude: 151.2093, temperature: 22.8, windspeed: 13.5, weather_code: 0, condition: "Clear sky", status: "NORMAL", risk_factor: 0.55, source: "Open-Meteo", updated_at: "" },
  // South Asia
  { city: "Mumbai", region: "South Asia", country: "India", hub_type: "Nhava Sheva Port Corridor", latitude: 19.076, longitude: 72.8777, temperature: 30.1, windspeed: 17.0, weather_code: 1, condition: "Mainly clear", status: "NORMAL", risk_factor: 0.75, source: "Open-Meteo", updated_at: "" },
  { city: "Chennai", region: "South Asia", country: "India", hub_type: "Coromandel Coast Trade Hub", latitude: 13.0827, longitude: 80.2707, temperature: 31.0, windspeed: 16.5, weather_code: 2, condition: "Partly cloudy", status: "NORMAL", risk_factor: 0.85, source: "Open-Meteo", updated_at: "" },
  { city: "Delhi", region: "South Asia", country: "India", hub_type: "NCR Dry Port & Cargo", latitude: 28.6139, longitude: 77.209, temperature: 27.2, windspeed: 11.4, weather_code: 0, condition: "Clear sky", status: "NORMAL", risk_factor: 0.60, source: "Open-Meteo", updated_at: "" },
  { city: "Bangalore", region: "South Asia", country: "India", hub_type: "Deccan High-Tech Air Freight", latitude: 12.9716, longitude: 77.5946, temperature: 25.1, windspeed: 10.2, weather_code: 1, condition: "Mainly clear", status: "NORMAL", risk_factor: 0.45, source: "Open-Meteo", updated_at: "" },
];

const SCENARIOS = [
  {
    label: "Rotterdam - North Sea Severe Storm",
    type: "storm",
    region: "Rotterdam",
    severity: 5,
    duration_days: 2,
    iconNode: <AlertOutlined style={{ fontSize: 24, color: "#D9381E" }} />,
    desc: "Disrupts Europe's largest seaport. Cross-border transit halted, container terminal backlog +48% dispute risk.",
    color: "#D9381E",
  },
  {
    label: "Singapore - Malacca Strait Typhoon",
    type: "typhoon",
    region: "Singapore",
    severity: 5,
    duration_days: 3,
    iconNode: <WarningOutlined style={{ fontSize: 24, color: "#722ED1" }} />,
    desc: "Premier maritime transshipment freeze. Port congestion & regional air-sea courier shutdowns across ASEAN.",
    color: "#722ED1",
  },
  {
    label: "New York - Atlantic Winter Blizzard",
    type: "blizzard",
    region: "New York",
    severity: 4,
    duration_days: 4,
    iconNode: <CloudDownloadOutlined style={{ fontSize: 24, color: "#0070BA" }} />,
    desc: "Severe northeast blizzard shuts down air cargo and interstate freight across US East Coast corridor.",
    color: "#0070BA",
  },
  {
    label: "Chennai - Coromandel Monsoon Flood",
    type: "flood",
    region: "Chennai",
    severity: 4,
    duration_days: 3,
    iconNode: <CloudDownloadOutlined style={{ fontSize: 24, color: "#003087" }} />,
    desc: "Flash flooding across South India manufacturing hubs, Ennore port halts, and regional courier sorting delays.",
    color: "#003087",
  },
  {
    label: "Tokyo - Pacific Cyclone Alert",
    type: "cyclone",
    region: "Tokyo",
    severity: 4,
    duration_days: 2,
    iconNode: <FireOutlined style={{ fontSize: 24, color: "#FA8C16" }} />,
    desc: "Coastal storm surges and rail freight suspension across Tokyo Bay industrial and electronics export belt.",
    color: "#FA8C16",
  },
  {
    label: "Dubai - Gulf Severe Sandstorm",
    type: "sandstorm",
    region: "Dubai",
    severity: 3,
    duration_days: 2,
    iconNode: <AlertOutlined style={{ fontSize: 24, color: "#D48806" }} />,
    desc: "Visibility below 200m triggers airport ground stops and Jebel Ali crane shutdowns for high-value air-sea transshipments.",
    color: "#D48806",
  },
];

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [hazards, setHazards] = useState<any[]>([]);
  const [weatherList, setWeatherList] = useState<WeatherItem[]>(DEFAULT_WEATHER);
  const [regionFilter, setRegionFilter] = useState<string>("ALL");
  const [loading, setLoading] = useState(false);
  const weatherScrollRef = React.useRef<HTMLDivElement>(null);
  const { selectedMerchant, currentMerchant } = usePortfolio();

  const fetchData = async () => {
    try {
      const params = selectedMerchant !== "all" ? { merchant_id: Number(selectedMerchant) } : {};
      const [statsRes, chartRes, hazardRes] = await Promise.all([
        api.get("/dashboard/stats", { params }),
        api.get("/dashboard/risk-chart", { params }),
        api.get("/hazards"),
      ]);
      setStats(statsRes.data);
      setChartData(chartRes.data);
      setHazards(hazardRes.data);
    } catch {
      // ignore refresh errors
    }
  };

  const fetchWeather = async () => {
    try {
      const weatherRes = await api.get("/hazards/weather-live");
      if (weatherRes.data?.corridors?.length) {
        setWeatherList(weatherRes.data.corridors);
      }
    } catch {
      // fallback preserved
    }
  };

  useEffect(() => {
    fetchData();
    fetchWeather();
    const interval = setInterval(fetchData, 4000);
    const weatherInterval = setInterval(fetchWeather, 25000);
    return () => {
      clearInterval(interval);
      clearInterval(weatherInterval);
    };
  }, [selectedMerchant]);

  const triggerScenario = async (scenario: typeof SCENARIOS[0]) => {
    setLoading(true);
    try {
      const res = await api.post("/hazards/scenario", {
        type: scenario.type,
        region: scenario.region,
        severity: scenario.severity,
        duration_days: scenario.duration_days,
      });
      message.success(
        `Worldwide Hazard Activated: ${res.data.exposed_orders} orders & ${res.data.exposed_subscriptions} subs identified in ${scenario.region}. ${res.data.pending_actions} actions queued for approval!`
      );
      fetchData();
    } catch (err: any) {
      message.error(err.response?.data?.detail || "Failed to trigger hazard scenario");
    } finally {
      setLoading(false);
    }
  };

  const activeHazard = hazards.length > 0 ? hazards[0] : null;

  const filteredWeather = weatherList.filter((item) => {
    if (regionFilter === "ALL") return true;
    return item.region?.toUpperCase() === regionFilter.toUpperCase();
  });

  return (
    <div>
      {/* Page Title */}
      <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
        <div>
          <Title level={4} style={{ color: "#003087", margin: 0, fontWeight: 700 }}>
            <GlobalOutlined style={{ marginRight: 8, color: "#0070BA" }} />
            PayPal Day-0 Risk Sentinel (Worldwide Trade Corridors)
          </Title>
          <Text style={{ color: "#597599", fontSize: 12 }}>
            Continuous Worldwide Weather Ingestion (15 Global Commercial Hubs) • 60-Day Monte Carlo Risk Twin • Autonomous Human-Guarded Actions
          </Text>
        </div>
        {currentMerchant ? (
          <Tag color="blue" style={{ fontSize: 12, padding: "4px 10px", borderRadius: 6, margin: 0 }}>
            <ShopOutlined style={{ marginRight: 6 }} />
            Active Portfolio: <strong>{currentMerchant.name}</strong> ({currentMerchant.ship_from_region} • {currentMerchant.business_type.toUpperCase()})
          </Tag>
        ) : (
          <Tag color="cyan" style={{ fontSize: 12, padding: "4px 10px", borderRadius: 6, margin: 0 }}>
            <ShopOutlined style={{ marginRight: 6 }} />
            Consolidated View: <strong>All Worldwide Portfolios</strong>
          </Tag>
        )}
      </div>

      {/* Active Hazard Hero Alert */}
      {activeHazard && (
        <Alert
          type="error"
          showIcon
          icon={<WarningOutlined style={{ fontSize: 20, color: "#D9381E" }} />}
          message={
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ fontWeight: 700, fontSize: 14 }}>
                  ACTIVE HAZARD INCIDENT: {activeHazard.type.toUpperCase()} IN {activeHazard.region.toUpperCase()}
                </span>
                <span style={{ marginLeft: 10, color: "#597599", fontSize: 12 }}>
                  Severity Level {activeHazard.severity}/5 • Correlated via Open-Meteo Global Trade Matrix
                </span>
              </div>
              <Tag color="red" style={{ fontWeight: 600 }}>LIVE EXPOSURE ENGAGED</Tag>
            </div>
          }
          style={{
            marginBottom: 24,
            borderRadius: 10,
            border: "1px solid #FFCCC7",
            background: "#FFF2F0",
            padding: "12px 16px",
          }}
        />
      )}

      {/* 4 Premium Stat Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              background: "#FFFFFF",
              border: "1px solid #E5EDF6",
              boxShadow: "0 2px 10px rgba(0,48,135,0.04)",
              height: 154,
            }}
            bodyStyle={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              padding: "16px 18px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", height: 24, whiteSpace: "nowrap" }}>
              <Text strong style={{ color: "#0F2644", fontSize: 13, whiteSpace: "nowrap" }}>At-Risk Consignments</Text>
              <AntTooltip title="Cross-border shipments currently passing through active weather hazard corridors.">
                <Tag color="red" style={{ fontSize: 10, margin: 0, padding: "0 8px", borderRadius: 12, lineHeight: "18px", cursor: "help" }}>worldwide</Tag>
              </AntTooltip>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, margin: "6px 0", height: 36 }}>
              <WarningOutlined style={{ color: "#D9381E", fontSize: 24, alignSelf: "center", marginRight: 4 }} />
              <span style={{ color: "#D9381E", fontWeight: 700, fontSize: 30, lineHeight: 1 }}>
                {stats?.at_risk_orders ?? 0}
              </span>
              <span style={{ color: "#8c8c8c", fontSize: 13, fontWeight: 400 }}>orders</span>
            </div>
            <div style={{ fontSize: 11, color: "#597599", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", height: 18 }}>
              Cross-border shipments facing delay
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
              height: 154,
            }}
            bodyStyle={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              padding: "16px 18px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", height: 24, whiteSpace: "nowrap" }}>
              <Text strong style={{ color: "#0F2644", fontSize: 13, whiteSpace: "nowrap" }}>At-Risk Subscriptions</Text>
              <AntTooltip title="Recurring subscription billing agreements vulnerable to failed renewals.">
                <Tag color="orange" style={{ fontSize: 10, margin: 0, padding: "0 8px", borderRadius: 12, lineHeight: "18px", cursor: "help" }}>worldwide</Tag>
              </AntTooltip>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, margin: "6px 0", height: 36 }}>
              <FireOutlined style={{ color: "#FF9800", fontSize: 24, alignSelf: "center", marginRight: 4 }} />
              <span style={{ color: "#FF9800", fontWeight: 700, fontSize: 30, lineHeight: 1 }}>
                {stats?.at_risk_subscriptions ?? 0}
              </span>
              <span style={{ color: "#8c8c8c", fontSize: 13, fontWeight: 400 }}>billing agreements</span>
            </div>
            <div style={{ fontSize: 11, color: "#597599", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", height: 18 }}>
              Paused via PayPal Subscriptions API
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
              height: 154,
            }}
            bodyStyle={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              padding: "16px 18px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", height: 24, whiteSpace: "nowrap" }}>
              <Text strong style={{ color: "#0F2644", fontSize: 13, whiteSpace: "nowrap" }}>Projected Exposure</Text>
              <AntTooltip title="Cumulative dollar amount of orders and subscription recurring revenue at risk across all corridors.">
                <Tag color="blue" style={{ fontSize: 10, margin: 0, padding: "0 8px", borderRadius: 12, lineHeight: "18px", cursor: "help" }}>modeled</Tag>
              </AntTooltip>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4, margin: "6px 0", height: 36 }}>
              <DollarOutlined style={{ color: "#003087", fontSize: 24, alignSelf: "center", marginRight: 2 }} />
              <span style={{ color: "#003087", fontWeight: 700, fontSize: 30, lineHeight: 1 }}>
                ${Number(stats?.total_exposure_usd ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div style={{ fontSize: 11, color: "#597599", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", height: 18 }}>
              Potential gross loss without intervention
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
              height: 154,
            }}
            bodyStyle={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              padding: "16px 18px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", height: 24, whiteSpace: "nowrap" }}>
              <Text strong style={{ color: "#0F2644", fontSize: 13, whiteSpace: "nowrap" }}>Pending Guard Actions</Text>
              <Tag color="cyan" style={{ fontSize: 10, margin: 0, padding: "0 8px", borderRadius: 12, lineHeight: "18px" }}>Human Sign-Off</Tag>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, margin: "6px 0", height: 36 }}>
              <ThunderboltOutlined style={{ color: "#0070BA", fontSize: 24, alignSelf: "center", marginRight: 4 }} />
              <span style={{ color: "#0070BA", fontWeight: 700, fontSize: 30, lineHeight: 1 }}>
                {stats?.pending_actions ?? 0}
              </span>
              <span style={{ color: "#8c8c8c", fontSize: 13, fontWeight: 400 }}>actions</span>
            </div>
            <div style={{ fontSize: 11, color: "#597599", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", height: 18 }}>
              Tracking notices, pauses & evidence packs
            </div>
          </Card>
        </Col>
      </Row>

      {/* Real-time Worldwide Open-Meteo Meteorological Corridors Strip */}
      <Card
        title={
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <GlobalOutlined style={{ color: "#0070BA", fontSize: 18 }} />
              <span style={{ color: "#003087", fontWeight: 600 }}>Worldwide Meteorological Telemetry (Open-Meteo API)</span>
              <Tag color="blue" style={{ fontSize: 11 }}>15 Global Trade Hubs</Tag>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Radio.Group
                size="small"
                value={regionFilter}
                onChange={(e) => setRegionFilter(e.target.value)}
                optionType="button"
                buttonStyle="solid"
              >
                <Radio.Button value="ALL">All ({weatherList.length})</Radio.Button>
                <Radio.Button value="Americas">Americas</Radio.Button>
                <Radio.Button value="EMEA">EMEA</Radio.Button>
                <Radio.Button value="APAC">APAC</Radio.Button>
                <Radio.Button value="South Asia">South Asia</Radio.Button>
              </Radio.Group>
              <Tag color="green" icon={<CheckCircleOutlined />}>LIVE WMO FEED</Tag>
              <Button.Group size="small">
                <Button
                  icon={<LeftOutlined style={{ fontSize: 11 }} />}
                  onClick={() => weatherScrollRef.current?.scrollBy({ left: -260, behavior: "smooth" })}
                  title="Scroll Left Across Corridors"
                />
                <Button
                  icon={<RightOutlined style={{ fontSize: 11 }} />}
                  onClick={() => weatherScrollRef.current?.scrollBy({ left: 260, behavior: "smooth" })}
                  title="Scroll Right Across Corridors"
                />
              </Button.Group>
            </div>
          </div>
        }
        bodyStyle={{ padding: "14px 16px", overflow: "hidden" }}
        style={{
          borderRadius: 12,
          marginBottom: 24,
          border: "1px solid #E5EDF6",
          boxShadow: "0 2px 10px rgba(0,48,135,0.03)",
        }}
      >
        <div
          ref={weatherScrollRef}
          style={{
            display: "flex",
            flexDirection: "row",
            flexWrap: "nowrap",
            alignItems: "stretch",
            gap: 12,
            overflowX: "auto",
            overflowY: "hidden",
            paddingBottom: 10,
            width: "100%",
            scrollbarWidth: "thin",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {filteredWeather.map((w) => (
            <div
              key={w.city}
              style={{
                flex: "0 0 215px",
                minWidth: 215,
                maxWidth: 215,
                flexShrink: 0,
                border: "1px solid #E5EDF6",
                borderRadius: 8,
                padding: "10px 12px",
                background: w.status === "CRITICAL" ? "#FFF2F0" : w.status === "ELEVATED" ? "#FFFBE6" : "#FBFDFF",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxShadow: "0 1px 3px rgba(0,48,135,0.02)",
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                  <Text strong style={{ color: "#003087", fontSize: 13 }}>{w.city}</Text>
                  <Tag color={w.status === "CRITICAL" ? "red" : w.status === "ELEVATED" ? "orange" : "green"} style={{ margin: 0, fontSize: 9 }}>
                    {w.status}
                  </Tag>
                </div>
                <div style={{ fontSize: 10, color: "#8c8c8c", marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {w.country} • {w.hub_type}
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#0F2644", margin: "2px 0" }}>
                  {w.temperature}°C
                </div>
              </div>
              <div style={{ fontSize: 11, color: "#597599", borderTop: "1px solid rgba(0,0,0,0.04)", paddingTop: 4, marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {w.condition} • {w.windspeed} km/h
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Worldwide Scenario Trigger Hub */}
      <Card
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <CompassOutlined style={{ color: "#0070BA", fontSize: 18 }} />
            <span style={{ color: "#003087", fontWeight: 600 }}>Simulate Global Corridor Disruption</span>
            <Tag color="cyan" style={{ fontSize: 11 }}>Worldwide Cross-Border Scenarios</Tag>
          </div>
        }
        style={{
          borderRadius: 12,
          marginBottom: 24,
          border: "1px solid #E5EDF6",
          boxShadow: "0 2px 10px rgba(0,48,135,0.03)",
        }}
      >
        <Row gutter={[16, 16]}>
          {SCENARIOS.map((s) => (
            <Col xs={24} md={12} lg={8} key={s.label}>
              <div
                style={{
                  border: "1px solid #E5EDF6",
                  borderRadius: 10,
                  padding: 16,
                  background: "#FBFDFF",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div>{s.iconNode}</div>
                    <Tag color={s.severity >= 4 ? "red" : "orange"} style={{ fontWeight: 600 }}>
                      Severity {s.severity}/5
                    </Tag>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#003087", marginBottom: 6 }}>
                    {s.label}
                  </div>
                  <Paragraph style={{ color: "#597599", fontSize: 12, marginBottom: 14 }}>
                    {s.desc}
                  </Paragraph>
                </div>
                <Button
                  type="primary"
                  block
                  loading={loading}
                  onClick={() => triggerScenario(s)}
                  style={{
                    background: s.color,
                    borderColor: s.color,
                    fontWeight: 600,
                    borderRadius: 6,
                  }}
                  icon={<ThunderboltOutlined />}
                >
                  Activate {s.region} Scenario
                </Button>
              </div>
            </Col>
          ))}
        </Row>
      </Card>

      {/* 60-Day Monte Carlo Risk Fan Chart */}
      <Card
        title={
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: "#003087", fontWeight: 600 }}>
                60-Day Projected Risk Horizon & Dispute Twin
              </span>
              <Tag color="blue" style={{ fontSize: 11 }}>modeled (Monte Carlo N=1,000)</Tag>
            </div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Worldwide Exposure Curve with Confidence Bands (P5 - P95)
            </Text>
          </div>
        }
        style={{
          borderRadius: 12,
          marginBottom: 24,
          border: "1px solid #E5EDF6",
          boxShadow: "0 2px 10px rgba(0,48,135,0.03)",
        }}
      >
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="p95Grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#D9381E" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#D9381E" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="p50Grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0070BA" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#0070BA" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#EEF3FA" />
            <XAxis dataKey="day" stroke="#8C9FB5" tickFormatter={(v) => `Day ${v}`} />
            <YAxis stroke="#8C9FB5" tickFormatter={(v) => `$${v}`} />
            <Tooltip
              formatter={(value: any, name: any) => [`$${Number(value).toFixed(2)}`, name]}
              labelFormatter={(label) => `Projection: Day ${label}`}
              contentStyle={{ background: "#FFFFFF", borderRadius: 8, border: "1px solid #CCE5F5" }}
            />
            <Legend verticalAlign="top" height={36} />
            <Area type="monotone" dataKey="p95" stroke="#D9381E" strokeDasharray="3 3" fill="url(#p95Grad)" name="P95 Worst-Case Loss" />
            <Area type="monotone" dataKey="p75" stroke="#FF9800" fill="none" name="P75 Upper Bound" />
            <Area type="monotone" dataKey="p50" stroke="#0070BA" strokeWidth={2.5} fill="url(#p50Grad)" name="P50 Expected Median" />
            <Area type="monotone" dataKey="p25" stroke="#00A854" fill="none" name="P25 Optimistic" />
            <Area type="monotone" dataKey="p5" stroke="#99B2D1" strokeDasharray="2 2" fill="none" name="P5 Best-Case" />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* Safety & Daily Cap Budget Bar */}
      <Card
        style={{
          borderRadius: 12,
          border: "1px solid #E5EDF6",
          background: "#FFFFFF",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <Space>
            <CheckCircleOutlined style={{ color: "#00A854" }} />
            <Text strong style={{ color: "#003087" }}>
              PayPal Write Budget Rate Cap (Non-Negotiable Hardening)
            </Text>
          </Space>
          <Text style={{ fontSize: 13, color: "#597599" }}>
            {stats?.writes_today ?? 0} executed of {stats?.max_daily_writes ?? 200} max daily writes
          </Text>
        </div>
        <div style={{ background: "#F4F7FB", height: 10, borderRadius: 5, overflow: "hidden" }}>
          <div
            style={{
              background: "#00A854",
              height: "100%",
              width: `${Math.min(100, (((stats?.writes_today ?? 0) / (stats?.max_daily_writes ?? 200)) * 100))}%`,
              transition: "width 0.3s ease",
            }}
          />
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;
