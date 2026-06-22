import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image } from "react-native";
import { useState, useEffect } from "react";
import { router } from "expo-router";
import { useAppStore, API_BASE } from "./store";
import axios from "axios";

interface Result {
  id: string;
  name: string;
  category: "DEAR" | "KERALA";
  drawTime: string;
  winningNumber: string;
}

export default function Results() {
  const token = useAppStore((state) => state.token);

  const [results, setResults] = useState<Result[]>([]);
  const [activeCategory, setActiveCategory] = useState<"ALL" | "DEAR" | "KERALA">("ALL");
  const [loading, setLoading] = useState(false);

  // Pagination states
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    if (token) {
      fetchResults(1, false);
    }
  }, [token, activeCategory]);

  const fetchResults = async (pageNum = 1, isLoadMore = false) => {
    if (!token) return;
    if (isLoadMore) {
      if (!hasMore || loadingMore) return;
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    try {
      let url = `${API_BASE}/api/results?page=${pageNum}&limit=20`;
      if (activeCategory !== "ALL") {
        url += `&category=${activeCategory}`;
      }
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const newResults = res.data.data || [];
      const pagination = res.data.pagination || { hasMore: false };
      
      if (isLoadMore) {
        setResults((prev) => [...prev, ...newResults]);
      } else {
        setResults(newResults);
      }
      
      setPage(pageNum);
      setHasMore(pagination.hasMore);
    } catch (error) {
      console.error("Results fetch error:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (hasMore && !loadingMore && !loading) {
      fetchResults(page + 1, true);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      });
    } catch (e) {
      return dateStr;
    }
  };

  const formatDrawTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      });
    } catch (e) {
      return dateStr;
    }
  };

  if (!token) {
    return (
      <View style={styles.placeholderContainer}>
        <Image
          source={require("../assets/lakshmi_logo.png")}
          style={styles.logoPlaceholder}
        />
        <Text style={styles.placeholderText}>Please log in to view draw results.</Text>
        <TouchableOpacity style={styles.loginBtn} onPress={() => router.push("/login")}>
          <Text style={styles.loginBtnText}>Go to Login / Register</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderResultItem = ({ item }: { item: Result }) => {
    // Split winning digits into individual circles
    const digits = (item.winningNumber || "").split("");

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.badgeContainer}>
            <Text style={[styles.badgeText, item.category === "DEAR" ? styles.dearBadge : styles.keralaBadge]}>
              {item.category}
            </Text>
          </View>
          <View style={styles.timeContainer}>
            <Text style={styles.cardDate}>{formatDate(item.drawTime)}</Text>
            <Text style={styles.cardTime}>• {formatDrawTime(item.drawTime)}</Text>
          </View>
        </View>

        <Text style={styles.cardName}>{item.name}</Text>

        <View style={styles.winningContainer}>
          <Text style={styles.winningLabel}>WINNING NUMBER</Text>
          <View style={styles.digitsRow}>
            {digits.map((digit, idx) => (
              <View key={idx} style={styles.digitCircle}>
                <Text style={styles.digitText}>{digit}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  };

  const getBannerDetails = () => {
    if (activeCategory === "DEAR") {
      return {
        image: require("../assets/dear_lottery.jpg"),
        title: "Dear Lottery Results",
        subtitle: "1:00 PM, 6:00 PM, & 8:00 PM Daily draws"
      };
    }
    if (activeCategory === "KERALA") {
      return {
        image: require("../assets/kerala_lottery.jpg"),
        title: "Kerala State Results",
        subtitle: "3:00 PM Bumper & Weekly draws"
      };
    }
    return {
      image: require("../assets/dear_lottery.jpg"),
      title: "All Draw Results",
      subtitle: "Browse recent completed game numbers"
    };
  };

  const banner = getBannerDetails();

  return (
    <View style={styles.container}>
      {/* Category selector tabs */}
      <View style={styles.tabsContainer}>
        {(["ALL", "DEAR", "KERALA"] as const).map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.tabButton, activeCategory === cat && styles.activeTabButton]}
            onPress={() => {
              setActiveCategory(cat);
              setResults([]);
              setPage(1);
            }}
          >
            <Text style={[styles.tabText, activeCategory === cat && styles.activeTabText]}>
              {cat === "ALL" ? "All Draws" : cat}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Banner */}
      <View style={styles.categoryBannerContainer}>
        <Image source={banner.image} style={styles.categoryBannerImage} />
        <View style={styles.categoryBannerOverlay}>
          <Text style={styles.categoryBannerTitle}>{banner.title}</Text>
          <Text style={styles.categoryBannerSubtitle}>{banner.subtitle}</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={renderResultItem}
          contentContainerStyle={styles.listContent}
          onEndReached={loadMore}
          onEndReachedThreshold={0.2}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyText}>No results posted yet</Text>
              <Text style={styles.emptySubText}>Check back later after completed draws.</Text>
            </View>
          }
          ListFooterComponent={
            loadingMore ? <ActivityIndicator size="small" color="#6366F1" style={{ marginVertical: 12 }} /> : null
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
  placeholderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#F3F4F6",
  },
  logoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 20,
    backgroundColor: "#FFF",
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
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  activeTabButton: {
    backgroundColor: "rgba(99, 102, 241, 0.08)",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#6B7280",
  },
  activeTabText: {
    color: "#6366F1",
  },
  categoryBannerContainer: {
    height: 90,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  categoryBannerImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  categoryBannerOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    backgroundColor: "rgba(17, 24, 39, 0.55)",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  categoryBannerTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  categoryBannerSubtitle: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 4,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  badgeContainer: {
    borderRadius: 6,
    overflow: "hidden",
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "800",
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  dearBadge: {
    backgroundColor: "rgba(99, 102, 241, 0.12)",
    color: "#6366F1",
  },
  keralaBadge: {
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    color: "#10B981",
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardDate: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4B5563",
  },
  cardTime: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    marginLeft: 4,
  },
  cardName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: 16,
  },
  winningContainer: {
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  winningLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: "#9CA3AF",
    letterSpacing: 1,
    marginBottom: 8,
  },
  digitsRow: {
    flexDirection: "row",
    gap: 8,
  },
  digitCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#6366F1",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#6366F1",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  digitText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1F2937",
  },
  emptySubText: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 6,
  },
});