import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from './stepStyles';

// A labelled −/+ control; used where free typing would invite invalid values.
export const Stepper = ({ label, value, display, onChange, step, min, max }: {
  label: string;
  value: number;
  display: string;
  onChange: (value: number) => void;
  step: number;
  min: number;
  max: number;
}) => (
  <View style={stepperStyles.row}>
    <Text style={stepperStyles.label}>{label}</Text>
    <View style={stepperStyles.stepper}>
      <TouchableOpacity style={stepperStyles.button} onPress={() => onChange(Math.max(min, value - step))} accessibilityLabel={`Decrease ${label}`}>
        <Text style={stepperStyles.buttonText}>−</Text>
      </TouchableOpacity>
      <Text style={stepperStyles.value}>{display}</Text>
      <TouchableOpacity style={stepperStyles.button} onPress={() => onChange(Math.min(max, value + step))} accessibilityLabel={`Increase ${label}`}>
        <Text style={stepperStyles.buttonText}>+</Text>
      </TouchableOpacity>
    </View>
  </View>
);

export const stepperStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 8 },
  label: { fontSize: 13, fontWeight: '700', color: COLORS.ink, flex: 1 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  button: { width: 30, height: 30, borderRadius: 15, borderWidth: 1, borderColor: COLORS.red, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontSize: 16, fontWeight: '900', color: COLORS.red },
  value: { minWidth: 76, textAlign: 'center', fontSize: 13, fontWeight: '800', color: COLORS.ink },
});

export default Stepper;
