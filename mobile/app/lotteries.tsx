import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, ScrollView, TextInput, Alert, ActivityIndicator, Image } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { useAppStore, API_BASE, getTicketPayout } from "./store";
import axios from "axios";

interface Show {
  id: string;
  name: string;
  category: "DEAR" | "KERALA";
  drawTime: string;
  ticketPrice: number;
  status: string;
}

export default function Lotteries() {
  const token = useAppStore((state) => state.token);
  const cart = useAppStore((state) => state.cart);
  const addToCart = useAppStore((state) => state.addToCart);

  const [lotteries, setLotteries] = useState<Show[]>([]);
  const [activeTab, setActiveTab] = useState<"DEAR" | "KERALA">("DEAR");
  const [loading, setLoading] = useState(false);

  // Play Modal State
  const [selectedShow, setSelectedShow] = useState<Show | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [gameType, setGameType] = useState<string>("THREE_DIGIT");
  const [numberInput, setNumberInput] = useState("");
  const [amountInput, setAmountInput] = useState("12");
  const [quantity, setQuantity] = useState(1);

  const getDefaultPriceForGameType = (type: string) => {
    if (type.startsWith("SINGLE")) return "11";
    if (type.startsWith("DOUBLE")) return "11";
    if (type === "THREE_DIGIT") return "12";
    if (type === "FOUR_DIGIT") return "50";
    return "10";
  };

  const handleGameTypeChange = (type: string) => {
    setGameType(type);
    setNumberInput("");
    setAmountInput(getDefaultPriceForGameType(type));
  };

  const fetchLotteries = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/lotteries`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLotteries(res.data);
    } catch (error) {
      console.error("Failed to fetch lotteries:", error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      fetchLotteries();
    }, [fetchLotteries])
  );

  const formatDrawTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }) + " - " + date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
      });
    } catch (e) {
      return dateStr;
    }
  };

  const getRequiredLength = (type: string): number => {
    if (type.startsWith("SINGLE")) return 1;
    if (type.startsWith("DOUBLE")) return 2;
    if (type === "THREE_DIGIT") return 3;
    if (type === "FOUR_DIGIT") return 4;
    return 0;
  };

  const getGameTypeLabel = (type: string): string => {
    return type.replace("_", " ");
  };

  const handleAddToCart = () => {
    if (!selectedShow) return;

    const reqLen = getRequiredLength(gameType);
    if (!numberInput || numberInput.length !== reqLen) {
      Alert.alert("Validation Error", `Please enter exactly ${reqLen} digit(s) for ${getGameTypeLabel(gameType)}.`);
      return;
    }

    if (!/^\d+$/.test(numberInput)) {
      Alert.alert("Validation Error", "Please enter numeric digits only.");
      return;
    }

    const price = Number(amountInput);
    if (isNaN(price) || price <= 0) {
      Alert.alert("Validation Error", "Invalid ticket price.");
      return;
    }

    addToCart({
      lotteryId: selectedShow.id,
      lotteryName: selectedShow.name,
      number: numberInput,
      amount: price,
      gameType: gameType,
      quantity: quantity,
    });

    Alert.alert("Added to Cart", "Your ticket has been added to the shopping cart.");
    setModalVisible(false);
    setNumberInput("");
    setQuantity(1);
  };

  const banner = activeTab === "DEAR"
    ? { image: require("../assets/dear_lottery.jpg"), title: "KL DEAR LOTTERY SHOWS", desc: "Draws held daily at 1:00 PM, 6:00 PM & 8:00 PM" }
    : { image: require("../assets/kerala_lottery.jpg"), title: "KERALA STATE SHOWS", desc: "Draws held daily at 3:00 PM Bumper Shows" };

  return (
    <View style={styles.container}>
      {/* Category Tabs */}
      <View style={styles.tabsContainer}>
        {(["DEAR", "KERALA"] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab === "DEAR" ? "Dear Shows" : "Kerala Shows"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Category Banner */}
      <View style={styles.bannerContainer}>
        <Image source={banner.image} style={styles.bannerImage} />
        <View style={styles.bannerOverlay}>
          <Text style={styles.bannerTitle}>{banner.title}</Text>
          <Text style={styles.bannerSubtitle}>{banner.desc}</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
      ) : (
        <FlatList
          data={lotteries.filter((item) => item.category === activeTab)}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardName}>{item.name}</Text>
                <View style={styles.badgeContainer}>
                  <Text style={[styles.badgeText, item.category === "DEAR" ? styles.dearBadge : styles.keralaBadge]}>
                    {item.category}
                  </Text>
                </View>
              </View>

              <View style={styles.cardBody}>
                <Text style={styles.cardTime}>🗓️ Draw Time: {formatDrawTime(item.drawTime)}</Text>
              </View>

              <View style={styles.cardPerforation} />

              <View style={styles.cardFooter}>
                <TouchableOpacity
                  style={styles.playBtn}
                  onPress={() => {
                    setSelectedShow(item);
                    handleGameTypeChange("THREE_DIGIT");
                    setModalVisible(true);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.playBtnText}>Play Draw</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🎫</Text>
              <Text style={styles.emptyText}>No active draws found</Text>
              <Text style={styles.emptySubText}>Please check back later.</Text>
            </View>
          }
        />
      )}

      {/* Floating Shopping Cart Button */}
      {cart.length > 0 && (
        <TouchableOpacity
          style={styles.floatingCartBtn}
          onPress={() => router.push("/cart")}
          activeOpacity={0.9}
        >
          <Text style={styles.floatingCartIcon}>🛒</Text>
          <View style={styles.cartBadge}>
            <Text style={styles.cartBadgeText}>{cart.length}</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Play modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderIndicator} />
            <Text style={styles.modalTitle}>Play Show</Text>
            <Text style={styles.modalSub}>{selectedShow?.name}</Text>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* Game Type Selection */}
              <Text style={styles.sectionLabel}>Select Game Type</Text>
              <View style={styles.gridSelector}>
                {["SINGLE_A", "SINGLE_B", "SINGLE_C", "DOUBLE_AB", "DOUBLE_BC", "DOUBLE_AC", "THREE_DIGIT", "FOUR_DIGIT"].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.selectorBtn, gameType === type && styles.activeSelectorBtn]}
                    onPress={() => handleGameTypeChange(type)}
                  >
                    <Text style={[styles.selectorText, gameType === type && styles.activeSelectorText]}>
                      {getGameTypeLabel(type)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Estimated Payout Display */}
              <View style={styles.payoutContainer}>
                <Text style={styles.payoutLabel}>Est. Payout (Single Qty)</Text>
                <Text style={styles.payoutVal}>₹{getTicketPayout(gameType, Number(amountInput)).toLocaleString()}</Text>
              </View>

              {/* Number Input Field */}
              <View style={{ position: "relative" }}>
                <Text style={styles.inputLabel}>
                  Pick Number ({getRequiredLength(gameType)} Digits) <Text style={styles.requiredStar}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder={`Enter exactly ${getRequiredLength(gameType)} digit(s)`}
                  placeholderTextColor="#9CA3AF"
                  keyboardType="number-pad"
                  maxLength={getRequiredLength(gameType)}
                  value={numberInput}
                  onChangeText={(val) => setNumberInput(val.replace(/[^0-9]/g, ""))}
                />
              </View>

              {/* Price Selection */}
              <Text style={styles.sectionLabel}>Ticket Price (₹)</Text>
              {gameType === "THREE_DIGIT" ? (
                <View style={styles.priceBtnRow}>
                  {["12", "28", "30", "55", "60"].map((price) => (
                    <TouchableOpacity
                      key={price}
                      style={[styles.priceBtn, amountInput === price && styles.activePriceBtn]}
                      onPress={() => setAmountInput(price)}
                    >
                      <Text style={[styles.priceBtnText, amountInput === price && styles.activePriceBtnText]}>
                        ₹{price}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={styles.fixedPriceBlock}>
                  <Text style={styles.fixedPriceText}>Fixed price: ₹{amountInput}</Text>
                </View>
              )}

              {/* Quantity */}
              <Text style={styles.sectionLabel}>Quantity</Text>
              <View style={styles.quantityContainer}>
                <TouchableOpacity
                  style={[styles.quantityBtn, quantity <= 1 && styles.quantityBtnDisabled]}
                  onPress={() => quantity > 1 && setQuantity(quantity - 1)}
                  disabled={quantity <= 1}
                >
                  <Text style={styles.quantityBtnText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.quantityText}>{quantity}</Text>
                <TouchableOpacity
                  style={styles.quantityBtn}
                  onPress={() => setQuantity(quantity + 1)}
                >
                  <Text style={styles.quantityBtnText}>+</Text>
                </TouchableOpacity>
              </View>

              {/* Total Cost Display */}
              <View style={styles.costRow}>
                <Text style={styles.costLabel}>Total Cost:</Text>
                <Text style={styles.costValue}>₹{(Number(amountInput) * quantity).toFixed(2)}</Text>
              </View>

              {/* Add to Cart Actions */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.addCartBtn}
                  onPress={handleAddToCart}
                >
                  <Text style={styles.addCartBtnText}>Add To Cart</Text>
                </TouchableOpacity>
              </View>
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
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
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 10,
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
  bannerContainer: {
    height: 90,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    overflow: "hidden",
    position: "relative",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  bannerImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  bannerOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    backgroundColor: "rgba(17, 24, 39, 0.6)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  bannerTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  bannerSubtitle: {
    color: "rgba(255, 255, 255, 0.85)",
    fontSize: 10,
    fontWeight: "600",
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  cardName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111827",
  },
  badgeContainer: {
    borderRadius: 8,
    overflow: "hidden",
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "900",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  dearBadge: {
    backgroundColor: "rgba(99, 102, 241, 0.1)",
    color: "#6366F1",
  },
  keralaBadge: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    color: "#10B981",
  },
  cardBody: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  cardTime: {
    fontSize: 12,
    color: "#4B5563",
    fontWeight: "600",
  },
  cardPerforation: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 12,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 1,
  },
  cardFooter: {
    padding: 12,
    alignItems: "flex-end",
  },
  playBtn: {
    backgroundColor: "#6366F1",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  playBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
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
    color: "#6B7280",
    marginTop: 4,
  },
  floatingCartBtn: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#10B981",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#10B981",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  floatingCartIcon: {
    fontSize: 24,
  },
  cartBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "#EF4444",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  cartBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(17, 24, 39, 0.4)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    maxHeight: "85%",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 10,
  },
  modalHeaderIndicator: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D1D5DB",
    alignSelf: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
    textAlign: "center",
  },
  modalSub: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 4,
    marginBottom: 16,
    fontWeight: "600",
  },
  modalScroll: {
    marginVertical: 10,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#4B5563",
    marginTop: 16,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  gridSelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  selectorBtn: {
    flex: 1,
    minWidth: "22%",
    backgroundColor: "#F3F4F6",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  activeSelectorBtn: {
    backgroundColor: "#6366F1",
    borderColor: "#6366F1",
  },
  selectorText: {
    fontSize: 12,
    color: "#374151",
    fontWeight: "700",
  },
  activeSelectorText: {
    color: "#FFFFFF",
  },
  payoutContainer: {
    backgroundColor: "rgba(16, 185, 129, 0.08)",
    padding: 12,
    borderRadius: 10,
    marginTop: 16,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  payoutLabel: {
    fontSize: 12,
    color: "#065F46",
    fontWeight: "700",
  },
  payoutVal: {
    fontSize: 14,
    color: "#10B981",
    fontWeight: "800",
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#4B5563",
    marginTop: 8,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  requiredStar: {
    color: "#EF4444",
  },
  input: {
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: "#111827",
    fontWeight: "700",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  priceBtnRow: {
    flexDirection: "row",
    gap: 8,
  },
  priceBtn: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  activePriceBtn: {
    backgroundColor: "#10B981",
    borderColor: "#10B981",
  },
  priceBtnText: {
    fontSize: 13,
    color: "#374151",
    fontWeight: "800",
  },
  activePriceBtnText: {
    color: "#FFFFFF",
  },
  fixedPriceBlock: {
    backgroundColor: "#F3F4F6",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  fixedPriceText: {
    fontSize: 13,
    color: "#374151",
    fontWeight: "700",
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    marginTop: 6,
    marginBottom: 20,
  },
  quantityBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  quantityBtnDisabled: {
    opacity: 0.5,
  },
  quantityBtnText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#374151",
  },
  quantityText: {
    fontSize: 18,
    fontWeight: "900",
    color: "#111827",
  },
  costRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 16,
    marginBottom: 20,
  },
  costLabel: {
    fontSize: 14,
    fontWeight: "800",
    color: "#4B5563",
  },
  costValue: {
    fontSize: 18,
    fontWeight: "900",
    color: "#111827",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cancelBtnText: {
    color: "#374151",
    fontSize: 14,
    fontWeight: "800",
  },
  addCartBtn: {
    flex: 1.5,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#6366F1",
    alignItems: "center",
    shadowColor: "#6366F1",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 2,
  },
  addCartBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
});