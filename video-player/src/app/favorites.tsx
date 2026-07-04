import { useState, useCallback } from "react";
import { View, Text, Pressable, FlatList, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, typography, spacing, borderRadius } from "../theme";
import { FlashList } from "@shopify/flash-list";

const EMPTY_FAVORITES = [1, 2, 3];

export default function FavoritesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [favorites] = useState<any[]>([]);

  const renderEmpty = useCallback(
    () => (
      <View style={styles.emptyState}>
        <View style={styles.emptyIcon}>
          <Ionicons name="heart-outline" size={36} color={colors.accent.primary} />
        </View>
        <Text style={styles.emptyTitle}>No Favorites Yet</Text>
        <Text style={styles.emptyDesc}>
          Tap the heart icon on any video to add it to your favorites.
        </Text>
        <Pressable
          onPress={() => router.push("/library")}
          style={styles.emptyBtn}
        >
          <Text style={styles.emptyBtnText}>Browse Videos</Text>
        </Pressable>
      </View>
    ),
    [router]
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.title}>Favorites</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlashList
        data={favorites}
        estimatedItemSize={72}
        keyExtractor={(item) => item.id}
        renderItem={() => null}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      />
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
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing["4xl"],
    paddingVertical: 100,
    gap: spacing.md,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: borderRadius["2xl"],
    backgroundColor: colors.bg.glass,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.md,
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
    maxWidth: 260,
  },
  emptyBtn: {
    marginTop: spacing.lg,
    backgroundColor: colors.accent.primary,
    paddingHorizontal: spacing["3xl"],
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.full,
  },
  emptyBtnText: {
    color: colors.text.inverse,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
});
