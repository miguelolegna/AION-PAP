import React, { createContext, useState, useEffect, useContext } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import fallbackPricing from '../config/pricing_algorithm.json';

// Interfaces estritas para garantir integridade lógica
interface PricingTier {
  max_kw: number;
  multiplicador: number;
  floor: number;
  ceil: number;
}

interface PricingConfig {
  deltas: {
    tempo: { vazio: number; fora_vazio: number };
    macro: {
      zonas: { alta_densidade: string[]; media_densidade: string[]; baixa_densidade: string[] };
      valores: { alta_densidade: number; media_densidade: number; baixa_densidade: number; default: number };
    };
    micro: { alta_ocupacao: number; baixa_ocupacao: number };
    tier: {
      nivel_1: PricingTier;
      nivel_2: PricingTier;
      nivel_3: PricingTier;
    };
  };
  metadata: {
    version: string;
    last_update: any;
  };
}

interface ConfigContextType {
  pricing: PricingConfig;
  loading: boolean;
  refreshConfig: () => Promise<void>;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Casting do fallback para a interface definida
  const [pricing, setPricing] = useState<PricingConfig>(fallbackPricing as PricingConfig);
  const [loading, setLoading] = useState(true);

  const fetchConfig = async () => {
    try {
      const docRef = doc(db, "system_configs", "pricing_algorithm");
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setPricing(docSnap.data() as PricingConfig);
      } else {
        console.warn("[ConfigContext] Firestore missing config. Using static fallback.");
      }
    } catch (error) {
      console.error("[ConfigContext] Critical Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  return (
    <ConfigContext.Provider value={{ pricing, loading, refreshConfig: fetchConfig }}>
      {children}
    </ConfigContext.Provider>
  );
};

export const usePricingConfig = () => {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error("usePricingConfig must be used within a ConfigProvider");
  }
  return context;
};