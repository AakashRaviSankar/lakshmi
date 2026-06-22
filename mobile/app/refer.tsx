import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Alert, Share } from "react-native";
import { useState, useEffect } from "react";
import { router } from "expo-router";
import { useAppStore, API_BASE } from "./store";
import axios from "axios";
import * as Clipboard from "expo-clipboard";

interface Commission {
  id: string;
  amount: number;
  description: string;
  createdAt: string;
}

export default function Refer() {
  const token = useAppStore((state) => state.token);

  const [referralCode, setReferralCode] = useState("");
  const [referredCount, setReferredCount] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReferralData();
  }, [token]);

  const fetchReferralData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/user/referrals`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReferralCode(res.data.referralCode || "");
      setReferredCount(res.data.referredCount || 0);
      setTotalEarned(res.data.totalEarned || 0);
      setCommissions(res.data.commissions || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join me on KL Dear Lottery! Use my referral code: ${referralCode} during sign-up to play, win, and get commission rewards! Download the app now. Link : https://lakshmi-three.vercel.app`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const copyToClipboard = async () => {
    if (!referralCode) return;
    await Clipboard.setStringAsync(referralCode);
    Alert.alert("Code Copied", `Referral code "${referralCode}" copied to clipboard!`);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString();
  };

  if (!token) {
    return (
      <View style={styles.container}>
        <View style={styles.topBlobLeft} />
        <View style={styles.topBlobRight} />
        <View style={styles.placeholderContainer}>
          <Text style={styles.placeholderText}>Please log in to view referral details.</Text>
          <TouchableOpacity
            style={styles.loginBtn}
            onPress={() => router.push("/login")}
            activeOpacity={0.8}
          >
            <Text style={styles.loginBtnText}>Go to Login / Register</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topBlobLeft} />
      <View style={styles.topBlobRight} />

      {loading ? (
        <ActivityIndicator size="large" color="#6366F1" style={{ marginTop: 50 }} />
      ) : (
        <View style={{ flex: 1 }}>
          {/* Header section explaining referral system */}
          <View style={styles.banner}>
            <Text style={styles.bannerTitle}>Refer Friends & Earn!</Text>
            <Text style={styles.bannerText}>
              Share your referral code. For every recharge your referred friend submits and gets approved, you receive a <Text style={{ fontWeight: "bold", color: "#10B981" }}>1% commission</Text> instantly credited to your wallet!
            </Text>
          </View>

          {/* Referral Code Box */}
          <View style={styles.codeContainer}>
            <Text style={styles.codeLabel}>YOUR REFERRAL CODE</Text>
            <View style={styles.codeRow}>
              <Text style={styles.codeText}>{referralCode || "------"}</Text>
              <TouchableOpacity style={styles.copyBtn} onPress={copyToClipboard} activeOpacity={0.7}>
                <Text style={styles.copyBtnText}>COPY</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.85}>
              <Text style={styles.shareBtnText}>SHARE REFERRAL LINK 📱</Text>
            </TouchableOpacity>
          </View>

          {/* Statistics Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Friends Referred</Text>
              <Text style={styles.statVal}>{referredCount}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Commissions Earned</Text>
              <Text style={[styles.statVal, { color: "#10B981" }]}>₹{totalEarned.toFixed(2)}</Text>
            </View>
          </View>

          {/* Commission history list */}
          <Text style={styles.historyTitle}>Referral Earnings History</Text>
          <FlatList
            data={commissions}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowDesc}>{item.description}</Text>
                  <Text style={styles.rowDate}>{formatDate(item.createdAt)}</Text>
                </View>
                <Text style={styles.rowAmount}>+₹{item.amount.toFixed(2)}</Text>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No commissions earned yet.</Text>
                <Text style={styles.emptySubText}>Commissions reflect when friends top up their wallet.</Text>
              </View>
            }
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  topBlobLeft: {
    position: "absolute",
    top: -50,
    left: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(99, 102, 241, 0.04)",
  },
  topBlobRight: {
    position: "absolute",
    bottom: -80,
    right: -80,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "rgba(16, 185, 129, 0.03)",
  },
  banner: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  bannerTitle: {
    color: "#111827",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 6,
  },
  bannerText: {
    color: "#4B5563",
    fontSize: 13,
    lineHeight: 20,
  },
  codeContainer: {
    backgroundColor: "#FFFFFF",
    margin: 16,
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  codeLabel: {
    fontSize: 11,
    color: "#4B5563",
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  codeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    gap: 16,
    marginBottom: 16,
  },
  codeText: {
    fontSize: 28,
    fontWeight: "900",
    color: "#111827",
    letterSpacing: 2,
  },
  copyBtn: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  copyBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#1F2937",
  },
  shareBtn: {
    backgroundColor: "#6366F1",
    paddingVertical: 14,
    width: "100%",
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#6366F1",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 2,
  },
  shareBtnText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "800",
  },
  statsGrid: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.01,
    shadowRadius: 8,
    elevation: 2,
  },
  statLabel: {
    fontSize: 12,
    color: "#4B5563",
    fontWeight: "700",
  },
  statVal: {
    fontSize: 22,
    fontWeight: "900",
    color: "#111827",
    marginTop: 6,
  },
  historyTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111827",
    paddingHorizontal: 20,
    marginVertical: 10,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "transparent",
  },
  rowDesc: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "700",
  },
  rowDate: {
    fontSize: 11,
    color: "#4B5563",
    marginTop: 4,
  },
  rowAmount: {
    fontSize: 15,
    fontWeight: "800",
    color: "#10B981",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#4B5563",
  },
  emptySubText: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 6,
    textAlign: "center",
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  placeholderText: {
    fontSize: 16,
    color: "#4B5563",
    marginBottom: 20,
    textAlign: "center",
    fontWeight: "600",
  },
  loginBtn: {
    backgroundColor: "#6366F1",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: "#6366F1",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  loginBtnText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "800",
  },
});
