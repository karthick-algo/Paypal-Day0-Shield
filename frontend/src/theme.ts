import { ThemeConfig } from "antd";

export const paypalTheme: ThemeConfig = {
  token: {
    colorPrimary: "#0070BA",
    colorInfo: "#0070BA",
    colorSuccess: "#00A854",
    colorWarning: "#FF9800",
    colorError: "#D9381E",
    colorBgBase: "#F5F8FC",
    colorTextBase: "#0F2644",
    borderRadius: 8,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif",
  },
  components: {
    Layout: {
      bodyBg: "#F5F8FC",
      headerBg: "#FFFFFF",
      siderBg: "#001C3D",
    },
    Menu: {
      darkItemBg: "#001C3D",
      darkItemSelectedBg: "#003087",
      darkItemColor: "#99B2D1",
      darkItemSelectedColor: "#FFFFFF",
      itemBorderRadius: 6,
    },
    Card: {
      headerBg: "#FFFFFF",
      colorBorderSecondary: "#E5EDF6",
      boxShadowSecondary: "0 2px 12px rgba(0, 48, 135, 0.05)",
    },
    Button: {
      primaryColor: "#FFFFFF",
      borderRadius: 6,
      controlHeight: 38,
      fontWeight: 500,
    },
    Table: {
      headerBg: "#EEF4FB",
      headerColor: "#003087",
      borderColor: "#E5EDF6",
    },
    Tag: {
      borderRadius: 4,
    },
  },
};
