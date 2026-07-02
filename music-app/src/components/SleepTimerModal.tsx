import React, { memo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { COLORS, SIZES } from '../constants/theme';

interface SleepTimerModalProps {
  visible: boolean;
  onClose: () => void;
  onSetTimer: (minutes: number) => void;
  onCancelTimer: () => void;
  activeTimer: number | null;
  colors: typeof COLORS.dark;
}

const TIMER_OPTIONS = [
  { label: '5 min', value: 5 },
  { label: '10 min', value: 10 },
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '45 min', value: 45 },
  { label: '60 min', value: 60 },
  { label: '90 min', value: 90 },
];

function SleepTimerModalComponent({
  visible,
  onClose,
  onSetTimer,
  onCancelTimer,
  activeTimer,
  colors,
}: SleepTimerModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: colors.surface }]}>
          <Text style={[styles.title, { color: colors.text }]}>
            Sleep Timer
          </Text>

          {activeTimer && (
            <Text style={[styles.activeText, { color: colors.primary }]}>
              Timer active: {activeTimer} min
            </Text>
          )}

          <View style={styles.grid}>
            {TIMER_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.option,
                  {
                    backgroundColor: colors.surfaceLight,
                    borderColor:
                      activeTimer === option.value
                        ? colors.primary
                        : colors.border,
                  },
                ]}
                onPress={() => onSetTimer(option.value)}
              >
                <Text style={[styles.optionText, { color: colors.text }]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {activeTimer && (
            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: colors.border }]}
              onPress={onCancelTimer}
            >
              <Text style={[styles.cancelText, { color: colors.error }]}>
                Cancel Timer
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: colors.surfaceLight }]}
            onPress={onClose}
          >
            <Text style={[styles.closeText, { color: colors.text }]}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    borderTopLeftRadius: SIZES.radiusLarge,
    borderTopRightRadius: SIZES.radiusLarge,
    padding: SIZES.paddingLarge,
    paddingBottom: 40,
  },
  title: {
    fontSize: SIZES.fontXLarge,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: SIZES.padding,
  },
  activeText: {
    fontSize: SIZES.fontMedium,
    textAlign: 'center',
    marginBottom: SIZES.padding,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SIZES.paddingSmall,
    justifyContent: 'center',
  },
  option: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: SIZES.radius,
    borderWidth: 1,
  },
  optionText: {
    fontSize: SIZES.fontMedium,
    fontWeight: '500',
  },
  cancelButton: {
    marginTop: SIZES.padding,
    paddingVertical: 14,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: SIZES.fontMedium,
    fontWeight: '600',
  },
  closeButton: {
    marginTop: SIZES.paddingSmall,
    paddingVertical: 14,
    borderRadius: SIZES.radius,
    alignItems: 'center',
  },
  closeText: {
    fontSize: SIZES.fontMedium,
    fontWeight: '600',
  },
});

export const SleepTimerModal = memo(SleepTimerModalComponent);
