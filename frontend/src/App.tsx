import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Spin } from "antd";
import { AuthProvider, useAuth } from "./auth/context";
import { PortfolioProvider } from "./context/PortfolioContext";
import AppLayout from "./components/AppLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AtRisk from "./pages/AtRisk";
import Approvals from "./pages/Approvals";
import LangChainMonitor from "./pages/LangChainMonitor";
import Disputes from "./pages/Disputes";
import DisputeDetail from "./pages/DisputeDetail";
import AgentLog from "./pages/AgentLog";
import Audit from "./pages/Audit";
import Documentation from "./pages/Documentation";
import PolicyRAG from "./pages/PolicyRAG";

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Spin size="large" style={{ display: "block", margin: "200px auto" }} />;
  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

const AppRoutes: React.FC = () => (
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route
      path="/*"
      element={
        <PrivateRoute>
          <PortfolioProvider>
            <AppLayout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/at-risk" element={<AtRisk />} />
                <Route path="/approvals" element={<Approvals />} />
                <Route path="/langchain-monitor" element={<LangChainMonitor />} />
                <Route path="/ai-agent-monitoring" element={<LangChainMonitor />} />
                <Route path="/policy-rag" element={<PolicyRAG />} />
                <Route path="/disputes" element={<Disputes />} />
                <Route path="/disputes/:id" element={<DisputeDetail />} />
                <Route path="/agent-log" element={<AgentLog />} />
                <Route path="/audit" element={<Audit />} />
                <Route path="/documentation" element={<Documentation />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AppLayout>
          </PortfolioProvider>
        </PrivateRoute>
      }
    />
  </Routes>
);

const App: React.FC = () => (
  <AuthProvider>
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  </AuthProvider>
);

export default App;
