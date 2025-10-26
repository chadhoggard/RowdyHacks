import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useRouter } from 'expo-router';
import React from 'react';
// Import useWindowDimensions for responsiveness, remove Dimensions
import { FlatList, Image, ImageBackground, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';

interface Ranch {
  id: string;
  name: string;
  balance: number;
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
  
  // Get screen width dynamically
  const { width } = useWindowDimensions();
  
  // Define breakpoint for mobile vs. desktop
  const breakpoint = 768;
  const numColumns = width < breakpoint ? 1 : 2;

  // Mock ranch data - using real backend group ID for demo
  const ranches: Ranch[] = [
    { id: 'aab32fee-a207-4628-89b0-26ab98377c23', name: 'Area 51 Ranch', balance: 5000, members: ['Alice', 'Bob', 'Charlie'] },
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
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">🚀 PartnerInvest 🤠</ThemedText>
        <ThemedText type="subtitle">Yeehaw! Partner Up and Invest Together!</ThemedText>
      </ThemedView>

      <ThemedView style={styles.sectionContainer}>
        <ThemedText type="subtitle">YOUR RANCHES</ThemedText>
        <FlatList
          key={numColumns} // Add key to force re-render on column change
          data={ranches}
          keyExtractor={(item) => item.id}
          numColumns={numColumns}
          columnWrapperStyle={numColumns > 1 ? styles.row : null} // Only apply row style in grid
          contentContainerStyle={{ paddingBottom: 16, paddingTop: 12 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.ranchCard,
                numColumns > 1 ? styles.ranchCardGrid : styles.ranchCardList
              ]}
              onPress={() => handlePressRanch(item)}
              activeOpacity={0.8}
            >
              <ThemedText type="subtitle">{item.name}</ThemedText>
              <ThemedText>Balance: ${item.balance.toLocaleString()}</ThemedText>
              <ThemedText>Members: {Array.isArray(item.members) ? item.members.length : item.members}</ThemedText>
              
              <ThemedText>
                Monthly Return:{' '}
                <ThemedText style={styles.returnText}>
                  {getMockReturn(item.balance)}
                </ThemedText>
            </ThemedText>

            </TouchableOpacity>
          )}
        />
      </ThemedView>

      <ThemedView style={styles.sectionContainer}>
        <ThemedText type="subtitle">Tip</ThemedText>
        <ThemedText>
          Tap a ranch to view details and manage investments.
        </ThemedText>
      </ThemedView>
    </ParallaxScrollView>
  );
}

// Removed const { width } = Dimensions.get('window');

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
  },
  ranchCard: {
    alignItems: 'center',
    backgroundColor: '#1D1F33',
    borderRadius: 12,
    justifyContent: 'center',
    minHeight: 150,
    padding: 16,
    
    shadowColor: '#FFA500',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 8,
    elevation: 10,
  },
  // Style for grid (desktop)
  ranchCardGrid: {
    flex: 1,
    marginHorizontal: 4,
    marginBottom: 12,
  },
  // Style for list (mobile)
  ranchCardList: {
    marginHorizontal: 12,
    marginBottom: 12,
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
  returnText: {
    color: '#32CD32',
    fontWeight: 'bold',
    marginTop: 8,
  },
});