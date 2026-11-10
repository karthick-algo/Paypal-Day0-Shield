import React from "react";
import ReactDOM from "react-dom/client";
import { ConfigProvider } from "antd";
import { paypalTheme } from "./theme";
import App from "./App";
import "antd/dist/reset.css";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ConfigProvider theme={paypalTheme}>
      <App />
    </ConfigProvider>
  </React.StrictMode>
);
