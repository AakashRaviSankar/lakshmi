import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";
import { Platform } from "react-native";
import * as Crypto from "expo-crypto";

const getApiBase = () => {
  if (__DEV__) {
    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) {
      const host = hostUri.split(":")[0];
      return `http://${host}:3000`;
    }
    return Platform.OS === "android" ? "http://10.0.2.2:3000" : "http://localhost:3000";
  }
  return "https://178-238-236-200.sslip.io/lottery";
};

export const API_BASE = getApiBase();

export function getTicketPayout(gameType: string, ticketAmount: number): number {
  if (gameType.startsWith("SINGLE")) {
    return 100;
  }
  if (gameType.startsWith("DOUBLE")) {
    return 1000;
  }
  if (gameType === "THREE_DIGIT") {
    switch (ticketAmount) {
      case 12: return 6250;
      case 28: return 15000;
      case 30: return 17500;
      case 55: return 30000;
      case 60: return 15000;
      default: return ticketAmount * 900;
    }
  }
  if (gameType === "FOUR_DIGIT") {
    if (ticketAmount === 50) {
      return 100000;
    }
    return ticketAmount * 9000;
  }
  return 0;
}

export interface CartItem {
  id: string;
  lotteryId: string;
  lotteryName: string;
  number: string;
  amount: number;
  gameType: string;
  quantity: number;
}

interface AppState {
  token: string | null;
  user: any | null;
  cart: CartItem[];
  unreadCount: number;
  deviceId: string | null;
  supportMobile: string;
  supportEmail: string;
  appVersion: string;
  appDownloadUrl: string;
  initialize: () => Promise<void>;
  setToken: (token: string | null) => Promise<void>;
  setUser: (user: any) => void;
  addToCart: (item: Omit<CartItem, "id">) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  setUnreadCount: (count: number) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  token: null,
  user: null,
  cart: [],
  unreadCount: 0,
  deviceId: null,
  supportMobile: "9962188600",
  supportEmail: "tgboyzz007@gmail.com",
  appVersion: "1.0.0",
  appDownloadUrl: "",

  initialize: async () => {
    try {
      const storedToken = await SecureStore.getItemAsync("userToken");
      const storedUser = await SecureStore.getItemAsync("userData");
      let storedDeviceId = await SecureStore.getItemAsync("deviceId");
      if (!storedDeviceId) {
        storedDeviceId = Crypto.randomUUID();
        await SecureStore.setItemAsync("deviceId", storedDeviceId);
      }

      // Fetch dynamic configuration from backend
      let configData = null;
      try {
        const response = await fetch(`${getApiBase()}/api/config`);
        if (response.ok) {
          configData = await response.json();
        }
      } catch (configError) {
        console.error("Failed to fetch backend configuration:", configError);
      }

      set({
        token: storedToken,
        user: storedUser ? JSON.parse(storedUser) : null,
        deviceId: storedDeviceId,
        supportMobile: configData?.supportMobile || "9962188600",
        supportEmail: configData?.supportEmail || "tgboyzz007@gmail.com",
        appVersion: configData?.appVersion || "1.0.0",
        appDownloadUrl: configData?.appDownloadUrl || "",
      });
    } catch (e) {
      console.error("Store initialization failed", e);
    }
  },

  setToken: async (token) => {
    try {
      if (token) {
        await SecureStore.setItemAsync("userToken", token);
      } else {
        await SecureStore.deleteItemAsync("userToken");
        await SecureStore.deleteItemAsync("userData");
        set({ user: null, cart: [] });
      }
      set({ token });
    } catch (e) {
      console.error("Set token failed", e);
    }
  },

  setUser: async (user) => {
    try {
      if (user) {
        await SecureStore.setItemAsync("userData", JSON.stringify(user));
      }
      set({ user });
    } catch (e) {
      console.error("Set user failed", e);
    }
  },

  addToCart: (item) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    set((state) => ({
      cart: [...state.cart, { ...item, id }],
    }));
  },

  removeFromCart: (id) => {
    set((state) => ({
      cart: state.cart.filter((item) => item.id !== id),
    }));
  },

  clearCart: () => set({ cart: [] }),
  setUnreadCount: (unreadCount) => set({ unreadCount }),
}));
