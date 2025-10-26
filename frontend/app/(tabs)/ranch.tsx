import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import React, { useState, useEffect, useCallback } from 'react';
import { Alert, FlatList, Modal, StyleSheet, TextInput, TouchableOpacity, View, ActivityIndicator, ScrollView, RefreshControl } from 'react-native';
import Svg, { G, Path } from 'react-native-svg';

const API_BASE_URL = 'http://localhost:8080';

// Demo credentials (replace with actual auth later)
const DEMO_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjMmYzMzJmNy03YjYzLTQwNDQtOTI3OC01ZjQ2ODI5YzRjNzUiLCJlbWFpbCI6ImRlbW8xNzYxNDQwMzQwQHRlc3QuY29tIiwiaWF0IjoxNzYxNDU4MzQwfQ.Tb0jfUvO-sYB4oQjolDppUhdTUNfnH6n6J6ypKO4vqw';
const DEMO_USER_ID = 'c2f332f7-7b63-4044-9278-5f46829c4c75';

interface Transaction {
  transactionID: string;
  groupID: string;
  userID: string;
  amount: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected' | 'executed';
  votes: Record<string, 'approve' | 'reject'>;
  createdAt: string;
}

interface UserBalance {
  personalBalance: number; // This would come from user profile
}

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

  const [ranchBalance, setRanchBalance] = useState(Number(balance));
  const [memberList, setMemberList] = useState(members ? members.split(',') : ['No members yet']);
  const [memberCount, setMemberCount] = useState(members ? members.split(',').length : 1);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [proposals, setProposals] = useState<Transaction[]>([]);
  const [personalBalance, setPersonalBalance] = useState(10000); // Mock personal balance - replace with real data

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
  const [investModalVisible, setInvestModalVisible] = useState(false);
  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);
  const [transactionAmount, setTransactionAmount] = useState('');

  // Fetch updated group balance and members
  const fetchGroupData = async () => {
    if (!id) return;
    try {
      const response = await fetch(`${API_BASE_URL}/groups/${id}`, {
        headers: {
          'Authorization': `Bearer ${DEMO_TOKEN}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setRanchBalance(data.group?.balance || data.balance);
        if (data.group?.memberDetails) {
          setMemberCount(data.group.memberDetails.length);
        }
      }
    } catch (error) {
      console.error('Failed to fetch group balance:', error);
    }
  };

  // Fetch pending proposals for this group
  const fetchProposals = async () => {
    if (!id) {
      console.log('⚠️ No group ID, skipping fetch');
      return;
    }
    console.log('🔍 Fetching proposals for group:', id);
    try {
      const url = `${API_BASE_URL}/transactions?groupId=${id}`;
      console.log('🌐 Fetching from:', url);
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${DEMO_TOKEN}`,
        },
      });
      console.log('📡 Proposals response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('📦 Raw response data:', data);
        console.log('📦 All transactions:', data.transactions);
        console.log('📦 Transaction count:', data.transactions?.length || 0);
        
        // Show ALL transactions (not just pending/approved)
        const allTransactions = data.transactions || [];
        console.log('✅ Setting proposals to:', allTransactions);
        setProposals(allTransactions);
      } else {
        const errorText = await response.text();
        console.log('❌ Error response:', errorText);
      }
    } catch (error) {
      console.error('❌ Failed to fetch proposals:', error);
    }
  };

  // Refresh all data
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchGroupData(), fetchProposals()]);
    setRefreshing(false);
  };

  // Load data on mount and when screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchGroupData();
      fetchProposals();
    }, [id])
  );

  // Log proposals whenever they change
  useEffect(() => {
    console.log('🎯 Proposals updated:', proposals.length, 'proposals', proposals);
  }, [proposals]);

  const handleInvest = () => setInvestModalVisible(true);
  
  const handleInvestSubmit = async () => {
    console.log('🔵 handleInvestSubmit called');
    console.log('Transaction amount:', transactionAmount);
    const amount = parseFloat(transactionAmount);
    console.log('Parsed amount:', amount);
    
    if (!amount || amount <= 0) {
      console.log('❌ Invalid amount');
      Alert.alert('Invalid Amount', 'Please enter a valid positive amount');
      return;
    }

    // Check if user has enough personal balance
    if (amount > personalBalance) {
      console.log('❌ Insufficient funds');
      Alert.alert(
        'Insufficient Funds',
        `You don't have enough to invest $${amount.toLocaleString()}. Your available balance is $${personalBalance.toLocaleString()}.`
      );
      return;
    }

    console.log('✅ Validation passed, making API call');
    setLoading(true);
    try {
      // Create a transaction proposal (not direct deposit)
      const response = await fetch(`${API_BASE_URL}/transactions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${DEMO_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          groupId: id,
          amount: amount,
          description: `Investment proposal: $${amount.toLocaleString()}`
        }),
      });

      console.log('📡 Response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Success:', data);
        
        // Close modal and clear input FIRST
        setTransactionAmount('');
        setInvestModalVisible(false);
        
        // Then fetch proposals
        console.log('🔄 Fetching proposals after creation...');
        await fetchProposals();
        
        // Then show success message
        Alert.alert(
          '🎉 Proposal Created!', 
          `Your investment proposal of $${amount.toLocaleString()} has been submitted. Other members need to approve it before funds are added.`
        );
      } else {
        const error = await response.json();
        console.log('❌ Error response:', error);
        Alert.alert('Error', error.detail || 'Failed to create proposal');
      }
    } catch (error) {
      console.log('❌ Network error:', error);
      Alert.alert('Error', 'Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = () => setWithdrawModalVisible(true);
  
  const handleWithdrawSubmit = async () => {
    const amount = parseFloat(transactionAmount);
    if (!amount || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid positive amount');
      return;
    }

    if (amount > ranchBalance) {
      Alert.alert('Insufficient Balance', `Cannot withdraw $${amount.toLocaleString()}. Ranch balance is only $${ranchBalance.toLocaleString()}`);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/groups/${id}/deposit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${DEMO_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount: -amount }), // Negative amount for withdrawal
      });

      if (response.ok) {
        Alert.alert('Success! 💰', `Withdrew $${amount.toLocaleString()} from ${name}`);
        setTransactionAmount('');
        setWithdrawModalVisible(false);
        await fetchGroupData();
      } else {
        const error = await response.json();
        Alert.alert('Error', error.detail || 'Failed to withdraw');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error occurred');
    } finally {
      setLoading(false);
    }
  };

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

  // Vote on a proposal
  const handleVote = async (transactionId: string, vote: 'approve' | 'reject') => {
    try {
      const response = await fetch(`${API_BASE_URL}/transactions/${transactionId}/vote`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${DEMO_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ vote }),
      });

      if (response.ok) {
        Alert.alert('Vote Recorded', `You voted to ${vote} this proposal`);
        await fetchProposals(); // Refresh proposals
        await fetchGroupData(); // Refresh balance in case it auto-executed
      } else {
        const error = await response.json();
        Alert.alert('Error', error.detail || 'Failed to vote');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error occurred');
    }
  };

  // Execute an approved proposal
  const handleExecute = async (transactionId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/transactions/${transactionId}/execute`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${DEMO_TOKEN}`,
        },
      });

      if (response.ok) {
        Alert.alert('Success! 🎉', 'Transaction executed successfully!');
        await fetchProposals();
        await fetchGroupData();
      } else {
        const error = await response.json();
        Alert.alert('Error', error.detail || 'Failed to execute');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error occurred');
    }
  };

  return (
    <>
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FBBF24" />
      }
    >
      <ThemedView style={styles.contentContainer}>
        {/* Header */}
        <ThemedView style={styles.header}>
          <ThemedText type="title" style={styles.headerText}>
            🤠 {name} 🚀
          </ThemedText>
          <ThemedText type="subtitle">Balance: ${ranchBalance.toLocaleString()}</ThemedText>
          <ThemedText style={styles.personalBalance}>
            Your Balance: ${personalBalance.toLocaleString()}
          </ThemedText>
        </ThemedView>

        {/* Pending Proposals Section */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            📋 Proposals ({proposals.length})
          </ThemedText>
          {proposals.length === 0 ? (
            <ThemedText style={styles.emptyText}>
              No proposals yet. Click "Invest" to create one!
            </ThemedText>
          ) : (
            proposals.map((proposal) => {
              const voteCount = Object.keys(proposal.votes || {}).length;
              const approveCount = Object.values(proposal.votes || {}).filter(v => v === 'approve').length;
              const rejectCount = Object.values(proposal.votes || {}).filter(v => v === 'reject').length;
              const votesNeeded = Math.ceil(memberCount / 2);
              const votesRemaining = Math.max(0, votesNeeded - approveCount);
              const userVote = proposal.votes?.[DEMO_USER_ID];

              // Status colors and emojis
              const statusConfig = {
                pending: { emoji: '⏳', color: '#FBBF24', text: 'Pending' },
                approved: { emoji: '✓', color: '#10B981', text: 'Approved' },
                rejected: { emoji: '✗', color: '#EF4444', text: 'Rejected' },
                executed: { emoji: '✅', color: '#8B5CF6', text: 'Executed' },
              };
              const status = statusConfig[proposal.status] || statusConfig.pending;

              return (
                <ThemedView key={proposal.transactionID} style={styles.proposalCard}>
                  <View style={styles.proposalHeader}>
                    <ThemedText style={styles.proposalAmount}>
                      ${parseFloat(proposal.amount).toLocaleString()}
                    </ThemedText>
                    <View style={[styles.statusBadge, { backgroundColor: status.color }]}>
                      <ThemedText style={styles.statusText}>
                        {status.emoji} {status.text}
                      </ThemedText>
                    </View>
                  </View>
                  <ThemedText style={styles.proposalDescription}>{proposal.description}</ThemedText>
                  
                  <View style={styles.voteInfo}>
                    <ThemedText style={styles.voteText}>
                      👍 {approveCount} | 👎 {rejectCount} | 
                      {proposal.status === 'pending' 
                        ? ` ${votesRemaining} more vote${votesRemaining !== 1 ? 's' : ''} needed`
                        : proposal.status === 'approved'
                        ? ' Ready to execute!'
                        : proposal.status === 'executed'
                        ? ' Funds added to ranch!'
                        : ' Not approved'
                      }
                    </ThemedText>
                  </View>

                  {/* Only show voting buttons for pending proposals where user hasn't voted */}
                  {userVote ? (
                    <ThemedText style={styles.votedText}>
                      You voted: {userVote === 'approve' ? '👍 Approve' : '👎 Reject'}
                    </ThemedText>
                  ) : proposal.status === 'pending' ? (
                    <View style={styles.voteButtons}>
                      <TouchableOpacity
                        style={[styles.voteButton, styles.approveButton]}
                        onPress={() => handleVote(proposal.transactionID, 'approve')}
                      >
                        <ThemedText style={styles.voteButtonText}>👍 Approve</ThemedText>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.voteButton, styles.rejectButton]}
                        onPress={() => handleVote(proposal.transactionID, 'reject')}
                      >
                        <ThemedText style={styles.voteButtonText}>👎 Reject</ThemedText>
                      </TouchableOpacity>
                    </View>
                  ) : null}

                  {/* Show execute button only for approved proposals */}
                  {proposal.status === 'approved' && (
                    <TouchableOpacity
                      style={styles.executeButton}
                      onPress={() => handleExecute(proposal.transactionID)}
                    >
                      <ThemedText style={styles.executeButtonText}>⚡ Execute Transaction</ThemedText>
                    </TouchableOpacity>
                  )}
                  
                  {/* Show timestamp */}
                  <ThemedText style={styles.timestampText}>
                    Created: {new Date(proposal.createdAt).toLocaleString()}
                  </ThemedText>
                </ThemedView>
              );
            })
          )}
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
      </ThemedView>
    </ScrollView>

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

    {/* Invest Modal */}
    <Modal
      transparent
      animationType="slide"
      visible={investModalVisible}
      onRequestClose={() => setInvestModalVisible(false)}
    >
      <ThemedView style={styles.modalBackground}>
        <ThemedView style={styles.modalContent}>
          <ThemedText type="subtitle">💰 Propose Investment</ThemedText>
          <ThemedText style={styles.modalSubtext}>
            Create a proposal that other members need to approve
          </ThemedText>
          <ThemedText style={styles.modalSubtext}>
            Your Balance: ${personalBalance.toLocaleString()}
          </ThemedText>
          <ThemedText style={styles.modalSubtext}>
            Ranch Balance: ${ranchBalance.toLocaleString()}
          </ThemedText>
          <TextInput
            style={styles.input}
            placeholder="Amount to invest"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
            value={transactionAmount}
            onChangeText={setTransactionAmount}
          />
          <View style={styles.modalButtons}>
            <TouchableOpacity 
              onPress={() => {
                setInvestModalVisible(false);
                setTransactionAmount('');
              }} 
              style={styles.modalBtnCancel}
              disabled={loading}
            >
              <ThemedText>Cancel</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={handleInvestSubmit} 
              style={[styles.modalBtnSend, loading && styles.btnDisabled]}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText>Propose</ThemedText>
              )}
            </TouchableOpacity>
          </View>
        </ThemedView>
      </ThemedView>
    </Modal>

    {/* Withdraw Modal */}
    <Modal
      transparent
      animationType="slide"
      visible={withdrawModalVisible}
      onRequestClose={() => setWithdrawModalVisible(false)}
    >
      <ThemedView style={styles.modalBackground}>
        <ThemedView style={styles.modalContent}>
          <ThemedText type="subtitle">💸 Withdraw from {name}</ThemedText>
          <ThemedText style={styles.modalSubtext}>
            Available Balance: ${ranchBalance.toLocaleString()}
          </ThemedText>
          <TextInput
            style={styles.input}
            placeholder="Amount"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
            value={transactionAmount}
            onChangeText={setTransactionAmount}
          />
          <View style={styles.modalButtons}>
            <TouchableOpacity 
              onPress={() => {
                setWithdrawModalVisible(false);
                setTransactionAmount('');
              }} 
              style={styles.modalBtnCancel}
              disabled={loading}
            >
              <ThemedText>Cancel</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={handleWithdrawSubmit} 
              style={[styles.modalBtnSend, { backgroundColor: '#10B981' }, loading && styles.btnDisabled]}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText>Withdraw</ThemedText>
              )}
            </TouchableOpacity>
          </View>
        </ThemedView>
      </ThemedView>
    </Modal>
    </>
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
  modalSubtext: { color: '#9CA3AF', marginTop: 8, fontSize: 14 },
  btnDisabled: { opacity: 0.6 },
  contentContainer: { paddingBottom: 20 },
  personalBalance: { color: '#9CA3AF', fontSize: 14, marginTop: 4 },
  sectionTitle: { marginBottom: 12, fontSize: 18 },
  proposalCard: { 
    backgroundColor: '#0F1729', 
    padding: 16, 
    borderRadius: 12, 
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#374151'
  },
  proposalHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 8 
  },
  proposalAmount: { fontSize: 24, fontWeight: 'bold', color: '#FBBF24' },
  statusBadge: { 
    paddingHorizontal: 12, 
    paddingVertical: 4, 
    borderRadius: 12 
  },
  statusText: { fontSize: 12, fontWeight: 'bold', color: '#000' },
  proposalDescription: { color: '#E5E7EB', marginBottom: 12 },
  voteInfo: { marginBottom: 12 },
  voteText: { color: '#9CA3AF', fontSize: 14 },
  votedText: { 
    color: '#10B981', 
    fontSize: 14, 
    fontWeight: 'bold', 
    textAlign: 'center',
    padding: 8 
  },
  voteButtons: { 
    flexDirection: 'row', 
    gap: 8, 
    marginTop: 8 
  },
  voteButton: { 
    flex: 1, 
    padding: 12, 
    borderRadius: 8, 
    alignItems: 'center' 
  },
  approveButton: { backgroundColor: '#10B981' },
  rejectButton: { backgroundColor: '#EF4444' },
  voteButtonText: { color: '#fff', fontWeight: 'bold' },
  executeButton: { 
    backgroundColor: '#8B5CF6', 
    padding: 12, 
    borderRadius: 8, 
    alignItems: 'center',
    marginTop: 8
  },
  executeButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  emptyText: { color: '#9CA3AF', fontStyle: 'italic', textAlign: 'center', padding: 16 },
  timestampText: { color: '#6B7280', fontSize: 12, marginTop: 8, fontStyle: 'italic' },
});
