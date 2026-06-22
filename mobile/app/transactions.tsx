import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, TextInput } from "react-native";
import { useState, useEffect } from "react";
import { router } from "expo-router";
import { useAppStore, API_BASE } from "./store";
import axios from "axios";

interface Transaction {
  id: string;
  amount: number;
  type: "CREDIT" | "DEBIT";
  description: string;
  createdAt: string;
}

interface RechargeReq {
  id: string;
  amount: number;
  utrNumber: string;
  scanner: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
}

interface WithdrawReq {
  id: string;
  amount: number;
  accountNumber: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
}

export default function TransactionsScreen() {
  const token = useAppStore((state) => state.token);

  // History Tab: 'transactions' | 'recharges' | 'withdrawals'
  const [historyTab, setHistoryTab] = useState<"transactions" | "recharges" | "withdrawals">("transactions");

  // Data states
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [recharges, setRecharges] = useState<RechargeReq[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawReq[]>([]);
  const [loading, setLoading] = useState(false);

  // Search & Filter states
  const [searchText, setSearchText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<"ALL" | "TODAY" | "WEEK" | "MONTH">("ALL");

  // Pagination States
  const [txPage, setTxPage] = useState(1);
  const [txHasMore, setTxHasMore] = useState(true);
  const [txLoadingMore, setTxLoadingMore] = useState(false);

  const [rePage, setRePage] = useState(1);
  const [reHasMore, setReHasMore] = useState(true);
  const [reLoadingMore, setReLoadingMore] = useState(false);

  const [wdPage, setWdPage] = useState(1);
  const [wdHasMore, setWdHasMore] = useState(true);
  const [wdLoadingMore, setWdLoadingMore] = useState(false);

  // Reset filter criteria when switching tabs
  useEffect(() => {
    setSearchText("");
    setSearchQuery("");
    setDateFilter("ALL");
  }, [historyTab]);

  useEffect(() => {
    if (token) {
      if (historyTab === "transactions") {
        fetchTransactions(1, false);
      } else if (historyTab === "recharges") {
        fetchRecharges(1, false);
      } else {
        fetchWithdrawals(1, false);
      }
    }
  }, [token, historyTab, dateFilter, searchQuery]);

  const getDateRangeParams = () => {
    if (dateFilter === "ALL") return "";
    const now = new Date();
    let start = new Date();
    if (dateFilter === "TODAY") {
      start.setHours(0, 0, 0, 0);
    } else if (dateFilter === "WEEK") {
      start.setDate(now.getDate() - 7);
    } else if (dateFilter === "MONTH") {
      start.setDate(now.getDate() - 30);
    }
    // format as YYYY-MM-DD
    const formatDateStr = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    return `&startDate=${formatDateStr(start)}&endDate=${formatDateStr(now)}`;
  };

  const fetchTransactions = async (page = 1, isLoadMore = false) => {
    if (!token) return;
    if (isLoadMore) {
      if (!txHasMore || txLoadingMore) return;
      setTxLoadingMore(true);
    } else {
      setLoading(true);
    }
    try {
      let url = `${API_BASE}/api/wallet?page=${page}&limit=20`;
      if (searchQuery) {
        url += `&query=${encodeURIComponent(searchQuery)}`;
      }
      url += getDateRangeParams();

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const txData = res.data.transactions?.data || [];
      const hasM = res.data.transactions?.pagination?.hasMore ?? false;
      
      if (isLoadMore) {
        setTransactions((prev) => [...prev, ...txData]);
        setTxPage(page);
        setTxHasMore(hasM);
      } else {
        setTransactions(txData);
        setTxPage(1);
        setTxHasMore(hasM);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
      setTxLoadingMore(false);
    }
  };

  const fetchRecharges = async (page = 1, isLoadMore = false) => {
    if (!token) return;
    if (isLoadMore) {
      if (!reHasMore || reLoadingMore) return;
      setReLoadingMore(true);
    } else {
      setLoading(true);
    }
    try {
      let url = `${API_BASE}/api/recharge?page=${page}&limit=20`;
      if (searchQuery) {
        url += `&query=${encodeURIComponent(searchQuery)}`;
      }
      url += getDateRangeParams();

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const dataList = res.data.data || [];
      const hasM = res.data.pagination?.hasMore ?? false;

      if (isLoadMore) {
        setRecharges((prev) => [...prev, ...dataList]);
        setRePage(page);
        setReHasMore(hasM);
      } else {
        setRecharges(dataList);
        setRePage(1);
        setReHasMore(hasM);
      }
    } catch (error) {
      console.error("Error fetching recharges:", error);
    } finally {
      setLoading(false);
      setReLoadingMore(false);
    }
  };

  const fetchWithdrawals = async (page = 1, isLoadMore = false) => {
    if (!token) return;
    if (isLoadMore) {
      if (!wdHasMore || wdLoadingMore) return;
      setWdLoadingMore(true);
    } else {
      setLoading(true);
    }
    try {
      let url = `${API_BASE}/api/wallet/withdraw?page=${page}&limit=20`;
      if (searchQuery) {
        url += `&query=${encodeURIComponent(searchQuery)}`;
      }
      url += getDateRangeParams();

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const dataList = res.data.data || [];
      const hasM = res.data.pagination?.hasMore ?? false;

      if (isLoadMore) {
        setWithdrawals((prev) => [...prev, ...dataList]);
        setWdPage(page);
        setWdHasMore(hasM);
      } else {
        setWithdrawals(dataList);
        setWdPage(1);
        setWdHasMore(hasM);
      }
    } catch (error) {
      console.error("Error fetching withdrawals:", error);
    } finally {
      setLoading(false);
      setWdLoadingMore(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "APPROVED": return { color: "#10B981", fontWeight: "bold" } as const;
      case "REJECTED": return { color: "#EF4444", fontWeight: "bold" } as const;
      default: return { color: "#F59E0B", fontWeight: "bold" } as const;
    }
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
          <Text style={styles.placeholderText}>Please log in to view transactions.</Text>
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

      {/* History Header Title */}
      <View style={styles.historySectionHeader}>
        <Text style={styles.historySectionTitle}>Transaction Feed</Text>
        <Text style={styles.historySectionSubtitle}>Ledger and pending requests</Text>
      </View>

      {/* History Tabs */}
      <View style={styles.historyTabs}>
        <TouchableOpacity
          style={[styles.hTab, historyTab === "transactions" && styles.activeHTab]}
          onPress={() => setHistoryTab("transactions")}
          activeOpacity={0.8}
        >
          <Text style={[styles.hTabText, historyTab === "transactions" && styles.activeHTabText]}>
            Ledger
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.hTab, historyTab === "recharges" && styles.activeHTab]}
          onPress={() => setHistoryTab("recharges")}
          activeOpacity={0.8}
        >
          <Text style={[styles.hTabText, historyTab === "recharges" && styles.activeHTabText]}>
            Deposits
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.hTab, historyTab === "withdrawals" && styles.activeHTab]}
          onPress={() => setHistoryTab("withdrawals")}
          activeOpacity={0.8}
        >
          <Text style={[styles.hTabText, historyTab === "withdrawals" && styles.activeHTabText]}>
            Withdrawals
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search and Filters */}
      <View style={styles.filterContainer}>
        <View style={styles.searchBar}>
          <TextInput
            style={styles.searchInput}
            placeholder={
              historyTab === "transactions"
                ? "Search ledger description..."
                : historyTab === "recharges"
                ? "Search UTR or gateway..."
                : "Search A/C, name, or UPI..."
            }
            placeholderTextColor="#9CA3AF"
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={() => setSearchQuery(searchText)}
            returnKeyType="search"
          />
          {searchText ? (
            <TouchableOpacity
              onPress={() => {
                setSearchText("");
                setSearchQuery("");
              }}
              style={{ marginRight: 8, padding: 4 }}
            >
              <Text style={{ color: "#9CA3AF", fontSize: 14, fontWeight: "bold" }}>✕</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            style={styles.searchBtn}
            onPress={() => setSearchQuery(searchText)}
          >
            <Text style={styles.searchBtnText}>Search</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.dateFilterRow}>
          {([
            { id: "ALL", label: "All Time" },
            { id: "TODAY", label: "Today" },
            { id: "WEEK", label: "Last 7 Days" },
            { id: "MONTH", label: "Last 30 Days" }
          ] as const).map((p) => {
            const isActive = dateFilter === p.id;
            return (
              <TouchableOpacity
                key={p.id}
                style={[styles.datePill, isActive && styles.activeDatePill]}
                onPress={() => setDateFilter(p.id)}
              >
                <Text style={[styles.datePillText, isActive && styles.activeDatePillText]}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* List Container */}
      <View style={styles.listContainer}>
        {loading && (transactions.length === 0 && recharges.length === 0 && withdrawals.length === 0) ? (
          <ActivityIndicator size="large" color="#6366F1" style={{ marginTop: 40 }} />
        ) : historyTab === "transactions" ? (
          <FlatList
            data={transactions}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 40 }}
            onEndReached={() => {
              if (txHasMore && !txLoadingMore) {
                fetchTransactions(txPage + 1, true);
              }
            }}
            onEndReachedThreshold={0.3}
            ListFooterComponent={txLoadingMore ? <ActivityIndicator size="small" color="#6366F1" style={{ marginVertical: 10 }} /> : null}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={5}
            removeClippedSubviews={true}
            renderItem={({ item }) => (
              <View style={styles.historyRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{item.description}</Text>
                  <Text style={styles.rowSub}>{formatDate(item.createdAt)}</Text>
                </View>
                <Text
                  style={[
                    styles.rowAmount,
                    { color: item.type === "CREDIT" ? "#10B981" : "#EF4444" },
                  ]}
                >
                  {item.type === "CREDIT" ? "+" : "-"}₹{item.amount.toFixed(2)}
                </Text>
              </View>
            )}
            ListEmptyComponent={<Text style={styles.emptyListText}>No transactions found.</Text>}
          />
        ) : historyTab === "recharges" ? (
          <FlatList
            data={recharges}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 40 }}
            onEndReached={() => {
              if (reHasMore && !reLoadingMore) {
                fetchRecharges(rePage + 1, true);
              }
            }}
            onEndReachedThreshold={0.3}
            ListFooterComponent={reLoadingMore ? <ActivityIndicator size="small" color="#6366F1" style={{ marginVertical: 10 }} /> : null}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={5}
            removeClippedSubviews={true}
            renderItem={({ item }) => (
              <View style={styles.historyRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>Deposit ({item.scanner})</Text>
                  <Text style={styles.rowSub}>UTR: {item.utrNumber}</Text>
                  <Text style={styles.rowSub}>{formatDate(item.createdAt)}</Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={styles.rowAmount}>₹{item.amount.toFixed(2)}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: item.status === "APPROVED" ? "rgba(16, 185, 129, 0.1)" : item.status === "REJECTED" ? "rgba(239, 68, 68, 0.1)" : "rgba(245, 158, 11, 0.1)" }]}>
                    <Text style={[styles.rowStatus, getStatusStyle(item.status)]}>{item.status}</Text>
                  </View>
                </View>
              </View>
            )}
            ListEmptyComponent={<Text style={styles.emptyListText}>No deposits submitted.</Text>}
          />
        ) : (
          <FlatList
            data={withdrawals}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 40 }}
            onEndReached={() => {
              if (wdHasMore && !wdLoadingMore) {
                fetchWithdrawals(wdPage + 1, true);
              }
            }}
            onEndReachedThreshold={0.3}
            ListFooterComponent={wdLoadingMore ? <ActivityIndicator size="small" color="#10B981" style={{ marginVertical: 10 }} /> : null}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={5}
            removeClippedSubviews={true}
            renderItem={({ item }) => (
              <View style={styles.historyRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>Bank Withdrawal</Text>
                  <Text style={styles.rowSub}>A/C: {item.accountNumber}</Text>
                  <Text style={styles.rowSub}>{formatDate(item.createdAt)}</Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={styles.rowAmount}>₹{item.amount.toFixed(2)}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: item.status === "APPROVED" ? "rgba(16, 185, 129, 0.1)" : item.status === "REJECTED" ? "rgba(239, 68, 68, 0.1)" : "rgba(245, 158, 11, 0.1)" }]}>
                    <Text style={[styles.rowStatus, getStatusStyle(item.status)]}>{item.status}</Text>
                  </View>
                </View>
              </View>
            )}
            ListEmptyComponent={<Text style={styles.emptyListText}>No withdrawals submitted.</Text>}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
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
  historySectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  historySectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#111827",
  },
  historySectionSubtitle: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  historyTabs: {
    flexDirection: "row",
    backgroundColor: "#E5E7EB",
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 2,
    marginBottom: 8,
  },
  hTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 14,
  },
  activeHTab: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
  },
  hTabText: {
    color: "#4B5563",
    fontSize: 13,
    fontWeight: "700",
  },
  activeHTabText: {
    color: "#111827",
    fontWeight: "800",
  },
  listContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 8,
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 2,
  },
  historyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111827",
  },
  rowSub: {
    fontSize: 11,
    color: "#4B5563",
    marginTop: 4,
  },
  rowAmount: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 4,
    alignSelf: "flex-end",
  },
  rowStatus: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  emptyListText: {
    textAlign: "center",
    color: "#9CA3AF",
    paddingVertical: 40,
    fontSize: 14,
    fontWeight: "600",
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
  filterContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: "#F9FAFB",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 46,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOpacity: 0.01,
    shadowRadius: 5,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: "#111827",
    paddingVertical: 8,
    fontWeight: "600",
  },
  searchBtn: {
    marginLeft: 8,
    backgroundColor: "#6366F1",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  searchBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  dateFilterRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  datePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  activeDatePill: {
    backgroundColor: "#6366F1",
    borderColor: "#6366F1",
  },
  datePillText: {
    fontSize: 11,
    color: "#4B5563",
    fontWeight: "700",
  },
  activeDatePillText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
});
