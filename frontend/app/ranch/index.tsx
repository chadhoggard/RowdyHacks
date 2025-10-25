import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Button, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { G, Path } from 'react-native-svg';

// Helper function to create arcs
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
  const memberList = members ? members.split(',') : [];

  // Placeholder investment breakdown
  const investments = [
    { key: 'Liquid', value: ranchBalance * 0.3, color: '#FBBF24' },
    { key: 'CD', value: ranchBalance * 0.4, color: '#10B981' },
    { key: 'ETFs', value: ranchBalance * 0.2, color: '#3B82F6' },
    { key: 'Misc', value: ranchBalance * 0.1, color: '#A78BFA' },
  ];

  let startAngle = 0;

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <ThemedView style={styles.header}>
        <ThemedText type="title" style={styles.headerText}>
          🤠 {name} 🚀
        </ThemedText>
        <ThemedText type="subtitle">Balance: ${ranchBalance.toLocaleString()}</ThemedText>
      </ThemedView>

      {/* Pie Chart */}
      <ThemedView style={styles.section}>
        <ThemedText type="subtitle">Ranch Pool Breakdown</ThemedText>
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
              <Text style={{ color: '#E5E7EB' }}>{inv.key}</Text>
            </View>
          ))}
        </View>
      </ThemedView>

      {/* Members */}
      <ThemedView style={styles.section}>
        <ThemedText type="subtitle">Members ({memberList.length})</ThemedText>
        {memberList.length > 0 ? (
          memberList.map((member, idx) => (
            <View key={idx} style={styles.memberRow}>
              <Text style={styles.memberIcon}>🤠</Text>
              <Text style={styles.memberName}>{member}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.memberName}>No members yet</Text>
        )}
      </ThemedView>

      {/* Actions */}
      <ThemedView style={styles.section}>
        <View style={styles.buttonRow}>
          <Button title="Invest" onPress={() => alert(`Invest in ${name}`)} color="#FBBF24" />
          <Button title="Withdraw" onPress={() => alert(`Withdraw from ${name}`)} color="#10B981" />
          <Button title="Delete Ranch" onPress={() => alert(`Delete ${name}?`)} color="#EF4444" />
        </View>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B1120', padding: 16 },
  header: { marginBottom: 16, alignItems: 'center' },
  headerText: { fontSize: 28, color: '#FBBF24', textAlign: 'center' },
  section: { marginBottom: 24, padding: 16, borderRadius: 12, backgroundColor: '#1B1F3B' },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-around', gap: 8 },
  memberRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 4 },
  memberIcon: { marginRight: 8 },
  memberName: { color: '#E5E7EB', fontSize: 16 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginRight: 16, marginBottom: 8 },
  legendColor: { width: 16, height: 16, borderRadius: 4, marginRight: 6 },
});
