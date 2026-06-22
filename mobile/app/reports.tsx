import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { useState, useEffect } from "react";
import { router } from "expo-router";
import { useAppStore, API_BASE, getTicketPayout } from "./store";
import axios from "axios";

interface Ticket {
  id: string;
  number: string;
  amount: number;
  gameType: string;
  status: "PENDING" | "WON" | "LOST";
  createdAt: string;
  lottery: {
    name: string;
    category: string;
    drawTime: string;
    winningNumber: string | null;
  };
}

export default function Reports() {
  const token = useAppStore((state) => state.token);

  // Tabs: 'purchases' or 'winnings'
  const [activeTab, setActiveTab] = useState<"purchases" | "winnings">("purchases");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);

  // Pagination states
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    fetchReports(1, false);
  }, [token, activeTab]);

  const fetchReports = async (pageNum = 1, isLoadMore = false) => {
    if (!token) return;
    if (isLoadMore) {
      if (!hasMore || loadingMore) return;
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    try {
      const res = await axios.get(`${API_BASE}/api/reports?type=${activeTab}&page=${pageNum}&limit=20`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const dataList = res.data.data || [];
      const hasM = res.data.pagination?.hasMore ?? false;

      if (isLoadMore) {
        setTickets((prev) => [...prev, ...dataList]);
        setPage(pageNum);
        setHasMore(hasM);
      } else {
        setTickets(dataList);
        setPage(1);
        setHasMore(hasM);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "WON": return "#10B981";
      case "LOST": return "#6B7280";
      default: return "#F59E0B";
    }
  };

  const getGameLabel = (type: string) => {
    return type.replace("_", " ");
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (!token) {
    return (
      <View style={styles.container}>
        <View style={styles.topBlobLeft} />
        <View style={styles.topBlobRight} />
        <View style={styles.placeholderContainer}>
          <Text style={styles.placeholderText}>Please log in to view reports.</Text>
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

      {/* Tab Switcher */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "purchases" && styles.activeTab]}
          onPress={() => setActiveTab("purchases")}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === "purchases" && styles.activeTabText]}>
            Purchase History
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "winnings" && styles.activeTab]}
          onPress={() => setActiveTab("winnings")}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === "winnings" && styles.activeTabText]}>
            Winnings & Prizes
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#6366F1" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          onEndReached={() => {
            if (hasMore && !loadingMore) {
              fetchReports(page + 1, true);
            }
          }}
          onEndReachedThreshold={0.3}
          ListFooterComponent={loadingMore ? <ActivityIndicator size="small" color="#6366F1" style={{ marginVertical: 10 }} /> : null}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={true}
          renderItem={({ item }) => {
            const prize = getTicketPayout(item.gameType, item.amount);
            return (
              <View style={styles.ticketCard}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.lotteryName}>{item.lottery.name}</Text>
                    <Text style={styles.ticketDate}>{formatDate(item.createdAt)}</Text>
                  </View>
                  <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                    {item.status}
                  </Text>
                </View>

                <View style={styles.cardBody}>
                  <View style={styles.infoCol}>
                    <Text style={styles.infoLabel}>GAME TYPE</Text>
                    <Text style={styles.infoVal}>{getGameLabel(item.gameType)}</Text>
                  </View>
                  <View style={styles.infoCol}>
                    <Text style={styles.infoLabel}>BET NUMBER</Text>
                    <Text style={styles.infoVal}>{item.number}</Text>
                  </View>
                  <View style={styles.infoCol}>
                    <Text style={styles.infoLabel}>PLAY COST</Text>
                    <Text style={styles.infoVal}>₹{item.amount.toFixed(2)}</Text>
                  </View>
                </View>

                {item.status === "WON" && (
                  <View style={styles.prizeBanner}>
                    <Text style={styles.prizeLabel}>🎉 WINNING PRIZE CREDITED</Text>
                    <Text style={styles.prizeVal}>₹{prize.toFixed(2)}</Text>
                  </View>
                )}

                {item.lottery.winningNumber && (
                  <Text style={styles.winningNumText}>
                    Draw Result: {item.lottery.winningNumber}
                  </Text>
                )}
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🎫</Text>
              <Text style={styles.emptyText}>No tickets found.</Text>
              <Text style={styles.emptySubText}>
                {activeTab === "purchases"
                  ? "Buy lottery tickets from the home dashboard to see history."
                  : "You haven't won any draws yet this week. Keep playing!"}
              </Text>
            </View>
          }
        />
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
  tabsRow: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: "#6366F1",
  },
  tabText: {
    color: "#4B5563",
    fontSize: 13,
    fontWeight: "700",
  },
  activeTabText: {
    color: "#111827",
  },
  ticketCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingBottom: 10,
  },
  lotteryName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
  },
  ticketDate: {
    fontSize: 11,
    color: "#4B5563",
    marginTop: 4,
    fontWeight: "500",
  },
  statusText: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  cardBody: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 12,
  },
  infoCol: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 9,
    color: "#6B7280",
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  infoVal: {
    fontSize: 14,
    color: "#1F2937",
    fontWeight: "700",
    marginTop: 4,
  },
  prizeBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(16, 185, 129, 0.08)",
    borderColor: "rgba(16, 185, 129, 0.15)",
    borderWidth: 1,
    padding: 12,
    borderRadius: 10,
    marginTop: 4,
  },
  prizeLabel: {
    color: "#10B981",
    fontSize: 11,
    fontWeight: "800",
  },
  prizeVal: {
    color: "#10B981",
    fontSize: 16,
    fontWeight: "900",
  },
  winningNumText: {
    fontSize: 11,
    color: "#4B5563",
    fontStyle: "italic",
    textAlign: "right",
    marginTop: 10,
    fontWeight: "500",
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 80,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
  },
  emptySubText: {
    fontSize: 12,
    color: "#4B5563",
    marginTop: 6,
    textAlign: "center",
    lineHeight: 20,
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
