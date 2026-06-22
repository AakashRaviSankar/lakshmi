import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { useAppStore, API_BASE } from "./store";
import axios from "axios";

export default function Cart() {
  const token = useAppStore((state) => state.token);
  const cart = useAppStore((state) => state.cart);
  const removeFromCart = useAppStore((state) => state.removeFromCart);
  const clearCart = useAppStore((state) => state.clearCart);

  const [loading, setLoading] = useState(false);

  const total = cart.reduce((sum, item) => sum + item.amount * item.quantity, 0);

  const handleCheckout = async () => {
    if (!token) {
      Alert.alert("Authentication Needed", "Please log in to purchase tickets.");
      router.push("/login");
      return;
    }

    Alert.alert(
      "Confirm Purchase",
      `Are you sure you want to purchase these tickets for ₹${total.toFixed(2)}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm & Pay",
          onPress: async () => {
            setLoading(true);
            try {
              const tickets = cart.map((item) => ({
                lotteryId: item.lotteryId,
                number: item.number,
                amount: item.amount,
                gameType: item.gameType,
                quantity: item.quantity,
              }));

              await axios.post(
                `${API_BASE}/api/tickets/checkout`,
                { tickets },
                { headers: { Authorization: `Bearer ${token}` } }
              );

              Alert.alert("Success", "All tickets purchased successfully! Good luck!", [
                {
                  text: "OK",
                  onPress: () => {
                    clearCart();
                    router.replace("/");
                  },
                },
              ]);
            } catch (error: any) {
              console.error(error);
              const msg = error.response?.data?.error || "Checkout failed. Please verify your balance and retry.";
              Alert.alert("Purchase Failed", msg);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const getGameLabel = (type: string) => {
    return type.replace("_", " ");
  };

  return (
    <View style={styles.container}>
      {/* Decorative background blobs */}
      <View style={styles.topBlobLeft} />
      <View style={styles.topBlobRight} />

      {cart.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🛒</Text>
          <Text style={styles.emptyText}>Your cart is empty</Text>
          <Text style={styles.emptySubText}>Add some lottery numbers to buy tickets.</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.replace("/")} activeOpacity={0.8}>
            <Text style={styles.backBtnText}>Go Back Home</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <FlatList
            data={cart}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16 }}
            renderItem={({ item }) => (
              <View style={styles.cartCard}>
                <View style={styles.cardInfo}>
                  <Text style={styles.lotteryName}>{item.lotteryName}</Text>
                  <Text style={styles.gameLabel}>{getGameLabel(item.gameType)}</Text>
                  <Text style={styles.betNumber}>Number: {item.number} (Qty: {item.quantity})</Text>
                </View>
                <View style={styles.cardActions}>
                  <Text style={styles.priceText}>₹{(item.amount * item.quantity).toFixed(2)}</Text>
                  <Text style={{ fontSize: 11, color: "#4B5563", marginTop: 2 }}>₹{item.amount.toFixed(2)} each</Text>
                  <TouchableOpacity style={styles.deleteBtn} onPress={() => removeFromCart(item.id)} activeOpacity={0.7}>
                    <Text style={styles.deleteBtnText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />

          {/* Checkout Footer */}
          <View style={styles.footer}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Qty: {cart.reduce((sum, item) => sum + item.quantity, 0)}</Text>
              <Text style={styles.totalAmount}>₹{total.toFixed(2)}</Text>
            </View>

            {loading ? (
              <ActivityIndicator size="large" color="#10B981" style={{ marginVertical: 10 }} />
            ) : (
              <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout} activeOpacity={0.85}>
                <Text style={styles.checkoutBtnText}>PAY & CHECKOUT (₹{total.toFixed(2)})</Text>
              </TouchableOpacity>
            )}
          </View>
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
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
  },
  emptySubText: {
    fontSize: 14,
    color: "#4B5563",
    marginTop: 8,
    marginBottom: 28,
    textAlign: "center",
  },
  backBtn: {
    backgroundColor: "#6366F1",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: "#6366F1",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 2,
  },
  backBtnText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "800",
  },
  cartCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  cardInfo: {
    flex: 1,
  },
  lotteryName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
  },
  gameLabel: {
    fontSize: 12,
    color: "#6366F1",
    marginTop: 4,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  betNumber: {
    fontSize: 14,
    color: "#1F2937",
    marginTop: 6,
    fontWeight: "800",
  },
  cardActions: {
    alignItems: "flex-end",
  },
  priceText: {
    fontSize: 17,
    fontWeight: "800",
    color: "#10B981",
  },
  deleteBtn: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#EF4444",
    borderRadius: 8,
  },
  deleteBtnText: {
    color: "#EF4444",
    fontSize: 12,
    fontWeight: "700",
  },
  footer: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    padding: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 5,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  totalLabel: {
    fontSize: 15,
    color: "#4B5563",
    fontWeight: "700",
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111827",
  },
  checkoutBtn: {
    backgroundColor: "#10B981",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#10B981",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 2,
  },
  checkoutBtnText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});
