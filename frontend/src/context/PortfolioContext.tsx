import React, { orientation, createContext, useContext, useEffect, useState } from "react";
import api from "../api/client";
import { useAuth } from "../auth/context";

export interface Merchant {
  id: number;
  name: string;
  business_type: string;
  ship_from_region: string;
  sandbox_payer_id: string;
}

interface PortfolioContextType {
  merchants: Merchant[];
  selectedMerchant: string;
  setSelectedMerchant: (id: string) => void;
  currentMerchant: Merchant | null;
  loading: boolean;
}

const PortfolioContext = createContext<PortfolioContextType>({
  merchants: [],
  selectedMerchant: "all",
  setSelectedMerchant: () => {},
  currentMerchant: null,
  loading: false,
});

export const PortfolioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [selectedMerchant, setSelectedMerchant] = useState<string>("all");
  const [loading, setLoading] = useState<boolean>(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    api
      .get("/merchants")
      .then((res) => {
        setMerchants(res.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const currentMerchant =
    selectedMerchant === "all"
      ? null
      : merchants.find((m) => String(m.id) === selectedMerchant) || null;

  return (
    <PortfolioContext.Provider
      value={{
        merchants,
        selectedMerchant,
        setSelectedMerchant,
        currentMerchant,
        loading,
      }}
    >
      {children}
    </PortfolioContext.Provider>
  );
};

export const usePortfolio = () => useContext(PortfolioContext);
