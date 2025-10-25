import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useRouter } from 'expo-router';
import React from 'react';
import { FlatList, Image, ImageBackground, StyleSheet, TouchableOpacity } from 'react-native';

interface Ranch {
  id: string;
  name: string;
  balance: number;
  members: string[];
}

export default function HomeScreen() {
  const router = useRouter();

  // Mock ranch data
  const ranches: Ranch[] = [
    { id: '1', name: 'Area 51 Ranch', balance: 5000, members: ['Alice', 'Bob', 'Charlie'] },
    { id: '2', name: 'Rodeo Investors', balance: 10000, members: ['Dave', 'Eve', 'Frank', 'Grace', 'Heidi'] },
    { id: '3', name: 'Cosmic Corral', balance: 7500, members: ['Ivan', 'Judy'] },
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

      {/* Ranches list */}
      <ThemedView style={styles.sectionContainer}>
        <ThemedText type="subtitle">YOUR RANCHES</ThemedText>
        <FlatList
          data={ranches}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.ranchCard} onPress={() => handlePressRanch(item)}>
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
      </ThemedView>
    </ParallaxScrollView>
  );
}

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
  ranchCard: {
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#1D1F33',
    borderRadius: 12,
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
