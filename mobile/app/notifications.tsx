import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { useState, useEffect } from "react";
import { router } from "expo-router";
import { useAppStore, API_BASE } from "./store";
import axios from "axios";

interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export default function Notifications() {
  const token = useAppStore((state) => state.token);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  // Pagination states
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    fetchNotifications(1, false);
  }, [token]);

  const fetchNotifications = async (pageNum = 1, isLoadMore = false) => {
    if (!token) return;
    if (isLoadMore) {
      if (!hasMore || loadingMore) return;
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    try {
      const res = await axios.get(`${API_BASE}/api/notifications?page=${pageNum}&limit=20`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const dataList = res.data.data || [];
      const hasM = res.data.pagination?.hasMore ?? false;

      if (isLoadMore) {
        setNotifications((prev) => [...prev, ...dataList]);
        setPage(pageNum);
        setHasMore(hasM);
      } else {
        setNotifications(dataList);
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

  const handleMarkAllRead = async () => {
    if (!token) return;
    try {
      await axios.post(
        `${API_BASE}/api/notifications`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchNotifications();
    } catch (error) {
      console.error(error);
    }
  };

  const getRelativeTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (!token) {
    return (
      <View style={styles.container}>
        <View style={styles.topBlobLeft} />
        <View style={styles.topBlobRight} />
        <View style={styles.placeholderContainer}>
          <Text style={styles.placeholderText}>Please log in to view alerts.</Text>
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

      {notifications.length > 0 && (
        <TouchableOpacity style={styles.markReadBtn} onPress={handleMarkAllRead} activeOpacity={0.7}>
          <Text style={styles.markReadText}>Mark all as read</Text>
        </TouchableOpacity>
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#6366F1" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          onEndReached={() => {
            if (hasMore && !loadingMore) {
              fetchNotifications(page + 1, true);
            }
          }}
          onEndReachedThreshold={0.3}
          ListFooterComponent={loadingMore ? <ActivityIndicator size="small" color="#6366F1" style={{ marginVertical: 10 }} /> : null}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={true}
          renderItem={({ item }) => (
            <View style={[styles.notificationCard, !item.read && styles.unreadCard]}>
              <View style={styles.cardHeader}>
                <Text style={[styles.cardTitle, !item.read && styles.unreadText]}>{item.title}</Text>
                {!item.read && <View style={styles.unreadDot} />}
              </View>
              <Text style={styles.cardMessage}>{item.message}</Text>
              <Text style={styles.cardTime}>{getRelativeTime(item.createdAt)}</Text>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🔔</Text>
              <Text style={styles.emptyText}>No notifications yet</Text>
              <Text style={styles.emptySubText}>Alerts for recharge approvals, withdrawals, and game winnings will appear here.</Text>
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
  markReadBtn: {
    alignSelf: "flex-end",
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    padding: 6,
  },
  markReadText: {
    color: "#6366F1",
    fontSize: 13,
    fontWeight: "700",
  },
  notificationCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderLeftWidth: 4,
    borderLeftColor: "#9CA3AF",
    shadowColor: "#000",
    shadowOpacity: 0.01,
    shadowRadius: 8,
    elevation: 1,
  },
  unreadCard: {
    borderLeftColor: "#6366F1",
    backgroundColor: "rgba(99, 102, 241, 0.03)",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#4B5563",
  },
  unreadText: {
    color: "#111827",
    fontWeight: "800",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#6366F1",
  },
  cardMessage: {
    fontSize: 13,
    color: "#1F2937",
    marginTop: 6,
    lineHeight: 20,
  },
  cardTime: {
    fontSize: 10,
    color: "#9CA3AF",
    marginTop: 8,
    textAlign: "right",
    fontWeight: "600",
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 80,
    paddingHorizontal: 30,
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
