import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Alert, ActivityIndicator, ScrollView, Modal, Image, KeyboardAvoidingView, Platform } from "react-native";
import { useState, useEffect } from "react";
import { router } from "expo-router";
import { useAppStore, API_BASE } from "./store";
import axios from "axios";
import * as Clipboard from "expo-clipboard";

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

export default function Wallet() {
  const token = useAppStore((state) => state.token);

  // Modal visibility states
  const [depositModalVisible, setDepositModalVisible] = useState(false);
  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);

  // Data state
  const [balance, setBalance] = useState(0);
  const [withdrawableBalance, setWithdrawableBalance] = useState(0);
  const [loading, setLoading] = useState(false);

  // Deposit Form State
  const [selectedScanner, setSelectedScanner] = useState<"Scanner 1" | "Scanner 2" | "Scanner 3">("Scanner 1");
  const [depositAmount, setDepositAmount] = useState("");
  const [utrNumber, setUtrNumber] = useState("");


  // Withdrawal Form State
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [upiId, setUpiId] = useState("");
  const [saveDetails, setSaveDetails] = useState(true);

  useEffect(() => {
    fetchWallet();
    fetchSavedPaymentDetails();
  }, [token]);

  const fetchSavedPaymentDetails = async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API_BASE}/api/user/payment-details`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data) {
        setAccountNumber(res.data.bankAccountNumber || "");
        setIfscCode(res.data.bankIfscCode || "");
        setAccountHolder(res.data.bankAccountHolder || "");
        setUpiId(res.data.upiId || "");
      }
    } catch (error) {
      console.error("Error fetching payment details:", error);
    }
  };
  const fetchWallet = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/wallet`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBalance(res.data.wallet?.balance || 0);
      setWithdrawableBalance(res.data.wallet?.withdrawableBalance || 0);
    } catch (error) {
      console.error("Error fetching wallet details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async () => {
    const amt = parseFloat(depositAmount);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert("Invalid Amount", "Please enter a positive deposit amount.");
      return;
    }
    if (amt < 100) {
      Alert.alert("Minimum Amount", "Minimum recharge amount is ₹100.");
      return;
    }
    if (!utrNumber || utrNumber.length < 6) {
      Alert.alert("Invalid UTR", "Please enter a valid Transaction UTR (at least 6 digits).");
      return;
    }

    Alert.alert(
      "Confirm Deposit",
      `Are you sure you want to submit a deposit request for ₹${amt.toFixed(2)} with UTR ${utrNumber}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            setLoading(true);
            try {
              await axios.post(
                `${API_BASE}/api/recharge`,
                {
                  amount: amt,
                  utrNumber,
                  scanner: selectedScanner,
                },
                { headers: { Authorization: `Bearer ${token}` } }
              );

              Alert.alert("Success", "Recharge request submitted successfully for approval.");
              setDepositAmount("");
              setUtrNumber("");
              fetchWallet();
              setDepositModalVisible(false);
            } catch (error: any) {
              console.error(error);
              const msg = error.response?.data?.error || "Failed to submit request.";
              Alert.alert("Error", msg);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleWithdraw = async () => {
    const amt = parseFloat(withdrawAmount);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert("Invalid Amount", "Please enter a positive withdrawal amount.");
      return;
    }
    if (amt < 100) {
      Alert.alert("Minimum Amount", "Minimum withdrawal amount is ₹100.");
      return;
    }
    if (amt > withdrawableBalance) {
      Alert.alert("Insufficient Funds", "You do not have enough withdrawable balance to withdraw.");
      return;
    }
    if (!accountNumber || !ifscCode || !accountHolder) {
      Alert.alert("Missing Details", "Please fill in all bank details.");
      return;
    }

    Alert.alert(
      "Confirm Withdrawal",
      `Are you sure you want to request a withdrawal of ₹${amt.toFixed(2)} to account ${accountNumber}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            setLoading(true);
            try {
              // Submit withdrawal request
              await axios.post(
                `${API_BASE}/api/wallet/withdraw`,
                {
                  amount: amt,
                  accountNumber,
                  ifscCode,
                  accountHolder,
                  upiId: upiId || undefined,
                },
                { headers: { Authorization: `Bearer ${token}` } }
              );

              // Save payment details if enabled
              if (saveDetails) {
                try {
                  await axios.post(
                    `${API_BASE}/api/user/payment-details`,
                    {
                      bankAccountNumber: accountNumber,
                      bankIfscCode: ifscCode,
                      bankAccountHolder: accountHolder,
                      upiId: upiId || "",
                    },
                    { headers: { Authorization: `Bearer ${token}` } }
                  );
                } catch (saveError) {
                  console.error("Failed to save payment details:", saveError);
                }
              }

              Alert.alert("Success", "Withdrawal request submitted! Funds deducted from wallet.");
              setWithdrawAmount("");
              fetchWallet();
              setWithdrawModalVisible(false);
            } catch (error: any) {
              console.error(error);
              const msg = error.response?.data?.error || "Withdrawal failed.";
              Alert.alert("Error", msg);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const getScannerUpi = (scanner: string) => {
    return "rkk065@upi";
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
          <Text style={styles.placeholderText}>Please log in to view wallet details.</Text>
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

      {/* Credit/Debit Card balance display */}
      <View style={styles.balanceCard}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardBrand}>KL DEAR DIGITAL WALLET</Text>
          <Text style={styles.cardChip}>📟</Text>
        </View>
        
        <View>
          <Text style={styles.balanceTitle}>Deposit Balance (Play)</Text>
          <Text style={styles.balanceAmount}>₹{balance.toFixed(2)}</Text>
        </View>
        
        <View style={{ borderTopWidth: 1, borderTopColor: "rgba(255, 255, 255, 0.15)", marginTop: 14, paddingTop: 14 }}>
          <Text style={styles.balanceTitle}>Withdrawable Winnings</Text>
          <Text style={[styles.balanceAmount, { color: "#10B981", marginTop: 4 }]}>₹{withdrawableBalance.toFixed(2)}</Text>
        </View>

        <View style={styles.cardFooterRow}>
          <Text style={styles.cardStatus}>ACTIVE</Text>
        </View>
      </View>

      {/* Quick Actions Row */}
      <View style={styles.quickActionsRow}>
        <TouchableOpacity
          style={[styles.quickActionBtn, styles.depositBtnBg]}
          onPress={() => setDepositModalVisible(true)}
          activeOpacity={0.85}
        >
          <View style={[styles.quickActionIconBg, { backgroundColor: "rgba(99, 102, 241, 0.1)" }]}>
            <Text style={styles.quickActionIcon}>📥</Text>
          </View>
          <View style={styles.quickActionTextContainer}>
            <Text style={styles.quickActionTitle}>Deposit Funds</Text>
            <Text style={styles.quickActionSubtitle}>Instant UPI</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickActionBtn, styles.withdrawBtnBg]}
          onPress={() => setWithdrawModalVisible(true)}
          activeOpacity={0.85}
        >
          <View style={[styles.quickActionIconBg, { backgroundColor: "rgba(16, 185, 129, 0.1)" }]}>
            <Text style={styles.quickActionIcon}>📤</Text>
          </View>
          <View style={styles.quickActionTextContainer}>
            <Text style={styles.quickActionTitle}>Withdraw Cash</Text>
            <Text style={styles.quickActionSubtitle}>To Bank A/C</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* View Transaction History Link */}
      <View style={styles.historyLinkContainer}>
        <Text style={styles.historyLinkTitle}>Account Statement Ledger</Text>
        <Text style={styles.historyLinkSubtitle}>
          Track all deposit recharges, payout winnings, and bank withdrawals.
        </Text>
        <TouchableOpacity
          style={styles.historyLinkBtn}
          onPress={() => router.push("/transactions")}
          activeOpacity={0.8}
        >
          <Text style={styles.historyLinkBtnText}>View Transaction Feed ➔</Text>
        </TouchableOpacity>
      </View>

      {/* Deposit Modal Sheet */}
      <Modal
        visible={depositModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDepositModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
            <View style={styles.modalHeaderIndicator} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Deposit Funds</Text>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setDepositModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCloseBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalFormScroll}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.sectionLabel}>Select Payment Gateway</Text>
              <View style={styles.scannerPicker}>
                {["Scanner 1", "Scanner 2", "Scanner 3"].map((s: any) => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.scannerBtn, selectedScanner === s && styles.activeScannerBtn]}
                    onPress={() => setSelectedScanner(s)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[styles.scannerBtnText, selectedScanner === s && styles.activeScannerBtnText]}
                    >
                      {s}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.qrDisplayBlock}>
                <Image
                  source={{ uri: `${API_BASE}/QR.png` }}
                  style={styles.qrImage as any}
                  resizeMode="contain"
                />
                <View style={styles.upiDetailsRow}>
                  <Text style={styles.upiText}>{getScannerUpi(selectedScanner)}</Text>
                  <TouchableOpacity
                    style={styles.copyBtn}
                    onPress={async () => {
                      const upi = getScannerUpi(selectedScanner);
                      await Clipboard.setStringAsync(upi);
                      Alert.alert("UPI Copied", `Address "${upi}" copied to clipboard!`);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.copyBtnText}>Copy ID</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.qrGuide}>
                  Transfer funds via scanner and submit the 12-digit UTR below.
                </Text>
              </View>

              {/* Minimum recharge notice */}
              <View style={styles.minNotice}>
                <Text style={styles.minNoticeText}>📌 Minimum recharge amount is ₹100</Text>
              </View>

              <Text style={styles.inputLabel}>Deposit Amount (₹) <Text style={styles.requiredStar}>*</Text></Text>
              <TextInput
                style={styles.input}
                placeholder="Minimum ₹100"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                maxLength={9}
                value={depositAmount}
                onChangeText={setDepositAmount}
              />

              <Text style={styles.inputLabel}>UTR / Transaction ID (12 digits) <Text style={styles.requiredStar}>*</Text></Text>
              <TextInput
                style={styles.input}
                placeholder="UTR / Transaction ID (12 digits)"
                placeholderTextColor="#9CA3AF"
                keyboardType="number-pad"
                maxLength={12}
                value={utrNumber}
                onChangeText={setUtrNumber}
              />



              {loading ? (
                <ActivityIndicator size="large" color="#6366F1" style={{ marginVertical: 15 }} />
              ) : (
                <TouchableOpacity
                  style={styles.submitBtn}
                  onPress={handleDeposit}
                  activeOpacity={0.8}
                >
                  <Text style={styles.submitBtnText}>Submit Deposit Request</Text>
                </TouchableOpacity>
              )}
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Withdraw Modal Sheet */}
      <Modal
        visible={withdrawModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setWithdrawModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
            <View style={styles.modalHeaderIndicator} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Withdraw to Bank</Text>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setWithdrawModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCloseBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalFormScroll}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.modalBalanceBanner}>
                <Text style={styles.modalBalanceLabel}>Your Withdrawable Balance</Text>
                <Text style={[styles.modalBalanceValue, { color: "#10B981" }]}>₹{withdrawableBalance.toFixed(2)}</Text>
              </View>

              {/* Withdrawal disclaimer */}
              <View style={styles.withdrawDisclaimer}>
                <Text style={styles.withdrawDisclaimerTitle}>⚠️ Important Notice</Text>
                <Text style={styles.withdrawDisclaimerText}>
                  Please ensure all bank details (account number, IFSC, holder name) are correct before submitting. We are not responsible for any loss due to incorrect payment details provided by the user.
                </Text>
              </View>

              {/* Minimum withdrawal notice */}
              <View style={styles.minNotice}>
                <Text style={styles.minNoticeText}>📌 Minimum withdrawal amount is ₹100</Text>
              </View>

              <Text style={styles.inputLabel}>Withdrawal Amount (₹) <Text style={styles.requiredStar}>*</Text></Text>
              <TextInput
                style={styles.input}
                placeholder="Minimum ₹100"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                maxLength={9}
                value={withdrawAmount}
                onChangeText={setWithdrawAmount}
              />

              <Text style={styles.inputLabel}>Bank Account Number <Text style={styles.requiredStar}>*</Text></Text>
              <TextInput
                style={styles.input}
                placeholder="Bank Account Number"
                placeholderTextColor="#9CA3AF"
                keyboardType="number-pad"
                maxLength={20}
                value={accountNumber}
                onChangeText={setAccountNumber}
              />

              <Text style={styles.inputLabel}>IFSC Code <Text style={styles.requiredStar}>*</Text></Text>
              <TextInput
                style={styles.input}
                placeholder="IFSC Code"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="characters"
                maxLength={11}
                value={ifscCode}
                onChangeText={setIfscCode}
              />

              <Text style={styles.inputLabel}>Account Holder Name <Text style={styles.requiredStar}>*</Text></Text>
              <TextInput
                style={styles.input}
                placeholder="Account Holder Name"
                placeholderTextColor="#9CA3AF"
                maxLength={50}
                value={accountHolder}
                onChangeText={setAccountHolder}
              />

              <Text style={styles.inputLabel}>UPI ID (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="UPI ID (e.g., name@upi)"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="none"
                maxLength={50}
                value={upiId}
                onChangeText={setUpiId}
              />

              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setSaveDetails(!saveDetails)}
                activeOpacity={0.8}
              >
                <View style={[styles.checkboxBox, saveDetails && styles.checkboxBoxChecked]}>
                  {saveDetails && <Text style={styles.checkboxCheckmark}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}>Save payment details for future use</Text>
              </TouchableOpacity>

              {loading ? (
                <ActivityIndicator size="large" color="#10B981" style={{ marginVertical: 15 }} />
              ) : (
                <TouchableOpacity
                  style={[styles.submitBtn, { backgroundColor: "#10B981", shadowColor: "#10B981" }]}
                  onPress={handleWithdraw}
                  activeOpacity={0.8}
                >
                  <Text style={styles.submitBtnText}>Request Bank Withdrawal</Text>
                </TouchableOpacity>
              )}
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>
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
  balanceCard: {
    backgroundColor: "#4F46E5",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 24,
    padding: 24,
    shadowColor: "#4F46E5",
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  cardBrand: {
    color: "#E0E7FF",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  cardChip: {
    fontSize: 24,
  },
  balanceTitle: {
    color: "#C7D2FE",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  balanceAmount: {
    color: "#FFFFFF",
    fontSize: 34,
    fontWeight: "900",
    marginTop: 6,
    letterSpacing: 0.5,
  },
  cardFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 24,
  },
  cardNumber: {
    color: "#C7D2FE",
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 1.5,
  },
  cardStatus: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  quickActionsRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 18,
    gap: 12,
  },
  quickActionBtn: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 14,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  depositBtnBg: {
    borderLeftWidth: 4,
    borderLeftColor: "#6366F1",
  },
  withdrawBtnBg: {
    borderLeftWidth: 4,
    borderLeftColor: "#10B981",
  },
  quickActionIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  quickActionIcon: {
    fontSize: 18,
  },
  quickActionTextContainer: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#111827",
  },
  quickActionSubtitle: {
    fontSize: 10,
    color: "#6B7280",
    marginTop: 1,
    fontWeight: "600",
  },
  historySectionHeader: {
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 8,
  },
  historySectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
  },
  historySectionSubtitle: {
    fontSize: 11,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 30,
    maxHeight: "90%",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeaderIndicator: {
    width: 40,
    height: 5,
    backgroundColor: "#E5E7EB",
    borderRadius: 3,
    alignSelf: "center",
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#111827",
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCloseBtnText: {
    color: "#6B7280",
    fontSize: 14,
    fontWeight: "700",
  },
  modalFormScroll: {},
  sectionLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#4B5563",
    marginBottom: 6,
    marginTop: 12,
  },
  requiredStar: {
    color: "#EF4444",
  },
  scannerPicker: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  scannerBtn: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "transparent",
  },
  activeScannerBtn: {
    backgroundColor: "#EEF2FF",
    borderColor: "#6366F1",
  },
  scannerBtnText: {
    color: "#4B5563",
    fontSize: 13,
    fontWeight: "700",
  },
  activeScannerBtnText: {
    color: "#4F46E5",
    fontWeight: "800",
  },
  qrDisplayBlock: {
    backgroundColor: "#F9FAFB",
    borderRadius: 18,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F3F4F6",
    marginBottom: 16,
  },
  qrImage: {
    width: 200,
    height: 200,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  upiDetailsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    gap: 10,
  },
  upiText: {
    fontSize: 14,
    color: "#4F46E5",
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  copyBtn: {
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.1)",
  },
  copyBtnText: {
    color: "#4F46E5",
    fontSize: 11,
    fontWeight: "800",
  },
  qrGuide: {
    fontSize: 10,
    color: "#6B7280",
    marginTop: 8,
    textAlign: "center",
    lineHeight: 14,
  },
  input: {
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: "#111827",
    backgroundColor: "#F9FAFB",
    marginBottom: 12,
  },
  submitBtn: {
    backgroundColor: "#6366F1",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 14,
    shadowColor: "#6366F1",
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 4,
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  modalBalanceBanner: {
    backgroundColor: "#F3F4F6",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalBalanceLabel: {
    color: "#6B7280",
    fontSize: 13,
    fontWeight: "700",
  },
  modalBalanceValue: {
    color: "#10B981",
    fontSize: 18,
    fontWeight: "900",
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 14,
    gap: 10,
  },
  checkboxBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  checkboxBoxChecked: {
    backgroundColor: "#10B981",
    borderColor: "#10B981",
  },
  checkboxCheckmark: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },
  checkboxLabel: {
    fontSize: 14,
    color: "#4B5563",
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
  historyLinkContainer: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 2,
    alignItems: "center",
  },
  historyLinkTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#111827",
    textAlign: "center",
  },
  historyLinkSubtitle: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 16,
  },
  historyLinkBtn: {
    backgroundColor: "#EEF2FF",
    borderWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.1)",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    alignItems: "center",
    width: "100%",
  },
  historyLinkBtnText: {
    color: "#4F46E5",
    fontSize: 14,
    fontWeight: "800",
  },
  minNotice: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
  },
  minNoticeText: {
    fontSize: 13,
    color: "#1D4ED8",
    fontWeight: "700",
  },
  withdrawDisclaimer: {
    backgroundColor: "#FFF7ED",
    borderWidth: 1,
    borderColor: "#FED7AA",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  withdrawDisclaimerTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#C2410C",
    marginBottom: 6,
  },
  withdrawDisclaimerText: {
    fontSize: 12,
    color: "#9A3412",
    lineHeight: 18,
    fontWeight: "500",
  },
});

