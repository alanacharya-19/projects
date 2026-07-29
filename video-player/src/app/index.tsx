import { useEffect } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  withSequence,
  runOnJS,
} from "react-native-reanimated";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, typography, spacing } from "../theme";

const { width, height } = Dimensions.get("window");

export default function SplashScreen() {
  const router = useRouter();

  const logoScale = useSharedValue(0.3);
  const logoRotate = useSharedValue(-10);
  const logoOpacity = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const subtitleOpacity = useSharedValue(0);
  const loaderOpacity = useSharedValue(0);
  const bgOpacity = useSharedValue(0);

  useEffect(() => {
    bgOpacity.value = withTiming(1, { duration: 400 });

    logoOpacity.value = withDelay(
      200,
      withTiming(1, { duration: 600, easing: Easing.bezier(0.16, 1, 0.3, 1) })
    );
    logoScale.value = withDelay(
      200,
      withSequence(
        withTiming(1.1, { duration: 400, easing: Easing.bezier(0.16, 1, 0.3, 1) }),
        withTiming(1, { duration: 200 })
      )
    );
    logoRotate.value = withDelay(
      200,
      withTiming(0, { duration: 500, easing: Easing.bezier(0.16, 1, 0.3, 1) })
    );

    titleOpacity.value = withDelay(
      800,
      withTiming(1, { duration: 500, easing: Easing.bezier(0.16, 1, 0.3, 1) })
    );

    subtitleOpacity.value = withDelay(
      1100,
      withTiming(1, { duration: 400 })
    );

    loaderOpacity.value = withDelay(
      1400,
      withTiming(1, { duration: 300 })
    );

    setTimeout(() => {
      runOnJS(router.replace)("/home");
    }, 2800);
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [
      { scale: logoScale.value },
      { rotate: `${logoRotate.value}deg` },
    ],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: withTiming(0, { duration: 0 }) }],
  }));

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
  }));

  const loaderStyle = useAnimatedStyle(() => ({
    opacity: loaderOpacity.value,
  }));

  const bgStyle = useAnimatedStyle(() => ({
    opacity: bgOpacity.value,
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.bg, bgStyle]} />

      <Animated.View style={[styles.logoWrapper, logoStyle]}>
        <View style={styles.iconContainer}>
          <Ionicons name="film" size={48} color={colors.accent.primary} />
        </View>
      </Animated.View>

      <Animated.View style={[styles.titleWrapper, titleStyle]}>
        <Text style={styles.title}>CineFlow</Text>
        <Animated.Text style={[styles.subtitle, subtitleStyle]}>
          Your Premium Video Experience
        </Animated.Text>
      </Animated.View>

      <Animated.View style={[styles.loaderWrapper, loaderStyle]}>
        <View style={styles.loaderTrack}>
          <View style={styles.loaderBar} />
        </View>
        <Text style={styles.version}>v1.0.0</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  bg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.bg.primary,
  },
  logoWrapper: {
    alignItems: "center",
    marginBottom: spacing["4xl"],
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: colors.bg.glass,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.bg.glassBorder,
  },
  titleWrapper: {
    alignItems: "center",
  },
  title: {
    color: colors.text.primary,
    fontSize: typography.sizes["5xl"],
    fontWeight: typography.weights.black,
    letterSpacing: -1,
  },
  subtitle: {
    color: colors.text.tertiary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    marginTop: spacing.sm,
  },
  loaderWrapper: {
    position: "absolute",
    bottom: height * 0.12,
    alignItems: "center",
  },
  loaderTrack: {
    width: 120,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.bg.elevated,
    overflow: "hidden",
    marginBottom: spacing.lg,
  },
  loaderBar: {
    width: "40%",
    height: "100%",
    borderRadius: 2,
    backgroundColor: colors.accent.primary,
  },
  version: {
    color: colors.text.tertiary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
});