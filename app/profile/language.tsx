import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from 'react-i18next';
import i18n from '@/lib/i18n';

const LANGUAGES = [
  { code: 'en', label: 'English',    native: 'English',   region: 'Global'        },
  { code: 'ur', label: 'Urdu',       native: 'اردو',       region: 'Pakistan'      },
  { code: 'ar', label: 'Arabic',     native: 'العربية',   region: 'Middle East'   },
  { code: 'hi', label: 'Hindi',      native: 'हिंदी',       region: 'India'         },
  { code: 'fr', label: 'French',     native: 'Français',  region: 'France'        },
  { code: 'de', label: 'German',     native: 'Deutsch',   region: 'Germany'       },
  { code: 'es', label: 'Spanish',    native: 'Español',   region: 'Spain/LatAm'   },
  { code: 'zh', label: 'Chinese',    native: '中文',       region: 'China'         },
];

export default function LanguageScreen() {
  const { colors, isDark } = useTheme();
  const { i18n: i18nInst } = useTranslation();
  const [current, setCurrent] = useState(i18nInst.language || 'en');

  const handleSelect = async (code: string) => {
    try { await i18n.changeLanguage(code); } catch {}
    setCurrent(code);
    router.back();
  };

  const BG     = colors.background;
  const FG     = colors.foreground;
  const MUTED  = colors.mutedForeground;
  const BORDER = colors.border;
  const CARD   = colors.card;
  const SEC    = colors.secondary;

  return (
    <View style={[styles.root, { backgroundColor: BG }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <SafeAreaView edges={['top']} style={{ backgroundColor: BG }}>
        <View style={[styles.navBar, { borderBottomColor: BORDER }]}>
          <TouchableOpacity style={styles.navBack} onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="arrow-back" size={22} color={FG} />
          </TouchableOpacity>
          <Text style={[styles.navTitle, { color: FG }]}>LANGUAGE</Text>
          <View style={{ width: 36 }} />
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={[styles.hint, { color: MUTED }]}>
          Choose the language used throughout the app.
        </Text>

        {LANGUAGES.map((lang, idx) => {
          const active = current.startsWith(lang.code);
          const last   = idx === LANGUAGES.length - 1;
          return (
            <TouchableOpacity
              key={lang.code}
              style={[
                styles.row,
                { backgroundColor: active ? CARD : 'transparent', borderColor: active ? FG : BORDER },
                !last && { marginBottom: 10 },
              ]}
              onPress={() => handleSelect(lang.code)}
              activeOpacity={0.8}
            >
              {/* Native label badge */}
              <View style={[styles.badge, { backgroundColor: active ? FG : SEC }]}>
                <Text style={[styles.badgeText, { color: active ? BG : MUTED }]} numberOfLines={1}>
                  {lang.native}
                </Text>
              </View>

              <View style={styles.rowText}>
                <Text style={[styles.rowLabel, { color: FG, fontWeight: active ? '800' : '600' }]}>
                  {lang.label}
                </Text>
                <Text style={[styles.rowSub, { color: MUTED }]}>{lang.region}</Text>
              </View>

              <View style={[styles.radio, { borderColor: active ? FG : BORDER }]}>
                {active && <View style={[styles.radioDot, { backgroundColor: FG }]} />}
              </View>
            </TouchableOpacity>
          );
        })}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1 },
  navBar:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 14, borderBottomWidth: 1 },
  navBack: { width: 36, height: 36, justifyContent: 'center' },
  navTitle:{ fontSize: 13, fontWeight: '900', letterSpacing: 2 },

  scroll: { paddingHorizontal: 24, paddingTop: 24 },
  hint:   { fontSize: 13, lineHeight: 20, marginBottom: 24 },

  row: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderWidth: 1.5, borderRadius: 16,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  badge:     { width: 56, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  badgeText: { fontSize: 13, fontWeight: '700' },
  rowText:   { flex: 1 },
  rowLabel:  { fontSize: 15, marginBottom: 3 },
  rowSub:    { fontSize: 12 },
  radio:     { width: 20, height: 20, borderRadius: 10, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  radioDot:  { width: 10, height: 10, borderRadius: 5 },
});
