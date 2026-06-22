import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, ScrollView, Platform, Image } from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { useAppStore, API_BASE } from "./store";
import axios from "axios";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";

WebBrowser.maybeCompleteAuthSession();

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form Fields
  const [name, setName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");

  const setToken = useAppStore((state) => state.setToken);
  const setUser = useAppStore((state) => state.setUser);
  const deviceId = useAppStore((state) => state.deviceId);

  const handleSubmit = async () => {
    if (!mobileNumber || !password) {
      Alert.alert("Error", "Please fill in all required fields.");
      return;
    }
    if (isRegister && !name) {
      Alert.alert("Error", "Please enter your name.");
      return;
    }

    setLoading(true);
    try {
      if (isRegister) {
        // Register flow
        const response = await axios.post(`${API_BASE}/api/auth/mobile-register`, {
          name,
          mobileNumber,
          password,
          referralCode,
          deviceId
        });
        const { token, user } = response.data;
        await setToken(token);
        setUser(user);
        Alert.alert("Success", "Account created successfully!");
        router.replace("/");
      } else {
        // Login flow
        const response = await axios.post(`${API_BASE}/api/auth/mobile-login`, {
          mobileNumber,
          password,
          deviceId
        });
        const { token, user } = response.data;
        await setToken(token);
        setUser(user);
        router.replace("/");
      }
    } catch (error: any) {
      const msg = error.response?.data?.error || "Authentication failed. Please check your credentials.";
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  };

  const supportMobile = useAppStore((state) => state.supportMobile);

  const handleSupportContact = () => {
    const url = `https://wa.me/91${supportMobile}?text=Hi%2C%20I%20forgot%20my%20password%20and%20need%20help%20with%20my%20KL%20Dear%20Lottery%20account.`;
    Linking.openURL(url).catch(() => {
      Alert.alert("Error", "WhatsApp is not installed on your device.");
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.headerContainer}>
          <Image
            source={require("../assets/lakshmi_logo.png")}
            style={styles.logo}
          />
          <Text style={styles.title}>KL Dear Lottery</Text>
          <Text style={styles.subtitle}>
            {isRegister ? "Create a new account to start playing" : "Log in to browse active shows and buy tickets"}
          </Text>
        </View>

        <View style={styles.form}>
          {isRegister && (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                placeholderTextColor="#9CA3AF"
                value={name}
                onChangeText={setName}
                maxLength={40}
              />
            </View>
          )}

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Mobile Number *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter 10-digit mobile number"
              placeholderTextColor="#9CA3AF"
              keyboardType="phone-pad"
              value={mobileNumber}
              onChangeText={setMobileNumber}
              maxLength={15}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              maxLength={30}
            />
          </View>

          {isRegister && (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Referral Code (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter referral code"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="characters"
                value={referralCode}
                onChangeText={setReferralCode}
                maxLength={10}
              />
            </View>
          )}

          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.submitBtnText}>{isRegister ? "Register" : "Login"}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.toggleContainer}
            onPress={() => setIsRegister(!isRegister)}
          >
            <Text style={styles.toggleText}>
              {isRegister ? "Already have an account? Login" : "Don't have an account? Register"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.supportBtn} onPress={handleSupportContact}>
            <Text style={styles.supportBtnText}>Forgot Password? Contact Support</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  logo: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 16,
    backgroundColor: "#FFF",
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    color: "#111827",
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  form: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 2,
  },
  inputContainer: {
    marginBottom: 18,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4B5563",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: "#111827",
    backgroundColor: "#F9FAFB",
  },
  submitBtn: {
    backgroundColor: "#6366F1",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#6366F1",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 2,
  },
  submitBtnText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "800",
  },
  toggleContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  toggleText: {
    fontSize: 14,
    color: "#6366F1",
    fontWeight: "600",
  },
  supportBtn: {
    marginTop: 20,
    alignItems: "center",
  },
  supportBtnText: {
    fontSize: 13,
    color: "#4B5563",
    textDecorationLine: "underline",
    fontWeight: "600",
  },
});