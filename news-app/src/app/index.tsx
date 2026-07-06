import { Text, View, StyleSheet } from 'react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeHeader, { HEADER_EXPANDED_HEIGHT } from '../components/HomeHeader';
import TrendingNews from '../components/TrendingNews';

export default function Index() {
  const scrollY = useSharedValue(0);
  const insets = useSafeAreaInsets();

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  return (
    <View style={styles.container}>
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={{
          paddingTop: HEADER_EXPANDED_HEIGHT + insets.top,
          paddingBottom: 32,
        }}
      >
        <TrendingNews />

        <View style={styles.latestSection}>
          <Text style={styles.sectionTitle}>Latest News</Text>
          {Array.from({ length: 15 }).map((_, i) => (
            <View key={i} style={styles.card}>
              <Text style={styles.cardTitle}>Breaking Story {i + 1}</Text>
              <Text style={styles.cardBody}>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
                enim ad minim veniam, quis nostrud exercitation ullamco laboris.
              </Text>
            </View>
          ))}
        </View>
      </Animated.ScrollView>
      <HomeHeader scrollY={scrollY} unreadCount={3} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  latestSection: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 12,
    marginTop: 8,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: 6,
  },
  cardBody: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});
