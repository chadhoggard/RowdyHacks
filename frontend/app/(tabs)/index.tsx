import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  ImageBackground,
  Modal,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

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

// Initial data
const mockRanches: Ranch[] = [
  { id: 'aab32fee-a207-4628-89b0-26ab98377c23', name: 'Area 51 Ranch', balance: 5000, members: ['Alice', 'Bob', 'Charlie'] },
  { id: '2', name: 'Rodeo Investors', balance: 10000, members: ['Dave', 'Eve', 'Frank', 'Grace', 'Heidi'] },
  { id: '3', name: 'Cosmic Corral', balance: 7500, members: ['Ivan', 'Judy'] },
  { id: '4', name: 'Star Ranch', balance: 4200, members: ['Ken', 'Laura'] },
];

// Special item for the "Add" button
const addButton: Ranch = { id: 'add', name: 'Add Ranch', balance: 0, members: [] };

export default function HomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  
  const [ranches, setRanches] = useState<Ranch[]>([addButton, ...mockRanches]);
  const [addRanchModalVisible, setAddRanchModalVisible] = useState(false);
  const [newRanchName, setNewRanchName] = useState('');
  
  const breakpoint = 768;
  const numColumns = width < breakpoint ? 1 : 2;

  const handlePressRanch = (ranch: Ranch) => {
    if (ranch.id === 'add') {
      setAddRanchModalVisible(true);
      return;
    }
    router.push({
      pathname: '/ranch',
      params: { id: ranch.id, name: ranch.name, balance: ranch.balance, members: ranch.members.join(',') }
    });
  };

  const handleAddNewRanch = () => {
    if (!newRanchName.trim()) {
      Alert.alert('Error', 'Please enter a name for your ranch.');
      return;
    }
    const newRanch: Ranch = {
      id: Math.random().toString(36).substring(7),
      name: newRanchName.trim(),
      balance: 0,
      members: ['You'],
    };
    setRanches(prevRanches => [
      addButton, 
      newRanch, 
      ...prevRanches.slice(1)
    ]);
    setNewRanchName('');
    setAddRanchModalVisible(false);
  };

  return (
    <>
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
        {/* --- STYLIZED HEADER --- */}
        <ThemedView style={styles.titleContainer}>
          <ThemedText style={styles.titleText}>🚀 PartnerInvest 🤠</ThemedText>
          <ThemedText style={styles.subtitleText}>Yeehaw! Partner Up and Invest Together!</ThemedText>
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
              if (item.id === 'add') {
                return (
                  <TouchableOpacity
                    style={[
                      styles.ranchCard,
                      numColumns > 1 ? styles.ranchCardGrid : styles.ranchCardList,
                      styles.addRanchCard,
                      // --- CONDITIONAL HEIGHT ---
                      numColumns === 1 && styles.addRanchCardMobile
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
              );
            }}
          />
        </ThemedView>
        
        {/* --- STYLIZED TIP SECTION --- */}
        <ThemedView style={[styles.sectionContainer, styles.tipContainer]}>
          <ThemedText type="subtitle">💡 Pro Tip</ThemedText>
          <ThemedText style={styles.tipText}>
            Tap a ranch to view its detailed portfolio, or tap "+" to start a new investment group with your partners.
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
              <TouchableOpacity onPress={() => setAddRanchModalVisible(false)} style={styles.modalBtnCancel}>
                <ThemedText style={styles.modalBtnText}>Cancel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleAddNewRanch} style={styles.modalBtnCreate}>
                <ThemedText style={styles.modalBtnText}>Create</ThemedText>
              </TouchableOpacity>
            </View>
          </ThemedView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'column',
    alignItems: 'center', // Center title block
    gap: 4,
    marginBottom: 24, // Add more space below header
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#FFA500',
  },
  // --- New Title Styles ---
  titleText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(255, 165, 0, 0.75)', // Orange shadow
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  subtitleText: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#9CA3AF', // Lighter, secondary color
  },
  // --- End Title Styles ---
  sectionContainer: {
    gap: 12,
    marginBottom: 16,
  },
  row: {
    justifyContent: 'space-between',
    // Removed alignItems: 'flex-start' to make grid items equal height
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
    backgroundColor: 'transparent',
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: '#FFA500',
    shadowOpacity: 0.3,
  },
  // --- New Style for Mobile "+" Button ---
  addRanchCardMobile: {
    minHeight: 'auto',
    height: 100,
  },
  addRanchText: {
    fontSize: 48,
    color: '#FFA500',
    fontWeight: '300',
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
  // --- New Tip Section Styles ---
  tipContainer: {
    backgroundColor: '#1B1F3B',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FBBF24', // Yellow accent
  },
  tipText: {
    color: '#E5E7EB',
    lineHeight: 20,
  },
  // --- End Tip Styles ---
  modalBackground: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#000000aa' 
  },
  modalContent: { 
    width: '90%', 
    maxWidth: 400,
    padding: 20, 
    backgroundColor: '#1B1F3B', 
    borderRadius: 12 
  },
  input: { 
    borderWidth: 1, 
    borderColor: '#374151', 
    borderRadius: 8, 
    padding: 12, 
    marginTop: 16, 
    marginBottom: 16, 
    color: '#fff',
    fontSize: 16,
  },
  modalButtons: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    gap: 12,
  },
  modalBtnCancel: { 
    flex: 1,
    backgroundColor: '#9CA3AF', 
    padding: 12, 
    borderRadius: 8,
    alignItems: 'center',
  },
  modalBtnCreate: { 
    flex: 1,
    backgroundColor: '#3B82F6', 
    padding: 12, 
    borderRadius: 8,
    alignItems: 'center',
  },
  modalBtnText: {
    fontWeight: 'bold',
  }
});