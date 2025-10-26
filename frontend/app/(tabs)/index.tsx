import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useFocusEffect, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  ImageBackground,
  Modal,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

const API_BASE_URL = "http://localhost:8080";

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
  balance: number; // total assets
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

// Initial data - no mock ranches, users start fresh
const mockRanches: Ranch[] = [];

// Special item for the "Add" button
const addButton: Ranch = {
  id: "add",
  name: "Add Ranch",
  balance: 0,
  liquidBalance: 0,
  investedAmount: 0,
  members: [],
};

export default function HomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const [ranches, setRanches] = useState<Ranch[]>([addButton]);
  const [addRanchModalVisible, setAddRanchModalVisible] = useState(false);
  const [newRanchName, setNewRanchName] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingRanches, setFetchingRanches] = useState(true);

  const breakpoint = 768;
  const numColumns = width < breakpoint ? 1 : 2;

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
          console.log("📋 Raw groups data:", data.groups);
          const userRanches: Ranch[] = data.groups.map((group: any) => {
            console.log("🔍 Mapping group:", group);
            console.log("🔑 groupID:", group.groupID);
            const ranch = {
              id: group.groupID,
              name: group.name,
              liquidBalance: group.balance || 0,
              investedAmount: group.investedAmount || 0,
              balance:
                group.totalAssets ||
                group.balance + (group.investedAmount || 0) ||
                0,
              members: group.members || [],
            };
            console.log("🏠 Created ranch object:", ranch);
            return ranch;
          });
          console.log("✅ Loaded ranches:", userRanches);
          console.log(
            "✅ Ranch IDs:",
            userRanches.map((r) => r.id)
          );
          setRanches([addButton, ...userRanches]);
          console.log(
            "✅ State updated with ranches:",
            [addButton, ...userRanches].length,
            "items"
          );
        } else {
          console.log("📭 No ranches found");
          setRanches([addButton]);
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

  // Load ranches on mount
  useEffect(() => {
    fetchRanches();
  }, []);

  // Refetch ranches when screen comes into focus (user navigates back)
  useFocusEffect(
    useCallback(() => {
      fetchRanches();
    }, [])
  );

  const handlePressRanch = (ranch: Ranch) => {
    console.log("🖱️ Ranch clicked:", ranch);
    console.log("🖱️ Ranch ID:", ranch.id);
    console.log("🖱️ Ranch name:", ranch.name);

    if (ranch.id === "add") {
      setAddRanchModalVisible(true);
      return;
    }

    console.log("🚀 Navigating to ranch with params:", {
      id: ranch.id,
      name: ranch.name,
      balance: ranch.balance,
      members: ranch.members.join(","),
    });

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

        // Add the new ranch to the list
        const newRanch: Ranch = {
          id: data.groupID,
          name: data.name,
          balance: data.balance || 0,
          liquidBalance: data.balance || 0,
          investedAmount: data.investedAmount || 0,
          members: data.members || [userId],
        };

        setRanches((prevRanches) => [
          addButton,
          newRanch,
          ...prevRanches.slice(1),
        ]);

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
        {/* --- STYLIZED HEADER --- */}
        <ThemedView style={styles.titleContainer}>
          <ThemedText style={styles.titleText}>🚀 PartnerInvest 🤠</ThemedText>
          <ThemedText style={styles.subtitleText}>
            Yeehaw! Partner Up and Invest Together!
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.sectionContainer}>
          <ThemedText type="subtitle">YOUR RANCHES</ThemedText>
          <FlatList
            key={numColumns}
            data={ranches}
            keyExtractor={(item) => item.id}
            numColumns={numColumns}
            columnWrapperStyle={numColumns > 1 ? styles.row : null}
            contentContainerStyle={{ paddingBottom: 16, paddingTop: 12 }}
            renderItem={({ item }) => {
              // --- Render "Add" button ---
              if (item.id === "add") {
                return (
                  <TouchableOpacity
                    style={[
                      styles.ranchCard,
                      numColumns > 1
                        ? styles.ranchCardGrid
                        : styles.ranchCardList,
                      styles.addRanchCard,
                      // --- CONDITIONAL HEIGHT ---
                      numColumns === 1 && styles.addRanchCardMobile,
                    ]}
                    onPress={() => handlePressRanch(item)}
                    activeOpacity={0.8}
                  >
                    <ThemedText style={styles.addRanchText}>+</ThemedText>
                  </TouchableOpacity>
                );
              }
              // --- Render normal ranch card ---
              return (
                <TouchableOpacity
                  style={[
                    styles.ranchCard,
                    numColumns > 1
                      ? styles.ranchCardGrid
                      : styles.ranchCardList,
                  ]}
                  onPress={() => handlePressRanch(item)}
                  activeOpacity={0.8}
                >
                  <ThemedText type="subtitle">{item.name}</ThemedText>

                  {/* Balance Breakdown */}
                  <View style={styles.balanceContainer}>
                    <ThemedText style={styles.totalBalance}>
                      💰 Total: ${item.balance.toLocaleString()}
                    </ThemedText>
                    <View style={styles.balanceRow}>
                      <ThemedText style={styles.balanceLabel}>
                        💵 Liquid:
                      </ThemedText>
                      <ThemedText style={styles.balanceText}>
                        ${item.liquidBalance.toLocaleString()}
                      </ThemedText>
                    </View>
                    <View style={styles.balanceRow}>
                      <ThemedText style={styles.balanceLabel}>
                        📈 Invested:
                      </ThemedText>
                      <ThemedText style={styles.balanceText}>
                        ${item.investedAmount.toLocaleString()}
                      </ThemedText>
                    </View>
                  </View>

                  <ThemedText style={styles.memberCount}>
                    👥 Members:{" "}
                    {Array.isArray(item.members)
                      ? item.members.length
                      : item.members}
                  </ThemedText>

                  <ThemedText style={styles.monthlyReturn}>
                    Monthly Return:{" "}
                    <ThemedText style={styles.returnText}>
                      {getMockReturn(item.balance)}
                    </ThemedText>
                  </ThemedText>
                </TouchableOpacity>
              );
            }}
          />
        </ThemedView>

        {/* --- STYLIZED TIP SECTION --- */}
        <ThemedView style={[styles.sectionContainer, styles.tipContainer]}>
          <ThemedText type="subtitle">💡 Pro Tip</ThemedText>
          <ThemedText style={styles.tipText}>
            Tap a ranch to view its detailed portfolio, or tap + to start a new
            investment group with your partners.
          </ThemedText>
        </ThemedView>
      </ParallaxScrollView>

      {/* --- Add Ranch Modal --- */}
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
  // Balance Section Styles
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
    width: "100%",
    paddingHorizontal: 4,
  },
  balanceText: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: "auto", // This pushes the amount to the right while keeping it closer
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
  titleContainer: {
    flexDirection: "column",
    alignItems: "center", // Center title block
    gap: 4,
    marginBottom: 24, // Add more space below header
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#FFA500",
  },
  // --- New Title Styles ---
  titleText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    textShadowColor: "rgba(255, 165, 0, 0.75)", // Orange shadow
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  subtitleText: {
    fontSize: 16,
    fontStyle: "italic",
    color: "#9CA3AF", // Lighter, secondary color
  },
  // --- End Title Styles ---
  sectionContainer: {
    gap: 12,
    marginBottom: 16,
  },
  row: {
    justifyContent: "space-between",
    // Removed alignItems: 'flex-start' to make grid items equal height
  },
  ranchCard: {
    alignItems: "center",
    backgroundColor: "#1D1F33",
    borderRadius: 12,
    justifyContent: "center",
    minHeight: 150,
    padding: 16,
    shadowColor: "#FFA500",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 8,
    elevation: 10,
  },
  ranchCardGrid: {
    flex: 1,
    marginHorizontal: 4,
    marginBottom: 12,
  },
  ranchCardList: {
    marginHorizontal: 12,
    marginBottom: 12,
  },
  addRanchCard: {
    backgroundColor: "transparent",
    borderStyle: "dashed",
    borderWidth: 2,
    borderColor: "#FFA500",
    shadowOpacity: 0.3,
  },
  // --- New Style for Mobile "+" Button ---
  addRanchCardMobile: {
    minHeight: "auto",
    height: 100,
  },
  addRanchText: {
    fontSize: 48,
    color: "#FFA500",
    fontWeight: "300",
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
  returnText: {
    color: "#32CD32",
    fontWeight: "bold",
    marginTop: 8,
  },
  // --- New Tip Section Styles ---
  tipContainer: {
    backgroundColor: "#1B1F3B",
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#FBBF24", // Yellow accent
  },
  tipText: {
    color: "#E5E7EB",
    lineHeight: 20,
  },
  // --- End Tip Styles ---
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
