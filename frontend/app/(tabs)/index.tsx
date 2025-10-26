import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useRouter } from 'expo-router';
import React from 'react';
import { Dimensions, FlatList, Image, ImageBackground, StyleSheet, TouchableOpacity } from 'react-native';

interface Ranch {
  id: string;
  name: string;
  balance: number;
  members: string[];
}

// Helper function to generate mock return data
const getMockReturn = (id: string, balance: number) => {
  const percent = (3 + parseInt(id)) / 100; // e.g., 4%, 5%, 6%, 7%
  const amount = balance * percent;
  const percentString = (percent * 100).toFixed(1);
  return `+$${amount.toLocaleString()} (${percentString}%)`;
};

export default function HomeScreen() {
  const router = useRouter();

  const ranches: Ranch[] = [
    { id: '1', name: 'Area 51 Ranch', balance: 5000, members: ['Alice', 'Bob', 'Charlie'] },
    { id: '2', name: 'Rodeo Investors', balance: 10000, members: ['Dave', 'Eve', 'Frank', 'Grace', 'Heidi'] },
    { id: '3', name: 'Cosmic Corral', balance: 7500, members: ['Ivan', 'Judy'] },
    { id: '4', name: 'Star Ranch', balance: 4200, members: ['Ken', 'Laura'] },
  ];

  const handlePressRanch = (ranch: Ranch) => {
    router.push({
      pathname: '/ranch',
      params: { id: ranch.id, name: ranch.name, balance: ranch.balance, members: ranch.members.join(',') }
    });
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#0B0C1F', dark: '#0B0C1F' }}
      headerImage={
        <ImageBackground
          source={require('@/assets/images/space-background.jpg')}
          style={styles.headerImageBackground}
        >
          <Image
            source={require('@/assets/images/partial-logo.png')}
            style={styles.logo}
          />
        </ImageBackground>
      }
    >
      {/* Welcome title */}
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">🚀 PartnerInvest 🤠</ThemedText>
        <ThemedText type="subtitle">Yeehaw! Partner Up and Invest Together!</ThemedText>
      </ThemedView>

      {/* Ranches grid */}
      <ThemedView style={styles.sectionContainer}>
        <ThemedText type="subtitle">YOUR RANCHES</ThemedText>
        <FlatList
          data={ranches}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={{ paddingBottom: 16, paddingTop: 12 }} // Keep padding for glow
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.ranchCard}
              onPress={() => handlePressRanch(item)}
              activeOpacity={0.8}
            >
              <ThemedText type="subtitle">{item.name}</ThemedText>
              <ThemedText>Balance: ${item.balance.toLocaleString()}</ThemedText>
              <ThemedText>Members: {Array.isArray(item.members) ? item.members.length : item.members}</ThemedText>
              
              {/* --- CHANGE: Monthly Return added here --- */}
              <ThemedText style={styles.returnText}>
                📈 {getMockReturn(item.id, item.balance)}
              </ThemedText>

            </TouchableOpacity>
          )}
        />
      </ThemedView>

      {/* --- SECTION REMOVED ---
        The separate "MONTHLY RETURN" list was here. I've removed it.
      --- END OF REMOVAL --- */}

      {/* Tip / guidance */}
      <ThemedView style={styles.sectionContainer}>
        <ThemedText type="subtitle">Tip</ThemedText>
        <ThemedText>
          Tap a ranch to view details and manage investments.
        </ThemedText>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 4,
    marginBottom: 16,
  },
  sectionContainer: {
    gap: 12,
    marginBottom: 16,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  ranchCard: {
    flex: 1,
    marginHorizontal: 4,
    padding: 16,
    backgroundColor: '#1D1F33',
    borderRadius: 12,
    alignItems: 'center',
    
    minHeight: 150, // Increased minHeight slightly to fit new text
    justifyContent: 'center',

    // --- Static Glow (iOS ONLY) ---
    shadowColor: '#FFA500',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 8,
    
    // --- Shadow Fallback (Android ONLY) ---
    elevation: 10,
  },
  logo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  headerImageBackground: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // --- UPDATED/KEPT STYLE for inline return text ---
  returnText: {
    color: '#32CD32', // Bright green
    fontWeight: 'bold',
    marginTop: 8, // Adds space between members and return
  },
  // --- REMOVED STYLES: returnCard, returnLabel, returnIcon are no longer needed ---
});