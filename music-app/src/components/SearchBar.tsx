import React, { memo } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../constants/theme';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  colors: typeof COLORS.dark;
  onClear?: () => void;
  autoFocus?: boolean;
  noMargin?: boolean;
}

function SearchBarComponent({
  value,
  onChangeText,
  placeholder = 'Search songs, artists, albums...',
  colors,
  onClear,
  autoFocus = false,
  noMargin = false,
}: SearchBarProps) {
  return (
    <View style={[styles.container, { backgroundColor: colors.surface }, noMargin && { marginHorizontal: 0 }]}>
      <Ionicons name="search" size={18} color={colors.textTertiary} style={styles.searchIcon} />
      <TextInput
        style={[styles.input, { color: colors.text }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        autoFocus={autoFocus}
        autoCorrect={false}
        autoCapitalize="none"
      />
      {value.length > 0 && (
        <TouchableOpacity
          onPress={() => {
            onChangeText('');
            onClear?.();
          }}
          style={styles.clearButton}
        >
          <Ionicons name="close-circle" size={16} color={colors.textTertiary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SIZES.padding,
    marginVertical: SIZES.paddingSmall,
    borderRadius: SIZES.radius,
    paddingHorizontal: SIZES.paddingSmall,
    height: 44,
  },
  searchIcon: {
    marginRight: SIZES.paddingSmall,
  },
  input: {
    flex: 1,
    fontSize: SIZES.fontLarge,
    height: '100%',
  },
  clearButton: {
    padding: 6,
  },
});

export const SearchBar = memo(SearchBarComponent);
