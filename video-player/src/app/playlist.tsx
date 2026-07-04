import { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, typography, spacing, borderRadius } from "../theme";

export default function PlaylistScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [playlists] = useState<any[]>([]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.title}>Playlists</Text>
        <Pressable hitSlop={8}>
          <Ionicons name="add" size={24} color={colors.accent.primary} />
        </Pressable>
      </View>

      {playlists.length === 0 && (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons name="list-outline" size={36} color={colors.accent.primary} />
          </View>
          <Text style={styles.emptyTitle}>No Playlists</Text>
          <Text style={styles.emptyDesc}>
            Create playlists to organize your videos.
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
