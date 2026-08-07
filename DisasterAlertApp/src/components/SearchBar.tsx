import React from "react";
import { View, TextInput, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  colors: {
    card: string;
    text: string;
    textMuted: string;
    cardAlt: string;
    accent: string;
  };
}

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder = "Search location...",
  colors,
}) => {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.cardAlt,
        borderRadius: 9999,
        paddingHorizontal: 18,
        height: 52,
        gap: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2,
      }}
    >
      <Ionicons name="search" size={18} color={colors.textMuted} />

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        style={{
          flex: 1,
          fontSize: 15,
          color: colors.text,
          fontWeight: "400",
          paddingVertical: 0,
        }}
        returnKeyType="search"
        autoCorrect={false}
      />

      {value.length > 0 && (
        <TouchableOpacity
          activeOpacity={0.6}
          onPress={() => onChangeText("")}
          style={{
            width: 26,
            height: 26,
            borderRadius: 13,
            backgroundColor: colors.card,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="close" size={14} color={colors.textMuted} />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default React.memo(SearchBar);
