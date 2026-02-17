import React from 'react';
import { View, Text, TextInput, Switch, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui';

interface AddBusinessFormProps {
  name: string;
  category: string;
  isOpen: boolean;
  onNameChange: (name: string) => void;
  onCategoryChange: (category: string) => void;
  onIsOpenChange: (isOpen: boolean) => void;
  onSave: () => void;
}

export function AddBusinessForm({
  name,
  category,
  isOpen,
  onNameChange,
  onCategoryChange,
  onIsOpenChange,
  onSave,
}: AddBusinessFormProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.form, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <TextInput
        placeholder="Name"
        value={name}
        onChangeText={onNameChange}
        style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
      />
      <TextInput
        placeholder="Category"
        value={category}
        onChangeText={onCategoryChange}
        style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
      />
      <View style={styles.rowSpace}>
        <Text style={{ color: colors.foreground }}>Open</Text>
        <Switch value={isOpen} onValueChange={onIsOpenChange} />
      </View>
      <Button onPress={onSave} style={{ marginTop: 8 }}>Save</Button>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { width: '100%', padding: 12, borderRadius: 8, borderWidth: 1, marginTop: 8 },
  input: { borderWidth: 1, borderRadius: 6, padding: 8, marginTop: 8 },
  rowSpace: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
});
