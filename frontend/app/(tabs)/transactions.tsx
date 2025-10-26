/**
 * Transactions Screen
 * View, vote on, and manage transactions
 */

import {
    createTransaction,
    executeTransaction,
    getTransactionHistory,
    voteOnTransaction,
    type Transaction,
} from '@/api/transactions';
import { CreateTransactionModal } from '@/components/create-transaction-modal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TransactionCard } from '@/components/transaction-card';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

// TODO: Replace with real auth context
const MOCK_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjMmYzMzJmNy03YjYzLTQwNDQtOTI3OC01ZjQ2ODI5YzRjNzUiLCJlbWFpbCI6ImRlbW8xNzYxNDQwMzQwQHRlc3QuY29tIiwiaWF0IjoxNzYxNDU4MzQwfQ.Tb0jfUvO-sYB4oQjolDppUhdTUNfnH6n6J6ypKO4vqw';
const MOCK_USER_ID = 'c2f332f7-7b63-4044-9278-5f46829c4c75';
const MOCK_GROUP_ID = 'aab32fee-a207-4628-89b0-26ab98377c23';
const MOCK_GROUP_BALANCE = 5000;

type FilterType = 'all' | 'pending' | 'approved' | 'rejected' | 'executed';

export default function TransactionsScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Load transactions
  const loadTransactions = useCallback(async () => {
    try {
      setIsLoading(true);
      // Get all transactions across user's groups
      const data = await getTransactionHistory(MOCK_TOKEN);
      setTransactions(data);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to load transactions');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Filter transactions
  useEffect(() => {
    if (filter === 'all') {
      setFilteredTransactions(transactions);
    } else {
      setFilteredTransactions(transactions.filter((t) => t.status === filter));
    }
  }, [transactions, filter]);

  // Initial load
  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadTransactions();
  };

  const handleCreateTransaction = async (description: string, amount: number) => {
    await createTransaction(
      {
        groupId: MOCK_GROUP_ID,
        amount,
        description,
      },
      MOCK_TOKEN
    );
    loadTransactions();
  };

  const handleVote = async (transactionId: string, vote: 'approve' | 'reject') => {
    await voteOnTransaction(transactionId, vote, MOCK_TOKEN);
    loadTransactions();
  };

  const handleExecute = async (transactionId: string) => {
    await executeTransaction(transactionId, MOCK_TOKEN);
    loadTransactions();
  };

  const renderFilterButton = (label: string, value: FilterType) => (
    <TouchableOpacity
      style={[styles.filterButton, filter === value && styles.filterButtonActive]}
      onPress={() => setFilter(value)}
    >
      <ThemedText
        style={[styles.filterText, filter === value && styles.filterTextActive]}
      >
        {label}
      </ThemedText>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <ThemedView style={styles.emptyContainer}>
      <ThemedText style={styles.emptyEmoji}>💸</ThemedText>
      <ThemedText type="subtitle" style={styles.emptyTitle}>
        {filter === 'all' ? 'No Transactions Yet' : `No ${filter} Transactions`}
      </ThemedText>
      <ThemedText style={styles.emptyText}>
        {filter === 'all'
          ? 'Propose a transaction to get started!'
          : `Switch filters or create a new transaction`}
      </ThemedText>
    </ThemedView>
  );

  if (isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <ThemedText style={styles.loadingText}>Loading transactions...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <ThemedText type="title">💸 Transactions</ThemedText>
          <ThemedText style={styles.subtitle}>
            {filteredTransactions.length} {filter === 'all' ? 'total' : filter}
          </ThemedText>
        </View>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setIsModalVisible(true)}
        >
          <ThemedText style={styles.createButtonText}>+ Propose</ThemedText>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.filterContainer}>
        {renderFilterButton('All', 'all')}
        {renderFilterButton('Pending', 'pending')}
        {renderFilterButton('Approved', 'approved')}
        {renderFilterButton('Executed', 'executed')}
        {renderFilterButton('Rejected', 'rejected')}
      </View>

      {/* Transaction List */}
      <FlatList
        data={filteredTransactions}
        keyExtractor={(item) => item.transactionID}
        renderItem={({ item }) => (
          <TransactionCard
            transaction={item}
            currentUserId={MOCK_USER_ID}
            onVote={handleVote}
            onExecute={handleExecute}
            onRefresh={loadTransactions}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      />

      {/* Create Transaction Modal */}
      <CreateTransactionModal
        visible={isModalVisible}
        groupId={MOCK_GROUP_ID}
        groupBalance={MOCK_GROUP_BALANCE}
        onClose={() => setIsModalVisible(false)}
        onSubmit={handleCreateTransaction}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    opacity: 0.7,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 60,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 4,
  },
  createButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#1D1F33',
  },
  filterButtonActive: {
    backgroundColor: '#8B5CF6',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.7,
  },
  filterTextActive: {
    opacity: 1,
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyEmoji: {
    fontSize: 64,
  },
  emptyTitle: {
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.6,
  },
});
