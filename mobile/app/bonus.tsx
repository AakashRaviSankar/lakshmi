import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useState, useEffect } from "react";
import { router } from "expo-router";
import { useAppStore, API_BASE } from "./store";
import axios from "axios";

interface DayProgress {
  day: string;
  date: string;
  amountSpent: number;
  showsCount: number;
  qualified: boolean;
}

interface PromoStatus {
  weekStart: string;
  daysStatus: DayProgress[];
  eligible: boolean;
  claimed: boolean;
  totalDaysQualified: number;
}

export default function SundayBonus() {
  const token = useAppStore((state) => state.token);

  const [promo, setPromo] = useState<PromoStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    fetchPromoStatus();
  }, [token]);

  const fetchPromoStatus = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/user/sunday-bonus`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPromo(res.data);
    } catch (error) {
      console.error("Failed to load promo status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimBonus = async () => {
    if (!token) return;
    setClaiming(true);
    try {
      await axios.post(
        `${API_BASE}/api/user/sunday-bonus`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert("Claim Successful! 🎉", "₹100 has been credited to your wallet.");
      fetchPromoStatus();
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.error || "Failed to claim Sunday bonus.";
      Alert.alert("Claim Error", msg);
    } finally {
      setClaiming(false);
    }
  };

  const isTodaySunday = () => {
    return new Date().getDay() === 0;
  };

  if (!token) {
    return (
      <View style={styles.container}>
        <View style={styles.topBlobLeft} />
        <View style={styles.topBlobRight} />
        <View style={styles.placeholderContainer}>
          <Text style={styles.placeholderText}>Please log in to track your bonus.</Text>
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
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.topBlobLeft} />
      <View style={styles.topBlobRight} />

      <View style={styles.headerCard}>
        <Text style={styles.headerIcon}>🎁</Text>
        <Text style={styles.headerTitle}>Sunday Bonus Tracker</Text>
        <Text style={styles.headerSub}>
          Play daily and claim ₹100 FREE in your wallet every Sunday!
        </Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>📌 How to Qualify:</Text>
        <Text style={styles.bulletItem}>
          • Spend at least <Text style={{ fontWeight: "bold", color: "#6366F1" }}>₹100 daily</Text> from Monday to Saturday.
        </Text>
        <Text style={styles.bulletItem}>
          • Purchase tickets in at least <Text style={{ fontWeight: "bold", color: "#6366F1" }}>2 different shows</Text> each day.
        </Text>
        <Text style={styles.bulletItem}>
          • Qualify all 6 days, then tap the claim button here on Sunday!
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#6366F1" style={{ marginVertical: 30 }} />
      ) : promo ? (
        <View style={styles.trackerCard}>
          <View style={styles.trackerHeader}>
            <Text style={styles.trackerTitle}>Weekly Progress Tracker</Text>
            <Text style={styles.weekStartText}>Week: {promo.weekStart}</Text>
          </View>

          {promo.daysStatus.map((d) => (
            <View key={d.day} style={styles.progressRow}>
              <View style={styles.dayDotContainer}>
                <View style={[styles.dayIndicatorDot, { backgroundColor: d.qualified ? "#10B981" : "#EF4444" }]} />
                <View>
                  <Text style={styles.progressDay}>{d.day}</Text>
                  <Text style={styles.progressSub}>Spent: ₹{d.amountSpent} | Shows: {d.showsCount}</Text>
                </View>
              </View>
              <View style={[styles.statusBadge, d.qualified ? styles.statusBadgeOk : styles.statusBadgeNo]}>
                <Text style={[styles.statusBadgeText, d.qualified ? styles.statusBadgeTextOk : styles.statusBadgeTextNo]}>
                  {d.qualified ? "QUALIFIED" : "NOT MET"}
                </Text>
              </View>
            </View>
          ))}

          <View style={styles.claimSection}>
            {promo.claimed ? (
              <View style={[styles.claimStatusContainer, styles.claimedContainer]}>
                <Text style={[styles.claimStatusText, { color: "#10B981" }]}>✓ ₹100 Claimed Successfully! 🎉</Text>
                <Text style={styles.claimStatusSub}>Check your wallet balance.</Text>
              </View>
            ) : promo.eligible ? (
              isTodaySunday() ? (
                claiming ? (
                  <ActivityIndicator size="small" color="#10B981" />
                ) : (
                  <TouchableOpacity style={styles.claimBtn} onPress={handleClaimBonus} activeOpacity={0.8}>
                    <Text style={styles.claimBtnText}>CLAIM ₹100 BONUS NOW 🎁</Text>
                  </TouchableOpacity>
                )
              ) : (
                <View style={[styles.claimStatusContainer, styles.eligibleContainer]}>
                  <Text style={[styles.claimStatusText, { color: "#F59E0B" }]}>You qualified! 🌟</Text>
                  <Text style={styles.claimStatusSub}>Come back this Sunday to claim your ₹100 bonus.</Text>
                </View>
              )
            ) : (
              <View style={[styles.claimStatusContainer, styles.pendingContainer]}>
                <Text style={[styles.claimStatusText, { color: "#EF4444" }]}>
                  Progress: {promo.totalDaysQualified}/6 days completed.
                </Text>
                <Text style={styles.claimStatusSub}>Complete all days to claim ₹100 on Sunday.</Text>
              </View>
            )}
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
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
  headerCard: {
    backgroundColor: "#6366F1",
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
    alignItems: "center",
    shadowColor: "#6366F1",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  headerIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 6,
  },
  headerSub: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.85)",
    textAlign: "center",
    lineHeight: 18,
  },
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 8,
  },
  bulletItem: {
    fontSize: 12,
    color: "#4B5563",
    lineHeight: 18,
    marginBottom: 6,
  },
  trackerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 2,
  },
  trackerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    paddingBottom: 12,
    marginBottom: 8,
  },
  trackerTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111827",
  },
  weekStartText: {
    fontSize: 11,
    color: "#9CA3AF",
    fontWeight: "600",
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  dayDotContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  dayIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  progressDay: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111827",
  },
  progressSub: {
    fontSize: 11,
    color: "#4B5563",
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusBadgeOk: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
  },
  statusBadgeNo: {
    backgroundColor: "rgba(239, 68, 68, 0.08)",
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  statusBadgeTextOk: {
    color: "#10B981",
  },
  statusBadgeTextNo: {
    color: "#EF4444",
  },
  claimSection: {
    marginTop: 20,
    alignItems: "center",
  },
  claimBtn: {
    backgroundColor: "#10B981",
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
    shadowColor: "#10B981",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 2,
    width: "100%",
    alignItems: "center",
  },
  claimBtnText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "800",
  },
  claimStatusContainer: {
    width: "100%",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1,
  },
  claimedContainer: {
    backgroundColor: "rgba(16, 185, 129, 0.08)",
    borderColor: "rgba(16, 185, 129, 0.15)",
  },
  eligibleContainer: {
    backgroundColor: "rgba(245, 158, 11, 0.08)",
    borderColor: "rgba(245, 158, 11, 0.15)",
  },
  pendingContainer: {
    backgroundColor: "rgba(239, 68, 68, 0.05)",
    borderColor: "rgba(239, 68, 68, 0.12)",
  },
  claimStatusText: {
    fontSize: 14,
    fontWeight: "800",
  },
  claimStatusSub: {
    color: "#4B5563",
    fontSize: 11,
    marginTop: 4,
    fontWeight: "600",
    textAlign: "center",
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  placeholderText: {
    fontSize: 15,
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
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  loginBtnText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "800",
  },
});
