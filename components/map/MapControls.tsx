import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui';
import { AddBusinessForm } from './AddBusinessForm';

const RADIUS_OPTIONS = [1, 3, 5, 10];

interface MapControlsProps {
  radiusKm: number;
  onRadiusChange: (r: number) => void;
  onRefresh: () => void;
  adding: boolean;
  onToggleAdding: () => void;
  newName: string;
  newCategory: string;
  newIsOpen: boolean;
  onNameChange: (name: string) => void;
  onCategoryChange: (category: string) => void;
  onIsOpenChange: (isOpen: boolean) => void;
  onSave: () => void;
}

export function MapControls({
  radiusKm,
  onRadiusChange,
  onRefresh,
  adding,
  onToggleAdding,
  newName,
  newCategory,
  newIsOpen,
  onNameChange,
  onCategoryChange,
  onIsOpenChange,
  onSave,
}: MapControlsProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.controls}>
      <View style={styles.radiusRow}>
        {RADIUS_OPTIONS.map((r) => (
          <TouchableOpacity
            key={r}
            onPress={() => onRadiusChange(r)}
            style={[styles.radiusChip, { backgroundColor: radiusKm === r ? colors.primary : colors.secondary }]}
          >
            <Text style={{ color: radiusKm === r ? colors.primaryForeground : colors.foreground }}>{r} km</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Button onPress={onRefresh} style={styles.button}>Refresh</Button>
      <Button onPress={onToggleAdding} style={[styles.button, { marginTop: 8 }]}>
        {adding ? 'Cancel' : 'Add Business'}
      </Button>
      {adding && (
        <AddBusinessForm
          name={newName}
          category={newCategory}
          isOpen={newIsOpen}
          onNameChange={onNameChange}
          onCategoryChange={onCategoryChange}
          onIsOpenChange={onIsOpenChange}
          onSave={onSave}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  controls: { position: 'absolute', top: 40, left: 16, right: 16, alignItems: 'center' },
  radiusRow: { flexDirection: 'row', marginBottom: 8 },
  radiusChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, marginRight: 8 },
  button: { width: 120 },
});
