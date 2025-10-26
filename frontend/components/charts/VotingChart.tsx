import React from "react";
import { Dimensions, View } from "react-native";
import { PieChart } from "react-native-chart-kit";
import { Transaction } from "../../api/types";

interface VotingChartProps {
  transactions: Transaction[];
}

type PieChartData = {
  name: string;
  count: number;
  color: string;
  legendFontColor: string;
};

export const VotingChart: React.FC<VotingChartProps> = ({ transactions }) => {
  // Process voting data
  const processVotingData = () => {
    const votingStats = transactions.reduce((acc, transaction) => {
      const { status } = transaction;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Convert to chart data format
    return [
      {
        name: "Approved",
        count: votingStats["approved"] || 0,
        color: "#2ecc71", // Green
        legendFontColor: "#7F7F7F",
      },
      {
        name: "Rejected",
        count: votingStats["rejected"] || 0,
        color: "#e74c3c", // Red
        legendFontColor: "#7F7F7F",
      },
      {
        name: "Pending",
        count: votingStats["pending"] || 0,
        color: "#f1c40f", // Yellow
        legendFontColor: "#7F7F7F",
      },
    ];
  };

  const chartConfig = {
    backgroundGradientFrom: "#fff",
    backgroundGradientTo: "#fff",
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  };

  return (
    <View style={{ marginVertical: 8, padding: 16 }}>
      <PieChart
        data={processVotingData()}
        width={Dimensions.get("window").width - 32}
        height={220}
        chartConfig={chartConfig}
        accessor="count"
        backgroundColor="transparent"
        paddingLeft="15"
        absolute
      />
    </View>
  );
};
