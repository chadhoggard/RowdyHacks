import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    ImageBackground,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

const API_BASE_URL = 'http://localhost:8080';

export default function AccountScreen() {
  const { userId, username, token, logout } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch user details from backend
    const fetchUserDetails = async () => {
      if (!userId || !token) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setEmail(data.email || 'Not available');
        } else {
          console.error('Failed to fetch user details');
          setEmail('Unable to load');
        }
      } catch (error) {
        console.error('Error fetching user details:', error);
        setEmail('Unable to load');
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, [userId, token]);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/login');
          }
        }
      ]
    );
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
        <ThemedText style={styles.titleText}>👤 Account</ThemedText>
      </ThemedView>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFA500" />
          <ThemedText style={styles.loadingText}>Loading account details...</ThemedText>
        </View>
      ) : (
        <>
          {/* Account Info Card */}
          <ThemedView style={styles.infoCard}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>Account Information</ThemedText>
            
            <View style={styles.infoRow}>
              <ThemedText style={styles.label}>Username:</ThemedText>
              <ThemedText style={styles.value}>{username || 'Not available'}</ThemedText>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <ThemedText style={styles.label}>Email:</ThemedText>
              <ThemedText style={styles.value}>{email}</ThemedText>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <ThemedText style={styles.label}>User ID:</ThemedText>
              <ThemedText style={styles.value} numberOfLines={1}>{userId || 'Not available'}</ThemedText>
            </View>
          </ThemedView>

          {/* Settings Card */}
          <ThemedView style={styles.settingsCard}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>Settings</ThemedText>
            
            <TouchableOpacity style={styles.settingButton}>
              <ThemedText style={styles.settingButtonText}>Change Password</ThemedText>
              <ThemedText style={styles.comingSoon}>(Coming Soon)</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingButton}>
              <ThemedText style={styles.settingButtonText}>Edit Profile</ThemedText>
              <ThemedText style={styles.comingSoon}>(Coming Soon)</ThemedText>
            </TouchableOpacity>
          </ThemedView>

          {/* Logout Button */}
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <ThemedText style={styles.logoutButtonText}>🚪 Logout</ThemedText>
          </TouchableOpacity>
        </>
      )}
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#FFA500',
  },
  titleText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(255, 165, 0, 0.75)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    color: '#9CA3AF',
  },
  infoCard: {
    backgroundColor: '#1D1F33',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#FFA500',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  settingsCard: {
    backgroundColor: '#1D1F33',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  sectionTitle: {
    marginBottom: 16,
    color: '#fff',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  value: {
    fontSize: 16,
    color: '#fff',
    flex: 1,
    textAlign: 'right',
    marginLeft: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#374151',
  },
  settingButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  settingButtonText: {
    fontSize: 16,
    color: '#fff',
  },
  comingSoon: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  logoutButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 32,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 5,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
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
