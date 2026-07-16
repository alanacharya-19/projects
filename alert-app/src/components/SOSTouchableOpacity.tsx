import React, { useEffect, useRef } from "react";
import { Animated, TouchableOpacity, Text, Easing } from "react-native";
import * as Haptics from "expo-haptics";

interface SOSTouchableOpacityProps {
  onPress: () => void;
  colors?: {
    sos: string;
  };
}

const SOSTouchableOpacity: React.FC<SOSTouchableOpacityProps> = ({
  onPress,
  colors,
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const ringAnim = useRef(new Animated.Value(0.6)).current;
  const ringOpacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.12,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    const ring = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(ringAnim, {
            toValue: 1.6,
            duration: 1400,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(ringOpacity, {
            toValue: 0,
            duration: 1400,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(ringAnim, {
            toValue: 0.6,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.timing(ringOpacity, {
            toValue: 0.4,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    pulse.start();
    ring.start();

    return () => {
      pulse.stop();
      ring.stop();
    };
  }, [pulseAnim, ringAnim, ringOpacity]);

  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onPress();
  };

  const sosColor = colors?.sos || "#DC2626";

  return (
    <Animated.View
      style={{
        alignItems: "center",
        justifyContent: "center",
        width: 120,
        height: 120,
      }}
    >
      <Animated.View
        style={{
          position: "absolute",
          width: 120,
          height: 120,
          borderRadius: 60,
          backgroundColor: sosColor,
          opacity: ringOpacity,
          transform: [{ scale: ringAnim }],
        }}
      />

      <Animated.View
        style={{
          position: "absolute",
          width: 120,
          height: 120,
          borderRadius: 60,
          backgroundColor: sosColor,
          opacity: 0.25,
          transform: [{ scale: pulseAnim }],
        }}
      />

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handlePress}
        style={{
          width: 100,
          height: 100,
          borderRadius: 50,
          backgroundColor: sosColor,
          alignItems: "center",
          justifyContent: "center",
          shadowColor: sosColor,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.5,
          shadowRadius: 20,
          elevation: 16,
        }}
      >
        <Text
          style={{
            fontSize: 26,
            fontWeight: "900",
            color: "#FFFFFF",
            letterSpacing: 3,
          }}
        >
          SOS
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default React.memo(SOSTouchableOpacity);
