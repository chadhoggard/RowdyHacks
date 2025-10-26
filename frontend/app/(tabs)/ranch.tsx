import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Alert, FlatList, Modal, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import Svg, { G, Path } from 'react-native-svg';

// Helper function for pie chart arcs
const createArcPath = (cx: number, cy: number, r: number, startAngle: number, endAngle: number) => {
  const startX = cx + r * Math.cos(startAngle);
  const startY = cy + r * Math.sin(startAngle);
  const endX = cx + r * Math.cos(endAngle);
  const endY = cy + r * Math.sin(endAngle);
  const largeArcFlag = endAngle - startAngle <= Math.PI ? '0' : '1';
  return `M ${cx} ${cy} L ${startX} ${startY} A ${r} ${r} 0 ${largeArcFlag} 1 ${endX} ${endY} Z`;
};

export default function RanchScreen() {
  const { id, name, balance, members } = useLocalSearchParams<{
    id: string;
    name: string;
    balance: string;
    members: string;
  }>();

  const ranchBalance = Number(balance);
  const [memberList, setMemberList] = useState<string[]>([]);

  // Update member list whenever the 'members' param changes
  React.useEffect(() => {
    setMemberList(members ? members.split(',') : ['No members yet']);
  }, [members]);

  const investments = [
    { key: 'Liquid', value: ranchBalance * 0.3, color: '#FBBF24' },
    { key: 'CD', value: ranchBalance * 0.4, color: '#10B981' },
    { key: 'ETFs', value: ranchBalance * 0.2, color: '#3B82F6' },
    { key: 'Misc', value: ranchBalance * 0.1, color: '#A78BFA' },
  ];

  let startAngle = 0;

  // Modals
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [inviteUsername, setInviteUsername] = useState('');
  const [manageMembersModalVisible, setManageMembersModalVisible] = useState(false);

  const handleInvest = () => Alert.alert(`Invest in ${name}`);
  const handleWithdraw = () => Alert.alert(`Withdraw from ${name}`);
  const handleDelete = () => Alert.alert('Delete Ranch', `Are you sure you want to delete ${name}?`);
  const handleInvite = () => {
    Alert.alert('Invite Sent', `You invited ${inviteUsername} to ${name}`);
    setInviteUsername('');
    setInviteModalVisible(false);
  };

  const handleKickMember = (member: string) => {
    Alert.alert('Kick Member', `Kicked ${member} from the ranch`);
    setMemberList(memberList.filter(m => m !== member));
  };

  const handlePromoteMember = (member: string) => {
    Alert.alert('Promote Member', `${member} is now an admin!`);
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <ThemedView style={styles.header}>
        <ThemedText type="title" style={styles.headerText}>
          🤠 {name} 🚀
        </ThemedText>
        <ThemedText type="subtitle">Balance: ${ranchBalance.toLocaleString()}</ThemedText>
      </ThemedView>

      {/* Pie Chart */}
      <ThemedView style={styles.section}>
        <ThemedText type="subtitle">Ranch Balance Breakdown</ThemedText>
        <Svg width={250} height={250} viewBox="0 0 250 250" style={{ alignSelf: 'center' }}>
          <G rotation="-90" origin="125,125">
            {investments.map((inv) => {
              const angle = (inv.value / ranchBalance) * 2 * Math.PI;
              const path = createArcPath(125, 125, 100, startAngle, startAngle + angle);
              startAngle += angle;
              return <Path key={inv.key} d={path} fill={inv.color} />;
            })}
          </G>
        </Svg>
        <View style={styles.legend}>
          {investments.map((inv) => (
            <View key={inv.key} style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: inv.color }]} />
              <ThemedText>{inv.key}</ThemedText>
            </View>
          ))}
        </View>
      </ThemedView>

      {/* Members */}
      <ThemedView style={styles.section}>
        <ThemedText type="subtitle">Members ({memberList.length})</ThemedText>
        <FlatList
          data={memberList}
          keyExtractor={(item, idx) => idx.toString()}
          renderItem={({ item }) => <ThemedText>👨‍🚀 {item}</ThemedText>}
        />
      </ThemedView>

      {/* Actions */}
      <ThemedView style={styles.section}>
        <View style={styles.buttonRow}>
          {[
            { label: 'Invest', color: '#FBBF24', onPress: handleInvest },
            { label: 'Withdraw', color: '#10B981', onPress: handleWithdraw },
            { label: 'Invite', color: '#3B82F6', onPress: () => setInviteModalVisible(true) },
            { label: 'Manage Members', color: '#8B5CF6', onPress: () => setManageMembersModalVisible(true) },
            { label: 'Delete Ranch', color: '#EF4444', onPress: handleDelete },
          ].map((btn) => (
            <TouchableOpacity
              key={btn.label}
              style={[styles.actionButton, { backgroundColor: btn.color }]}
              onPress={btn.onPress}
              activeOpacity={0.7}
            >
              <ThemedText style={styles.buttonText}>{btn.label}</ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      </ThemedView>

      {/* Invite Modal */}
      <Modal
        transparent
        animationType="slide"
        visible={inviteModalVisible}
        onRequestClose={() => setInviteModalVisible(false)}
      >
        <ThemedView style={styles.modalBackground}>
          <ThemedView style={styles.modalContent}>
            <ThemedText type="subtitle">Invite Cowboy to Ranch</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="Username"
              placeholderTextColor="#9CA3AF"
              value={inviteUsername}
              onChangeText={setInviteUsername}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setInviteModalVisible(false)} style={styles.modalBtnCancel}>
                <ThemedText>Cancel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleInvite} style={styles.modalBtnSend}>
                <ThemedText>Send Invite</ThemedText>
              </TouchableOpacity>
            </View>
          </ThemedView>
        </ThemedView>
      </Modal>

      {/* Manage Members Modal */}
      <Modal
        transparent
        animationType="slide"
        visible={manageMembersModalVisible}
        onRequestClose={() => setManageMembersModalVisible(false)}
      >
        <ThemedView style={styles.modalBackground}>
          <ThemedView style={styles.modalContent}>
            <ThemedText type="subtitle">Manage Members</ThemedText>
            <FlatList
              data={memberList}
              keyExtractor={(item, idx) => idx.toString()}
              renderItem={({ item }) => (
                <View style={styles.memberActionRow}>
                  <ThemedText>👨‍🚀 {item}</ThemedText>
                  <View style={styles.memberButtons}>
                    <TouchableOpacity onPress={() => handleKickMember(item)} style={styles.kickBtn}>
                      <ThemedText>Kick</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handlePromoteMember(item)} style={styles.promoteBtn}>
                      <ThemedText>Promote</ThemedText>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
            <TouchableOpacity onPress={() => setManageMembersModalVisible(false)} style={styles.modalCloseBtn}>
              <ThemedText>Close</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B1120', padding: 16 },
  header: { marginBottom: 16, alignItems: 'center' },
  headerText: { fontSize: 28, color: '#FBBF24', textAlign: 'center' },
  section: { marginBottom: 24, padding: 16, borderRadius: 12, backgroundColor: '#1B1F3B' },
  memberItem: { marginVertical: 4, color: '#E5E7EB' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginRight: 16, marginBottom: 8 },
  legendColor: { width: 16, height: 16, borderRadius: 4, marginRight: 6 },
  modalBackground: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000000aa' },
  modalContent: { width: 300, padding: 20, backgroundColor: '#1B1F3B', borderRadius: 12 },
  input: { borderWidth: 1, borderColor: '#374151', borderRadius: 8, padding: 8, marginTop: 12, marginBottom: 12, color: '#fff' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  modalBtnCancel: { backgroundColor: '#EF4444', padding: 8, borderRadius: 8 },
  modalBtnSend: { backgroundColor: '#3B82F6', padding: 8, borderRadius: 8 },
  modalCloseBtn: { marginTop: 12, backgroundColor: '#9CA3AF', padding: 10, borderRadius: 8, alignItems: 'center' },
  buttonRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 },
  actionButton: { flex: 1, paddingVertical: 14, marginVertical: 6, borderRadius: 12, alignItems: 'center', justifyContent: 'center', minWidth: '45%' },
  buttonText: { color: '#0B1120', fontWeight: 'bold', fontSize: 16 },
  memberActionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 6 },
  memberButtons: { flexDirection: 'row', gap: 6 },
  kickBtn: { backgroundColor: '#EF4444', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  promoteBtn: { backgroundColor: '#3B82F6', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
});
