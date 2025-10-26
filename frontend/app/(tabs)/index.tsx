import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useFocusEffect, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

const API_BASE_URL = Platform.select({
  ios: "http://localhost:8080",
  android: "http://10.0.2.2:8080",
  web: "http://localhost:8080",
}) as string;

// Helper function to get data (works on web and native)
const getData = async (key: string) => {
  if (Platform.OS === "web") {
    return localStorage.getItem(key);
  } else {
    return await SecureStore.getItemAsync(key);
  }
};

interface Ranch {
  id: string;
  name: string;
  balance: number;
  liquidBalance: number;
  investedAmount: number;
  members: string[];
}

const getMockReturn = (balance: number) => {
  const percent = (Math.random() * 3 + 1) / 100;
  const amount = Math.round(balance * percent * 100) / 100;
  const percentString = (percent * 100).toFixed(1);
  return `+$${amount.toLocaleString()} (${percentString}%)`;
};

export default function HomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const [ranches, setRanches] = useState<Ranch[]>([]);
  const [addRanchModalVisible, setAddRanchModalVisible] = useState(false);
  const [newRanchName, setNewRanchName] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingRanches, setFetchingRanches] = useState(true);

  // Responsive columns
  const breakpoint768 = 768;
  const breakpoint1200 = 1200;
  const numColumns =
    width >= breakpoint1200 ? 3 : width >= breakpoint768 ? 2 : 1;

  // Fetch user's ranches from backend
  const fetchRanches = async () => {
    try {
      const token = await getData("authToken");

      if (!token) {
        console.log("⚠️ Not logged in, skipping ranch fetch");
        setFetchingRanches(false);
        return;
      }

      console.log("🔍 Fetching ranches from /users/me");
      const response = await fetch(`${API_BASE_URL}/users/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("📡 Response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("📦 User data:", data);

        if (data.groups && data.groups.length > 0) {
          const userRanches: Ranch[] = data.groups.map((group: any) => ({
            id: group.groupID,
            name: group.name,
            liquidBalance: group.balance || 0,
            investedAmount: group.investedAmount || 0,
            balance:
              group.totalAssets ||
              group.balance + (group.investedAmount || 0) ||
              0,
            members: group.members || [],
          }));
          console.log("✅ Loaded ranches:", userRanches);
          setRanches(userRanches);
        } else {
          console.log("📭 No ranches found");
          setRanches([]);
        }
      } else {
        console.error("❌ Failed to fetch ranches:", response.status);
        const errorText = await response.text();
        console.error("❌ Error details:", errorText);
      }
    } catch (error) {
      console.error("❌ Error fetching ranches:", error);
    } finally {
      setFetchingRanches(false);
    }
  };

  useEffect(() => {
    fetchRanches();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchRanches();
    }, [])
  );

  const handlePressRanch = (ranch: Ranch) => {
    console.log("🖱️ Ranch clicked:", ranch);
    router.push({
      pathname: "/(tabs)/ranch",
      params: {
        id: ranch.id,
        name: ranch.name,
        balance: ranch.balance,
        members: ranch.members.join(","),
      },
    });
  };

  const handleAddNewRanch = async () => {
    if (!newRanchName.trim()) {
      Alert.alert("Error", "Please enter a name for your ranch.");
      return;
    }

    setLoading(true);
    try {
      const token = await getData("authToken");
      const userId = await getData("userId");

      if (!token || !userId) {
        Alert.alert("Error", "You must be logged in to create a ranch");
        return;
      }

      console.log("Creating ranch:", newRanchName);
      const response = await fetch(`${API_BASE_URL}/groups`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newRanchName.trim(),
          createdBy: userId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Ranch created:", data);

        const newRanch: Ranch = {
          id: data.groupID,
          name: data.name,
          balance: data.balance || 0,
          liquidBalance: data.balance || 0,
          investedAmount: data.investedAmount || 0,
          members: data.members || [userId],
        };

        setRanches((prev) => [newRanch, ...prev]);
        setNewRanchName("");
        setAddRanchModalVisible(false);
        Alert.alert("Success!", `Ranch "${data.name}" created!`);
      } else {
        const error = await response.text();
        console.error("❌ Failed to create ranch:", error);
        Alert.alert("Error", "Failed to create ranch. Please try again.");
      }
    } catch (error) {
      console.error("❌ Error creating ranch:", error);
      Alert.alert("Error", "Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals
  const totalValue = ranches.reduce((sum, r) => sum + r.balance, 0);
  const totalLiquid = ranches.reduce((sum, r) => sum + r.liquidBalance, 0);
  const totalInvested = ranches.reduce((sum, r) => sum + r.investedAmount, 0);

  return (
    <>
      <ParallaxScrollView
        headerBackgroundColor={{ light: "#0B0C1F", dark: "#0B0C1F" }}
        headerImage={
          <ImageBackground
            source={require("@/assets/images/space-background.jpg")}
            style={styles.headerImageBackground}
          >
            <Image
              source={require("@/assets/images/partial-logo.png")}
              style={styles.logo}
            />
          </ImageBackground>
        }
      >
        {/* STYLIZED HEADER */}
        <ThemedView style={styles.titleContainer}>
          <ThemedText style={styles.titleText}>🚀 PartnerInvest 🤠</ThemedText>
          <ThemedText style={styles.subtitleText}>
            Yeehaw! Partner Up and Invest Together!
          </ThemedText>
        </ThemedView>

        {/* PORTFOLIO SUMMARY */}
        {ranches.length > 0 && (
          <ThemedView style={styles.summaryCard}>
            <ThemedText type="subtitle" style={styles.summaryTitle}>
              📊 Portfolio Summary
            </ThemedText>
            <View style={styles.summaryGrid}>
              <View style={styles.summaryItem}>
                <ThemedText style={styles.summaryLabel}>
                  Total Ranches
                </ThemedText>
                <ThemedText style={styles.summaryValue}>
                  {ranches.length}
                </ThemedText>
              </View>
              <View style={styles.summaryItem}>
                <ThemedText style={styles.summaryLabel}>Total Value</ThemedText>
                <ThemedText style={styles.summaryValue}>
                  ${totalValue.toLocaleString()}
                </ThemedText>
              </View>
              <View style={styles.summaryItem}>
                <ThemedText style={styles.summaryLabel}>Liquid</ThemedText>
                <ThemedText style={styles.summaryValue}>
                  ${totalLiquid.toLocaleString()}
                </ThemedText>
              </View>
              <View style={styles.summaryItem}>
                <ThemedText style={styles.summaryLabel}>Invested</ThemedText>
                <ThemedText style={styles.summaryValue}>
                  ${totalInvested.toLocaleString()}
                </ThemedText>
              </View>
            </View>
          </ThemedView>
        )}

        {/* YOUR RANCHES */}
        <ThemedView style={styles.sectionContainer}>
          <ThemedText type="subtitle">YOUR RANCHES</ThemedText>

          {/* Ranches Grid with Add Button */}
          <View style={styles.ranchesWrapper}>
            {/* Add Button - Fixed Size */}
            <TouchableOpacity
              style={[
                styles.addRanchCardSmall,
                numColumns === 1 && styles.addRanchCardMobile,
              ]}
              onPress={() => setAddRanchModalVisible(true)}
              activeOpacity={0.8}
            >
              <ThemedText style={styles.addRanchText}>+</ThemedText>
              <ThemedText style={styles.addRanchSubtext}>New Ranch</ThemedText>
            </TouchableOpacity>

            {/* Ranch Cards */}
            {ranches.map((ranch) => (
              <TouchableOpacity
                key={ranch.id}
                style={[
                  styles.ranchCard,
                  numColumns === 3 && styles.ranchCardThreeCol,
                  numColumns === 2 && styles.ranchCardTwoCol,
                  numColumns === 1 && styles.ranchCardOneCol,
                ]}
                onPress={() => handlePressRanch(ranch)}
                activeOpacity={0.8}
              >
                <ThemedText type="subtitle" style={styles.ranchName}>
                  {ranch.name}
                </ThemedText>

                {/* Balance Breakdown */}
                <View style={styles.balanceContainer}>
                  <ThemedText style={styles.totalBalance}>
                    💰 Total: ${ranch.balance.toLocaleString()}
                  </ThemedText>
                  <View style={styles.balanceRow}>
                    <ThemedText style={styles.balanceLabel}>
                      💵 Liquid:
                    </ThemedText>
                    <ThemedText style={styles.balanceText}>
                      ${ranch.liquidBalance.toLocaleString()}
                    </ThemedText>
                  </View>
                  <View style={styles.balanceRow}>
                    <ThemedText style={styles.balanceLabel}>
                      📈 Invested:
                    </ThemedText>
                    <ThemedText style={styles.balanceText}>
                      ${ranch.investedAmount.toLocaleString()}
                    </ThemedText>
                  </View>
                </View>

                <ThemedText style={styles.memberCount}>
                  👥 Members:{" "}
                  {Array.isArray(ranch.members)
                    ? ranch.members.length
                    : ranch.members}
                </ThemedText>

                <ThemedText style={styles.monthlyReturn}>
                  Monthly Return:{" "}
                  <ThemedText style={styles.returnText}>
                    {getMockReturn(ranch.balance)}
                  </ThemedText>
                </ThemedText>

                {/* Quick Actions */}
                <View style={styles.quickActions}>
                  <TouchableOpacity
                    style={styles.quickActionBtn}
                    onPress={(e) => {
                      e.stopPropagation();
                      Alert.alert("Coming Soon", "Add Funds feature");
                    }}
                  >
                    <ThemedText style={styles.quickActionText}>
                      💸 Add Funds
                    </ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.quickActionBtn}
                    onPress={(e) => {
                      e.stopPropagation();
                      Alert.alert("Coming Soon", "Invite Member feature");
                    }}
                  >
                    <ThemedText style={styles.quickActionText}>
                      👥 Invite
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ThemedView>

        {/* TIP SECTION */}
        <ThemedView style={[styles.sectionContainer, styles.tipContainer]}>
          <ThemedText type="subtitle">💡 Pro Tip</ThemedText>
          <ThemedText style={styles.tipText}>
            Tap a ranch to view its detailed portfolio, or tap + to start a new
            investment group with your partners.
          </ThemedText>
        </ThemedView>
      </ParallaxScrollView>

      {/* Add Ranch Modal */}
      <Modal
        transparent
        animationType="slide"
        visible={addRanchModalVisible}
        onRequestClose={() => setAddRanchModalVisible(false)}
      >
        <View style={styles.modalBackground}>
          <ThemedView style={styles.modalContent}>
            <ThemedText type="subtitle">Create a New Ranch</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="Ranch Name (e.g., 'Ram Ranch')"
              placeholderTextColor="#9CA3AF"
              value={newRanchName}
              onChangeText={setNewRanchName}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => setAddRanchModalVisible(false)}
                style={styles.modalBtnCancel}
                disabled={loading}
              >
                <ThemedText style={styles.modalBtnText}>Cancel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAddNewRanch}
                style={styles.modalBtnCreate}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <ThemedText style={styles.modalBtnText}>Create</ThemedText>
                )}
              </TouchableOpacity>
            </View>
          </ThemedView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // Summary Card
  summaryCard: {
    backgroundColor: "#1B1F3B",
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#FFA500",
  },
  summaryTitle: {
    marginBottom: 12,
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  summaryItem: {
    flex: 1,
    minWidth: 120,
    backgroundColor: "#0B0C1F",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 12,
    color: "#9CA3AF",
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFA500",
  },

  // Ranches Grid
  ranchesWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 12,
  },

  // Add Button - Small Fixed Size
  addRanchCardSmall: {
    width: 160,
    height: 160,
    backgroundColor: "transparent",
    borderStyle: "dashed",
    borderWidth: 2,
    borderColor: "#FFA500",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#FFA500",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  addRanchCardMobile: {
    width: "100%",
    height: 120,
  },
  addRanchText: {
    fontSize: 48,
    color: "#FFA500",
    fontWeight: "300",
  },
  addRanchSubtext: {
    fontSize: 14,
    color: "#FFA500",
    marginTop: 8,
  },

  // Ranch Cards - Responsive
  ranchCard: {
    backgroundColor: "#1D1F33",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#FFA500",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 8,
    elevation: 10,
    minHeight: 220,
  },
  ranchCardThreeCol: {
    flex: 1,
    minWidth: 280,
    maxWidth: "32%",
  },
  ranchCardTwoCol: {
    flex: 1,
    minWidth: 300,
    maxWidth: "48%",
  },
  ranchCardOneCol: {
    width: "100%",
  },

  ranchName: {
    marginBottom: 8,
  },

  // Balance Section
  balanceContainer: {
    width: "100%",
    marginVertical: 8,
    gap: 4,
  },
  totalBalance: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFA500",
    marginBottom: 4,
  },
  balanceRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 4,
  },
  balanceText: {
    fontSize: 14,
    fontWeight: "600",
  },
  balanceLabel: {
    fontSize: 14,
    color: "#9CA3AF",
  },

  memberCount: {
    fontSize: 14,
    marginTop: 8,
  },
  monthlyReturn: {
    fontSize: 14,
    marginTop: 4,
  },
  returnText: {
    color: "#32CD32",
    fontWeight: "bold",
  },

  // Quick Actions
  quickActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
    width: "100%",
  },
  quickActionBtn: {
    flex: 1,
    backgroundColor: "#374151",
    padding: 8,
    borderRadius: 6,
    alignItems: "center",
  },
  quickActionText: {
    fontSize: 11,
    color: "#fff",
    fontWeight: "600",
  },

  // Title
  titleContainer: {
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#FFA500",
  },
  titleText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    textShadowColor: "rgba(255, 165, 0, 0.75)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  subtitleText: {
    fontSize: 16,
    fontStyle: "italic",
    color: "#9CA3AF",
  },

  sectionContainer: {
    gap: 12,
    marginBottom: 16,
  },

  logo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: "absolute",
  },
  headerImageBackground: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
    justifyContent: "center",
    alignItems: "center",
  },

  // Tip Section
  tipContainer: {
    backgroundColor: "#1B1F3B",
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#FBBF24",
  },
  tipText: {
    color: "#E5E7EB",
    lineHeight: 20,
  },

  // Modal
  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000000aa",
  },
  modalContent: {
    width: "90%",
    maxWidth: 400,
    padding: 20,
    backgroundColor: "#1B1F3B",
    borderRadius: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#374151",
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    marginBottom: 16,
    color: "#fff",
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  modalBtnCancel: {
    flex: 1,
    backgroundColor: "#9CA3AF",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  modalBtnCreate: {
    flex: 1,
    backgroundColor: "#3B82F6",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  modalBtnText: {
    fontWeight: "bold",
  },
});