import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { useAppStore } from "./store";

export default function Rules() {
  const token = useAppStore((state) => state.token);

  if (!token) {
    return (
      <View style={styles.container}>
        <View style={styles.topBlobLeft} />
        <View style={styles.topBlobRight} />
        <View style={styles.placeholderContainer}>
          <Text style={styles.placeholderText}>Please log in to view lottery rules.</Text>
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
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
      <View style={styles.topBlobLeft} />
      <View style={styles.topBlobRight} />

      {/* 1. Digit Payout structure */}
      <View style={styles.sectionCard}>
        <Text style={styles.cardHeader}>Lottery Prize Structure</Text>
        <Text style={styles.cardInfo}>Payout rates are fixed per purchased ticket:</Text>

        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeaderRow]}>
            <Text style={[styles.cell, styles.col1, styles.headerCell]}>Game Type</Text>
            <Text style={[styles.cell, styles.col2, styles.headerCell]}>Price</Text>
            <Text style={[styles.cell, styles.col3, styles.headerCell, { textAlign: "right" }]}>Winnings</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={[styles.cell, styles.col1]}>Single Digit (A, B, C)</Text>
            <Text style={[styles.cell, styles.col2]}>₹11</Text>
            <Text style={[styles.cell, styles.col3, styles.prizeCell, { textAlign: "right" }]}>₹100</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={[styles.cell, styles.col1]}>Double Digit (AB, BC, AC)</Text>
            <Text style={[styles.cell, styles.col2]}>₹11</Text>
            <Text style={[styles.cell, styles.col3, styles.prizeCell, { textAlign: "right" }]}>₹1,000</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={[styles.cell, styles.col1]}>Three Digits</Text>
            <Text style={[styles.cell, styles.col2]}>₹12 / 28 / 30 / 55 / 60</Text>
            <Text style={[styles.cell, styles.col3, styles.prizeCell, { textAlign: "right" }]}>₹6.25k - 30k</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={[styles.cell, styles.col1]}>Four Digits</Text>
            <Text style={[styles.cell, styles.col2]}>₹50</Text>
            <Text style={[styles.cell, styles.col3, styles.prizeCell, { textAlign: "right" }]}>₹100,000 (1L)</Text>
          </View>
        </View>

        <Text style={[styles.cardHeader, { fontSize: 13, marginTop: 16, borderBottomWidth: 0, paddingBottom: 0 }]}>
          Three Digits Winnings Breakdown
        </Text>
        <Text style={[styles.cardInfo, { marginBottom: 8 }]}>
          Three-digit tickets win prizes even for partial back-end matches:
        </Text>
        
        <View style={{ gap: 8, marginTop: 4 }}>
          <Text style={styles.bulletItem}>
            • <Text style={{ fontWeight: "bold" }}>₹12 Ticket</Text>:
            {"\n"}  - 3 digits match: <Text style={{ color: "#10B981", fontWeight: "bold" }}>₹6,250</Text>
            {"\n"}  - Last 2 digits match: <Text style={{ color: "#10B981", fontWeight: "bold" }}>₹250</Text>
            {"\n"}  - Last 1 digit match: <Text style={{ color: "#10B981", fontWeight: "bold" }}>₹10</Text>
          </Text>
          <Text style={styles.bulletItem}>
            • <Text style={{ fontWeight: "bold" }}>₹28 & ₹30 Tickets</Text>:
            {"\n"}  - 3 digits match: <Text style={{ color: "#10B981", fontWeight: "bold" }}>₹15,000 / ₹17,500</Text>
            {"\n"}  - Last 2 digits match: <Text style={{ color: "#10B981", fontWeight: "bold" }}>₹500</Text>
            {"\n"}  - Last 1 digit match: <Text style={{ color: "#10B981", fontWeight: "bold" }}>₹50</Text>
          </Text>
          <Text style={styles.bulletItem}>
            • <Text style={{ fontWeight: "bold" }}>₹55 & ₹60 Tickets</Text>:
            {"\n"}  - 3 digits match: <Text style={{ color: "#10B981", fontWeight: "bold" }}>₹30,000 / ₹15,000</Text>
            {"\n"}  - Last 2 digits match: <Text style={{ color: "#10B981", fontWeight: "bold" }}>₹1,000</Text>
            {"\n"}  - Last 1 digit match: <Text style={{ color: "#10B981", fontWeight: "bold" }}>₹100</Text>
          </Text>
        </View>
      </View>

      {/* 2. Show Timings & Cutoff Rules */}
      <View style={styles.sectionCard}>
        <Text style={styles.cardHeader}>Show Timings & Guidelines</Text>
        <Text style={styles.bulletItem}>⏰ <Text style={{ fontWeight: "bold", color: "#111827" }}>Dear Lottery</Text> has 3 daily shows: <Text style={{ fontWeight: "bold", color: "#6366F1" }}>1:00 PM, 6:00 PM, and 8:00 PM</Text>.</Text>
        <Text style={styles.bulletItem}>⏰ <Text style={{ fontWeight: "bold", color: "#111827" }}>Kerala Lottery</Text> has 1 daily show: <Text style={{ fontWeight: "bold", color: "#6366F1" }}>3:00 PM</Text>.</Text>
        <Text style={styles.bulletItem}>⏳ <Text style={{ fontWeight: "bold", color: "#EF4444" }}>Booking Cutoff Window</Text>: All ticket sales close exactly <Text style={{ fontWeight: "bold", color: "#EF4444" }}>5 minutes before</Text> draw time. Ensure your checkout is complete before this window.</Text>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    padding: 16,
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
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingBottom: 8,
  },
  cardInfo: {
    fontSize: 12,
    color: "#4B5563",
    marginBottom: 14,
  },
  bulletItem: {
    fontSize: 13,
    color: "#1F2937",
    lineHeight: 20,
    marginBottom: 10,
  },
  table: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    overflow: "hidden",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  tableHeaderRow: {
    backgroundColor: "#F9FAFB",
  },
  cell: {
    padding: 10,
    fontSize: 12,
    color: "#1F2937",
  },
  col1: {
    flex: 2.2,
    fontWeight: "700",
  },
  col2: {
    flex: 3,
  },
  col3: {
    flex: 1.2,
    fontWeight: "800",
  },
  headerCell: {
    fontWeight: "800",
    color: "#111827",
  },
  prizeCell: {
    color: "#10B981",
  },
  promoDesc: {
    fontSize: 12,
    color: "#4B5563",
    lineHeight: 20,
    marginBottom: 14,
  },
  weekStartText: {
    fontSize: 11,
    color: "#9CA3AF",
    textAlign: "right",
    marginBottom: 10,
    fontWeight: "600",
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
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
    backgroundColor: "rgba(239, 68, 68, 0.1)",
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
    marginTop: 18,
    alignItems: "center",
  },
  claimBtn: {
    backgroundColor: "#10B981",
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    shadowColor: "#10B981",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 2,
  },
  claimBtnText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "800",
  },
  claimStatusContainer: {
    width: "100%",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  claimStatusText: {
    fontSize: 14,
    fontWeight: "800",
  },
  claimStatusSub: {
    color: "#4B5563",
    marginTop: 4,
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
