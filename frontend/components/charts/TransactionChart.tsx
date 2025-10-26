import React from "react";
import { Dimensions, View } from "react-native";
import { LineChart, AbstractChart } from "react-native-chart-kit";
import { Transaction } from "../../api/types";

interface TransactionChartProps {
  transactions: Transaction[];
  timeFrame?: "1W" | "1M" | "3M" | "1Y" | "ALL";
}

type ChartData = {
  labels: string[];
  datasets: {
    data: number[];
    color?: (opacity: number) => string;
    strokeWidth?: number;
  }[];
};

export const TransactionChart: React.FC<TransactionChartProps> = ({
  transactions,
  timeFrame = "1M",
}) => {
  // Process transactions for chart data
  const processTransactions = () => {
    const sorted = [...transactions].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    // Get dates for x-axis
    const dates = sorted.map((t) => new Date(t.createdAt));
    const amounts = sorted.map((t) => t.amount);

    return {
      labels: dates.map((d) =>
        d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
      ),
      datasets: [
        {
          data: amounts,
          color: (opacity = 1) => `rgba(65, 131, 215, ${opacity})`, // Blue color
          strokeWidth: 2,
        },
      ],
    };
  };

  const chartConfig = {
    backgroundColor: "#fff",
    backgroundGradientFrom: "#fff",
    backgroundGradientTo: "#fff",
    decimalPlaces: 2,
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
  };

  const chartData = processTransactions();

  return (
    <View style={{ marginVertical: 8, padding: 16 }}>
      <LineChart
        data={chartData}
        width={Dimensions.get("window").width - 32}
        height={220}
        chartConfig={chartConfig}
        bezier
        style={{
          marginVertical: 8,
          borderRadius: 16,
        }}
      />
    </View>
  );
};
