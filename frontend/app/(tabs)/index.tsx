import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useRouter } from 'expo-router';
import React from 'react';
// Dimensions is imported, as in your example
import { FlatList, Image, ImageBackground, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';

interface Ranch {
  id: string;
  name: string;
  balance: number;
  members: string[];
}

export default function HomeScreen() {
  const router = useRouter();

  // Mock ranch data (with your new 4th ranch)
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

      {/* Ranches grid (as per your new code) */}
      <ThemedView style={styles.sectionContainer}>
        <ThemedText type="subtitle">YOUR RANCHES</ThemedText>
        <FlatList
          data={ranches}
          keyExtractor={(item) => item.id}
          numColumns={2} // Creates the 2-column layout
          columnWrapperStyle={styles.row} // Styles the row container
          contentContainerStyle={{ paddingBottom: 16 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.ranchCard} // Static styles with glow
              onPress={() => handlePressRanch(item)}
              activeOpacity={0.8} // Responsiveness from TouchableOpacity
            >
              <ThemedText type="subtitle">{item.name}</ThemedText>
              <ThemedText>Balance: ${item.balance.toLocaleString()}</ThemedText>
              <ThemedText>Members: {Array.isArray(item.members) ? item.members.length : item.members}</ThemedText>
            </TouchableOpacity>
          )}
        />
      </ThemedView>

      {/* Tip / guidance */}
      <ThemedView style={styles.sectionContainer}>
        <ThemedText type="subtitle">Tip</ThemedText>
        <ThemedText>
          Tap a ranch to view details and manage investments.
        </ThemedText> 
        {/* ^^^ TYPO FIX: Was </TheDText> before */}
      </ThemedView>
    </ParallaxScrollView>
  );
}

// Kept Dimensions import as in your example
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
  // Style for the row wrapper in the 2-column grid
  row: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  ranchCard: {
    flex: 1, // Makes each card take up equal space in the row
    marginHorizontal: 4, // Adds spacing between the cards
    padding: 16,
    backgroundColor: '#1D1F33',
    borderRadius: 12,
    alignItems: 'center', // Centers text
    
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
});