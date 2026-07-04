import { useState } from "react";
import { View, Text, Pressable, Alert, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, typography, spacing, borderRadius } from "../theme";

export default function HistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [history] = useState<any[]>([]);

  const clearHistory = () => {
    Alert.alert("Clear History", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear", style: "destructive", onPress: () => {} },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.title}>History</Text>
        <Pressable onPress={clearHistory} hitSlop={8}>
          <Text style={styles.clearText}>Clear</Text>
        </Pressable>
      </View>

      {history.length === 0 && (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons name="time-outline" size={36} color={colors.accent.primary} />
          </View>
          <Text style={styles.emptyTitle}>No History</Text>
          <Text style={styles.emptyDesc}>
            Videos you watch will appear here.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.primary },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
  title: {
    color: colors.text.primary,
    fontSize: typography.sizes["2xl"],
    fontWeight: typography.weights.bold,
  },
  clearText: {
    color: colors.status.error,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing["4xl"],
    gap: spacing.md,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: borderRadius["2xl"],
    backgroundColor: colors.bg.glass,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.bg.glassBorder,
  },
  emptyTitle: {
    color: colors.text.primary,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
  },
  emptyDesc: {
    color: colors.text.tertiary,
    fontSize: typography.sizes.sm,
    textAlign: "center",
    lineHeight: 20,
  },
});
