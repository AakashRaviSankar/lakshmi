import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  TextInput,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { useState } from "react";
import { useAppStore, API_BASE } from "./store";
import { router } from "expo-router";
import axios from "axios";

const FAQS = [
  {
    q: "How do I recharge my wallet?",
    a: "Go to Wallet → Deposit tab → enter the amount, scan the QR code, pay via UPI, and enter your UTR number to submit the request. It will be approved within 30 minutes.",
  },
  {
    q: "How long does withdrawal take?",
    a: "Withdrawals are processed within 24 hours on business days. The amount is transferred to your registered bank account or UPI ID.",
  },
  {
    q: "When are lottery results declared?",
    a: "Dear Lottery results are declared at 1 PM, 6 PM, and 8 PM. Kerala Lottery results are declared at 3 PM daily.",
  },
  {
    q: "What is the ticket booking cutoff?",
    a: "Ticket booking closes exactly 5 minutes before the draw time. Make sure your checkout is complete before the cutoff.",
  },
  {
    q: "How do I earn the Sunday bonus?",
    a: "Play at least ₹100 daily across at least 2 different shows from Monday to Saturday. If you qualify all 6 days, you can claim ₹100 on Sunday.",
  },
  {
    q: "How does the referral program work?",
    a: "Share your unique referral code with friends. When they sign up using your code, you earn commission on their winnings automatically.",
  },
  {
    q: "My recharge is not reflecting?",
    a: "If a recharge is pending for more than 2 hours, please contact support with your UTR number and amount. Do not submit the same UTR twice.",
  },
  {
    q: "How do I update my bank details?",
    a: "Go to Wallet → Withdraw tab → your bank/UPI details are saved from your last withdrawal. Update them when making a new withdrawal request.",
  },
];

export default function Support() {
  const token = useAppStore((state) => state.token);
  const user = useAppStore((state) => state.user);
  const supportMobile = useAppStore((state) => state.supportMobile);
  const supportEmail = useAppStore((state) => state.supportEmail);

  const [activeFaqIndex, setActiveFaqIndex] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const handleWhatsApp = () => {
    const url = `https://wa.me/91${supportMobile}?text=Hi%2C%20I%20need%20help%20with%20KL%20Dear%20Lottery%20app.`;
    Linking.openURL(url).catch(() => {
      Alert.alert("Error", "Could not open WhatsApp.");
    });
  };

  const handleEmail = () => {
    const url = `mailto:${supportEmail}?subject=Support%20Request`;
    Linking.openURL(url).catch(() => {
      Alert.alert("Error", "Could not open email client.");
    });
  };

  const handleSendMessage = async () => {
    if (!subject.trim() || !message.trim()) {
      Alert.alert("Missing Info", "Please fill in both subject and message.");
      return;
    }

    if (!token && (!name.trim() || !phone.trim())) {
      Alert.alert("Missing Info", "Please enter your name and mobile number.");
      return;
    }

    setSending(true);

    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      const payload: any = {
        subject: subject.trim(),
        message: message.trim(),
      };

      if (!token) {
        payload.name = name.trim();
        payload.mobile = phone.trim();
      }

      const res = await axios.post(`${API_BASE}/api/support`, payload, { headers });
      const ticketId = res.data.ticketId;

      setStatusMsg(ticketId);
      setName("");
      setPhone("");
      setSubject("");
      setMessage("");
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || "Failed to send message.";
      Alert.alert("Error", errorMsg);
    } finally {
      setSending(false);
    }
  };

  if (statusMsg) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <View style={styles.successCard}>
          <Text style={styles.successIcon}>✅</Text>
          <Text style={styles.successTitle}>Ticket Submitted!</Text>
          <Text style={styles.successSub}>
            Your support request has been received. Our admin team will contact you soon.
          </Text>
          <View style={styles.ticketBox}>
            <Text style={styles.ticketLabel}>Your Ticket ID</Text>
            <Text style={styles.ticketId}>{statusMsg}</Text>
            <Text style={styles.ticketNote}>
              Please save this ID for future reference. You can quote it when following up.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => setStatusMsg(null)}
            activeOpacity={0.8}
          >
            <Text style={styles.backBtnText}>Submit Another Request</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.contactRow}>
          <TouchableOpacity
            style={[styles.contactBtn, styles.whatsappBtn]}
            onPress={handleWhatsApp}
            activeOpacity={0.8}
          >
            <Text style={styles.contactBtnIcon}>💬</Text>
            <View>
              <Text style={styles.contactBtnLabel}>WhatsApp</Text>
              <Text style={styles.contactBtnSub}>Instant chat</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.contactBtn, styles.emailBtn]}
            onPress={handleEmail}
            activeOpacity={0.8}
          >
            <Text style={styles.contactBtnIcon}>✉️</Text>
            <View>
              <Text style={[styles.contactBtnLabel, { color: "#6366F1" }]}>Email</Text>
              <Text style={styles.contactBtnSub}>{supportEmail}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.topBlobLeft} />
      <View style={styles.topBlobRight} />

      <View style={styles.headerCard}>
        <Text style={styles.headerIcon}>💬</Text>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <Text style={styles.headerSub}>
          We're here to help. Browse FAQs or send us a message — no login required.
        </Text>
      </View>

      <View style={styles.contactRow}>
        <TouchableOpacity
          style={[styles.contactBtn, styles.whatsappBtn]}
          onPress={handleWhatsApp}
          activeOpacity={0.8}
        >
          <Text style={styles.contactBtnIcon}>💬</Text>
          <View>
            <Text style={styles.contactBtnLabel}>WhatsApp</Text>
            <Text style={styles.contactBtnSub}>Instant chat</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.contactBtn, styles.emailBtn]}
          onPress={handleEmail}
          activeOpacity={0.8}
        >
          <Text style={styles.contactBtnIcon}>✉️</Text>
          <View>
            <Text style={[styles.contactBtnLabel, { color: "#6366F1" }]}>Email</Text>
            <Text style={styles.contactBtnSub}>{supportEmail}</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.hoursCard}>
        <Text style={styles.hoursIcon}>🕒</Text>
        <View style={styles.hoursText}>
          <Text style={styles.hoursTitle}>Support Hours</Text>
          <Text style={styles.hoursSub}>Monday – Saturday: 9:00 AM – 9:00 PM</Text>
          <Text style={styles.hoursSub}>Sunday: 10:00 AM – 6:00 PM</Text>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
      </View>

      {FAQS.map((item, index) => (
        <TouchableOpacity
          key={index}
          style={styles.faqCard}
          activeOpacity={0.85}
          onPress={() => setActiveFaqIndex(activeFaqIndex === index ? null : index)}
        >
          <View style={styles.faqRow}>
            <Text style={styles.faqQuestion}>{item.q}</Text>
            <Text
              style={[
                styles.faqChevron,
                activeFaqIndex === index && styles.faqChevronOpen,
              ]}
            >
              ›
            </Text>
          </View>
          {activeFaqIndex === index && (
            <Text style={styles.faqAnswer}>{item.a}</Text>
          )}
        </TouchableOpacity>
      ))}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Submit a Support Ticket</Text>
        <Text style={styles.sectionSub}>Admin will contact you — no login needed.</Text>
      </View>

      <View style={styles.formCard}>
        <View style={styles.adminNotice}>
          <Text style={styles.adminNoticeIcon}>💡</Text>
          <Text style={styles.adminNoticeText}>
            Fill in the form below. You'll receive a unique Ticket ID once submitted, and our admin team will get back to you.
          </Text>
        </View>

        {!token ? (
          <>
            <Text style={styles.inputLabel}>
              Name <Text style={{ color: "#EF4444" }}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Your Name"
              placeholderTextColor="#9CA3AF"
            />

            <Text style={styles.inputLabel}>
              Mobile <Text style={{ color: "#EF4444" }}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="Mobile Number"
              placeholderTextColor="#9CA3AF"
              keyboardType="phone-pad"
            />
          </>
        ) : (
          <View style={styles.fromRow}>
            <Text style={styles.fromLabel}>From: </Text>
            <Text style={styles.fromValue}>
              {user?.name || "User"} ({user?.mobileNumber || ""})
            </Text>
          </View>
        )}

        <Text style={styles.inputLabel}>
          Subject <Text style={{ color: "#EF4444" }}>*</Text>
        </Text>
        <TextInput
          style={styles.input}
          value={subject}
          onChangeText={setSubject}
          placeholder="What is this regarding?"
          placeholderTextColor="#9CA3AF"
        />

        <Text style={styles.inputLabel}>
          Message <Text style={{ color: "#EF4444" }}>*</Text>
        </Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={message}
          onChangeText={setMessage}
          placeholder="Describe your issue or query..."
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={4}
          maxLength={500}
        />
        <Text style={styles.charCount}>{message.length}/500</Text>

        <TouchableOpacity
          style={[styles.sendBtn, sending && styles.sendBtnDisabled]}
          onPress={handleSendMessage}
          activeOpacity={0.85}
          disabled={sending}
        >
          {sending ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.sendBtnText}>Submit Ticket</Text>
          )}
        </TouchableOpacity>
      </View>

      <Text style={styles.version}>KL Dear Lottery v1.0.1</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 48,
  },
  topBlobLeft: {
    position: "absolute",
    top: -100,
    left: -100,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: "rgba(99, 102, 241, 0.08)",
  },
  topBlobRight: {
    position: "absolute",
    top: -50,
    right: -100,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(16, 185, 129, 0.06)",
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
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 6,
  },
  headerSub: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
    lineHeight: 18,
  },
  contactRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  contactBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  whatsappBtn: {
    borderColor: "#A7F3D0",
  },
  emailBtn: {
    borderColor: "#C7D2FE",
  },
  contactBtnIcon: {
    fontSize: 24,
  },
  contactBtnLabel: {
    fontSize: 14,
    fontWeight: "800",
    color: "#059669",
  },
  contactBtnSub: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "600",
    marginTop: 2,
  },
  hoursCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    gap: 14,
    marginBottom: 20,
  },
  hoursIcon: {
    fontSize: 28,
  },
  hoursText: {
    flex: 1,
    gap: 2,
  },
  hoursTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111827",
  },
  hoursSub: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
  },
  sectionHeader: {
    marginBottom: 12,
    paddingHorizontal: 4,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
  },
  sectionSub: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
    marginTop: 2,
  },
  faqCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 10,
  },
  faqRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
    lineHeight: 20,
  },
  faqChevron: {
    fontSize: 20,
    fontWeight: "600",
    color: "#9CA3AF",
  },
  faqChevronOpen: {
    transform: [{ rotate: "90deg" }],
  },
  faqAnswer: {
    fontSize: 13,
    color: "#4B5563",
    lineHeight: 20,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    marginHorizontal: 0,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 2,
  },
  adminNotice: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 10,
  },
  adminNoticeIcon: {
    fontSize: 18,
  },
  adminNoticeText: {
    flex: 1,
    fontSize: 11,
    color: "#4B5563",
    lineHeight: 16,
    fontWeight: "600",
  },
  fromRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  fromLabel: {
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: "700",
  },
  fromValue: {
    fontSize: 12,
    color: "#374151",
    fontWeight: "700",
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 14,
    fontSize: 14,
    color: "#111827",
    marginBottom: 14,
  },
  textArea: {
    height: 110,
    marginBottom: 4,
  },
  charCount: {
    fontSize: 11,
    color: "#9CA3AF",
    textAlign: "right",
    marginBottom: 16,
  },
  sendBtn: {
    backgroundColor: "#6366F1",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    shadowColor: "#6366F1",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  sendBtnDisabled: {
    backgroundColor: "#C7D2FE",
  },
  sendBtnText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "800",
  },
  successCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 2,
  },
  successIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#10B981",
    marginBottom: 8,
  },
  successSub: {
    fontSize: 13,
    color: "#4B5563",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  ticketBox: {
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    padding: 16,
    width: "100%",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F3F4F6",
    marginBottom: 8,
  },
  ticketLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  ticketId: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: 1,
    marginBottom: 8,
  },
  ticketNote: {
    fontSize: 11,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 16,
  },
  backBtn: {
    backgroundColor: "#F3F4F6",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    width: "100%",
    marginTop: 12,
  },
  backBtnText: {
    color: "#374151",
    fontSize: 15,
    fontWeight: "800",
  },
  version: {
    textAlign: "center",
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 24,
    marginBottom: 8,
  },
});