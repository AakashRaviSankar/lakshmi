import { Stack } from "expo-router";
import { useEffect } from "react";
import { useAppStore } from "./store";
import { Modal, View, Text, StyleSheet, TouchableOpacity, Linking } from "react-native";
import Constants from "expo-constants";

export default function RootLayout() {
  const initialize = useAppStore((state) => state.initialize);
  const appVersion = useAppStore((state) => state.appVersion);
  const appDownloadUrl = useAppStore((state) => state.appDownloadUrl);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const currentVersion = Constants.expoConfig?.version || "1.0.0";
  const needsUpdate = appVersion && appVersion !== currentVersion;

  const handleUpdate = () => {
    if (appDownloadUrl) {
      Linking.openURL(appDownloadUrl).catch((err) => {
        console.error("Failed to open update URL:", err);
      });
    }
  };

  return (
    <>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: "#0B0F19",
          },
          headerShadowVisible: false,
          headerTintColor: "#FFFFFF",
          headerTitleStyle: {
            fontWeight: "800",
            fontSize: 18,
          },
        }}
      >
        <Stack.Screen name="index" options={{ title: "KL Dear Lottery" }} />
        <Stack.Screen name="lotteries" options={{ title: "Play Lottery" }} />
        <Stack.Screen name="login" options={{ title: "Welcome", presentation: "modal" }} />
        <Stack.Screen name="cart" options={{ title: "Shopping Cart" }} />
        <Stack.Screen name="wallet" options={{ title: "Wallet & Funds" }} />
        <Stack.Screen name="transactions" options={{ title: "Transaction Feed" }} />
        <Stack.Screen name="refer" options={{ title: "Refer & Earn" }} />
        <Stack.Screen name="results" options={{ title: "Daily Results" }} />
        <Stack.Screen name="reports" options={{ title: "My Reports" }} />
        <Stack.Screen name="rules" options={{ title: "Game Rules" }} />
        <Stack.Screen name="notifications" options={{ title: "Notifications" }} />
        <Stack.Screen name="support" options={{ title: "Help & Support" }} />
        <Stack.Screen name="bonus" options={{ title: "Sunday Bonus Tracker" }} />
      </Stack>

      <Modal
        visible={!!needsUpdate}
        transparent={true}
        animationType="slide"
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeIcon}>🚀</Text>
            </View>
            <Text style={styles.title}>Update Required</Text>
            <Text style={styles.description}>
              A new version of KL Dear Lottery (v{appVersion}) is available. Please update the app to continue playing.
            </Text>
            <View style={styles.versionDetails}>
              <Text style={styles.versionText}>Current Version: {currentVersion}</Text>
              <Text style={styles.versionText}>New Version: {appVersion}</Text>
            </View>
            <TouchableOpacity
              style={styles.updateBtn}
              onPress={handleUpdate}
              activeOpacity={0.8}
            >
              <Text style={styles.updateBtnText}>Download Update Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(11, 15, 25, 0.95)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    backgroundColor: "#1F2937",
    borderRadius: 32,
    padding: 30,
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#374151",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
  },
  badgeContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(99, 102, 241, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.3)",
  },
  badgeIcon: {
    fontSize: 32,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 10,
    textAlign: "center",
  },
  description: {
    color: "#9CA3AF",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
    fontWeight: "500",
  },
  versionDetails: {
    backgroundColor: "#111827",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 24,
    width: "100%",
    borderWidth: 1,
    borderColor: "#1F2937",
    alignItems: "center",
    gap: 4,
  },
  versionText: {
    color: "#9CA3AF",
    fontSize: 12,
    fontWeight: "600",
  },
  updateBtn: {
    backgroundColor: "#6366F1",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    width: "100%",
    alignItems: "center",
    shadowColor: "#6366F1",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  updateBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
});

