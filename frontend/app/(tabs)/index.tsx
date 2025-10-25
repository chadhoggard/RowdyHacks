import { Image } from 'expo-image';
import { Button, StyleSheet } from 'react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function HomeScreen() {
  // TODO: replace with real backend data
  const sharedPoolBalance = 12500; // placeholder balance
  const handleInvest = () => alert('Invest button pressed');
  const handleWithdraw = () => alert('Withdraw button pressed');

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-logo.png')}
          style={styles.logo}
        />
      }
    >
      {/* Welcome / title */}
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">🚀 PartnerInvest 🤠</ThemedText>
        <ThemedText type="subtitle">Shared Brokerage Pool</ThemedText>
      </ThemedView>

      {/* Shared pool balance */}
      <ThemedView style={styles.sectionContainer}>
        <ThemedText type="subtitle">Shared Pool Balance</ThemedText>
        <ThemedText style={styles.balance}>${sharedPoolBalance.toLocaleString()}</ThemedText>
      </ThemedView>

      {/* Invest / Withdraw actions */}
      <ThemedView style={styles.sectionContainer}>
        <ThemedText type="subtitle">Actions</ThemedText>
        <ThemedView style={styles.buttonRow}>
          <Button title="Invest" onPress={handleInvest} color="#f59e0b" />
          <Button title="Withdraw" onPress={handleWithdraw} color="#f59e0b" />
        </ThemedView>
      </ThemedView>

      {/* Info / guidance */}
      <ThemedView style={styles.sectionContainer}>
        <ThemedText type="subtitle">Tip</ThemedText>
        <ThemedText>
          Track the pool balance and make sure your investments stay within your risk preference.
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
    gap: 8,
    marginBottom: 16,
  },
  balance: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#f59e0b',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  logo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});
