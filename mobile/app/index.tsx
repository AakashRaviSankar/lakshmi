import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, Alert } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState, useEffect } from "react";
import { useAppStore, API_BASE } from "./store";
import axios from "axios";

export default function Home() {
  const token = useAppStore((state) => state.token);
  const user = useAppStore((state) => state.user);
  const initialize = useAppStore((state) => state.initialize);
  const setToken = useAppStore((state) => state.setToken);

  const [balance, setBalance] = useState(0);
  const [withdrawableBalance, setWithdrawableBalance] = useState(0);
  const [walletLoading, setWalletLoading] = useState(false);
  const [storeLoaded, setStoreLoaded] = useState(false);

  // Initialize the store and wait for it
  useEffect(() => {
    initialize().then(() => {
      setStoreLoaded(true);
    });
  }, []);

  // Redirect to login if store is loaded and no token is present
  useEffect(() => {
    if (storeLoaded && !token) {
      router.replace("/login");
    }
  }, [storeLoaded, token]);

  // Fetch wallet balance when focused
  useFocusEffect(
    useCallback(() => {
      if (token) {
        fetchWalletBalance();
      }
    }, [token])
  );

  const fetchWalletBalance = async () => {
    setWalletLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/wallet`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBalance(res.data.wallet?.balance || 0);
      setWithdrawableBalance(res.data.wallet?.withdrawableBalance || 0);
    } catch (error) {
      console.error("Dashboard wallet fetch error:", error);
    } finally {
      setWalletLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to log out of your account?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            await setToken(null);
            router.replace("/login");
          },
        },
      ]
    );
  };

  if (!storeLoaded || (storeLoaded && !token)) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  const shortcuts = [
    { label: "Play Lottery", route: "/lotteries", icon: "🎟️", color: "rgba(99, 102, 241, 0.08)" },
    { label: "Wallet & Funds", route: "/wallet", icon: "💼", color: "rgba(16, 185, 129, 0.08)" },
    { label: "Daily Results", route: "/results", icon: "📊", color: "rgba(245, 158, 11, 0.08)" },
    { label: "Sunday Bonus", route: "/bonus", icon: "🎁", color: "rgba(16, 185, 129, 0.08)" },
    { label: "My Reports", route: "/reports", icon: "📝", color: "rgba(236, 72, 153, 0.08)" },
    { label: "Refer & Earn", route: "/refer", icon: "🤝", color: "rgba(139, 92, 246, 0.08)" },
    { label: "Game Rules", route: "/rules", icon: "📜", color: "rgba(107, 114, 128, 0.08)" },
    { label: "Notifications", route: "/notifications", icon: "🔔", color: "rgba(20, 184, 166, 0.08)" },
    { label: "Help & Support", route: "/support", icon: "💬", color: "rgba(239, 68, 68, 0.08)" },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Profile Section */}
      <View style={styles.header}>
        <View style={styles.profileRow}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase() || "U"}</Text>
          </View>
          <View style={styles.profileDetails}>
            <Text style={styles.greeting}>Welcome Back,</Text>
            <Text style={styles.userName}>{user?.name || "Player"}</Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
            <Text style={styles.logoutIcon}>🚪</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Mini Wallet Card */}
      <View style={styles.walletCard}>
        <View style={styles.walletCardHeader}>
          <Text style={styles.walletBrand}>KL DEAR WALLET</Text>
          {walletLoading && <ActivityIndicator size="small" color="#FFF" />}
        </View>

        <View style={styles.balanceGrid}>
          <View style={styles.balanceCol}>
            <Text style={styles.balanceLabel}>Deposit Balance</Text>
            <Text style={styles.balanceValue}>₹{balance.toFixed(2)}</Text>
          </View>
          <View style={styles.balanceCol}>
            <Text style={styles.balanceLabel}>Winnings</Text>
            <Text style={[styles.balanceValue, { color: "#10B981" }]}>₹{withdrawableBalance.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.walletActions}>
          <TouchableOpacity
            style={styles.walletActionBtn}
            onPress={() => router.push("/wallet")}
            activeOpacity={0.8}
          >
            <Text style={styles.walletActionBtnText}>Manage Wallet ➔</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Featured Promo Banner */}
      <TouchableOpacity
        style={styles.promoBanner}
        onPress={() => router.push("/lotteries")}
        activeOpacity={0.9}
      >
        <Image
          source={require("../assets/dear_lottery.jpg")}
          style={styles.promoImage}
        />
        <View style={styles.promoOverlay}>
          <View>
            <Text style={styles.promoTitle}>Play & Win Real Money</Text>
            <Text style={styles.promoSubtitle}>Dear Shows at 1 PM, 6 PM, 8 PM & Kerala at 3 PM</Text>
          </View>
          <View style={styles.promoBadge}>
            <Text style={styles.promoBadgeText}>Play Now</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Grid Menu Section */}
      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>Quick Dashboard Shortcuts</Text>
        <View style={styles.grid}>
          {shortcuts.map((item) => (
            <TouchableOpacity
              key={item.route}
              style={[styles.gridItem, { backgroundColor: item.color }]}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.8}
            >
              <Text style={styles.gridIcon}>{item.icon}</Text>
              <Text style={styles.gridLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#6366F1",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#6366F1",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
  },
  profileDetails: {
    flex: 1,
    marginLeft: 12,
  },
  greeting: {
    fontSize: 11,
    color: "#9CA3AF",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  userName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
    marginTop: 1,
  },
  logoutBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  logoutIcon: {
    fontSize: 16,
  },
  walletCard: {
    backgroundColor: "#111827",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 5,
  },
  walletCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  walletBrand: {
    color: "#6366F1",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },
  balanceGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  balanceCol: {
    flex: 1,
  },
  balanceLabel: {
    color: "#9CA3AF",
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  balanceValue: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
    marginTop: 4,
  },
  walletActions: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
    marginTop: 16,
    paddingTop: 14,
    alignItems: "flex-end",
  },
  walletActionBtn: {
    paddingVertical: 4,
  },
  walletActionBtnText: {
    color: "#6366F1",
    fontSize: 12,
    fontWeight: "800",
  },
  promoBanner: {
    height: 120,
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 20,
    overflow: "hidden",
    position: "relative",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  promoImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  promoOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    backgroundColor: "rgba(17, 24, 39, 0.55)",
    justifyContent: "space-between",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  promoTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  promoSubtitle: {
    color: "rgba(255, 255, 255, 0.95)",
    fontSize: 10,
    fontWeight: "600",
    marginTop: 4,
  },
  promoBadge: {
    backgroundColor: "#6366F1",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    shadowColor: "#6366F1",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 2,
  },
  promoBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },
  menuSection: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#1F2937",
    marginBottom: 14,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
  },
  gridItem: {
    width: "48%",
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(229, 231, 235, 0.5)",
  },
  gridIcon: {
    fontSize: 24,
    marginBottom: 10,
  },
  gridLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1F2937",
  },
});