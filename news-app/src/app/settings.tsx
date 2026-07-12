import { useMemo, useState, useRef, useEffect } from 'react';
import { Text, View, ScrollView, TouchableOpacity, Image, Animated, TextInput, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useBookmarks } from '../context/BookmarkContext';
import { usePreferred } from '../context/PreferredContext';
import { getCachedArticle } from '../services/api';
import { CATEGORIES } from '../data/articles';

function ToggleSwitch({ value, onToggle }: { value: boolean; onToggle: () => void }) {
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: value ? 1 : 0, duration: 200, useNativeDriver: false }).start();
  }, [value, anim]);
  const trackColor = anim.interpolate({ inputRange: [0, 1], outputRange: ['#e0e0e0', '#34c759'] });
  const thumbLeft = anim.interpolate({ inputRange: [0, 1], outputRange: [2, 22] });
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onToggle}>
      <Animated.View style={{ width: 48, height: 28, borderRadius: 14, backgroundColor: trackColor, justifyContent: 'center', paddingHorizontal: 2 }}>
        <Animated.View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2, elevation: 3, transform: [{ translateX: thumbLeft }] }} />
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { colors, theme, toggleTheme } = useTheme();
  const { bookmarks } = useBookmarks();
  const { preferredCategories, setPreferredCategories, triggerRefresh, userName, setUserName } = usePreferred();
  const [showSaved, setShowSaved] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [showNameInput, setShowNameInput] = useState(false);
  const [nameDraft, setNameDraft] = useState(userName);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [localPreferred, setLocalPreferred] = useState<string[]>([...preferredCategories]);
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const savedArticles = [...bookmarks].map((id) => getCachedArticle(id)).filter(Boolean);

  const toggleCategory = (cat: string) => {
    setLocalPreferred((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const categorySubText = localPreferred.length === 0
    ? 'Showing all categories'
    : localPreferred.slice(0, 3).join(', ') + (localPreferred.length > 3 ? ` +${localPreferred.length - 3}` : '');

  const SECTIONS = [
    {
      title: 'Appearance',
      items: [
        {
          icon: 'person' as const,
          label: 'Your Name',
          sub: userName || 'Not set',
          action: () => setShowNameInput((s) => !s),
          expandable: true,
        },
        {
          icon: theme === 'dark' ? 'moon' : 'sunny' as 'moon' | 'sunny',
          label: 'Dark Mode',
          sub: theme === 'dark' ? 'On' : 'Off',
          action: toggleTheme,
          toggle: true,
        },
      ],
    },
    {
      title: 'Content',
      items: [
        {
          icon: 'bookmark' as const,
          label: 'Saved Articles',
          sub: `${bookmarks.size} article${bookmarks.size !== 1 ? 's' : ''}`,
          action: () => setShowSaved((s) => !s),
          expandable: true,
        },
        {
          icon: 'newspaper' as const,
          label: 'Preferred Categories',
          sub: categorySubText,
          action: () => setShowCategories((s) => !s),
          expandable: true,
        },
        {
          icon: 'notifications' as const,
          label: 'Notifications',
          sub: notificationsEnabled ? 'On' : 'Off',
          action: () => setNotificationsEnabled((v) => !v),
          toggle: true,
        },
      ],
    },
    {
      title: 'About',
      items: [
        { icon: 'information-circle' as const, label: 'Version', sub: '1.0.0' },
      ],
    },
  ];

  return (
    <View style={styles.container}>
      <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
        <View style={styles.topRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="white" />
          </TouchableOpacity>
          <Text style={styles.title}>Settings</Text>
          <View style={{ width: 36 }} />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
        {SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={[styles.sectionCard, { backgroundColor: colors.card }]}>
              {section.items.map((item, i) => (
                <View key={item.label}>
                  <TouchableOpacity
                    style={[styles.menuItem, i < section.items.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
                    onPress={'action' in item ? item.action : undefined}
                  >
                    <View style={[styles.menuIcon, { backgroundColor: colors.categoryBg }]}>
                      <Ionicons name={item.icon} size={20} color={colors.primary} />
                    </View>
                    <View style={styles.menuText}>
                      <Text style={[styles.menuLabel, { color: colors.text }]}>{item.label}</Text>
                      {'sub' in item && <Text style={styles.menuSub}>{item.sub}</Text>}
                    </View>
                    {'toggle' in item ? (
                      <ToggleSwitch
                        value={item.label === 'Notifications' ? notificationsEnabled : theme === 'dark'}
                        onToggle={item.action}
                      />
                    ) : (
                      <Ionicons name={'expandable' in item && (
                        (item.label === 'Saved Articles' && showSaved) ||
                        (item.label === 'Preferred Categories' && showCategories) ||
                        (item.label === 'Your Name' && showNameInput)
                      ) ? 'chevron-down' : 'chevron-forward'} size={18} color={colors.textMuted} />
                    )}
                  </TouchableOpacity>
                  {'expandable' in item && showSaved && item.label === 'Saved Articles' && (
                    <View style={[styles.savedSection, { borderTopWidth: 1, borderTopColor: colors.border }]}>
                      {savedArticles.length === 0 ? (
                        <View style={styles.savedEmpty}>
                          <Ionicons name="bookmark-outline" size={28} color={colors.textMuted} />
                          <Text style={styles.savedEmptyText}>No saved articles yet</Text>
                        </View>
                      ) : (
                        savedArticles.map((article) => (
                          <TouchableOpacity
                            key={article!.id}
                            style={[styles.savedItem, { borderBottomColor: colors.border }]}
                            onPress={() => router.push({ pathname: '/article/[id]', params: { id: article!.id } })}
                          >
                            {article!.image && (
                              <Image source={{ uri: article!.image }} style={styles.savedThumb} />
                            )}
                            <View style={styles.savedInfo}>
                              <Text style={[styles.savedTitle, { color: colors.text }]} numberOfLines={2}>{article!.title}</Text>
                              <Text style={styles.savedMeta}>{article!.source} · {article!.time}</Text>
                            </View>
                          </TouchableOpacity>
                        ))
                      )}
                    </View>
                  )}
                  {'expandable' in item && showCategories && item.label === 'Preferred Categories' && (
                    <View style={[styles.savedSection, { borderTopWidth: 1, borderTopColor: colors.border }]}>
                      {CATEGORIES.filter((c) => c !== 'All').map((cat, i, arr) => {
                        const selected = localPreferred.includes(cat);
                        return (
                          <TouchableOpacity
                            key={cat}
                            style={[styles.catItem, i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
                            onPress={() => toggleCategory(cat)}
                          >
                            <View style={[styles.catCheck, selected && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                              {selected && <Ionicons name="checkmark" size={14} color="white" />}
                            </View>
                            <Text style={[styles.catLabel, { color: colors.text }]}>{cat}</Text>
                          </TouchableOpacity>
                        );
                      })}
                      <TouchableOpacity
                        style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                        onPress={() => {
                          setPreferredCategories(localPreferred);
                          triggerRefresh();
                          router.back();
                        }}
                      >
                        <Ionicons name="checkmark-circle" size={18} color="white" />
                        <Text style={styles.saveBtnText}>Save Preferences</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  {'expandable' in item && showNameInput && item.label === 'Your Name' && (
                    <View style={[styles.savedSection, { borderTopWidth: 1, borderTopColor: colors.border, paddingVertical: 12 }]}>
                      <TextInput
                        style={[styles.nameInput, { color: colors.text, backgroundColor: colors.iconBg, borderColor: colors.border }]}
                        placeholder="Enter your name"
                        placeholderTextColor={colors.textMuted}
                        value={nameDraft}
                        onChangeText={setNameDraft}
                        onSubmitEditing={() => setUserName(nameDraft)}
                        returnKeyType="done"
                      />
                      <TouchableOpacity
                        style={[styles.nameSaveBtn, { backgroundColor: colors.primary }]}
                        onPress={() => {
                          setUserName(nameDraft);
                          setShowNameInput(false);
                        }}
                      >
                        <Text style={styles.nameSaveText}>Set Name</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>
        ))}

        <View style={styles.footer}>
          <Ionicons name="newspaper" size={20} color={colors.textMuted} />
          <Text style={styles.footerText}>NewsApp 1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const makeStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 0.2,
  },
  body: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionCard: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 16,
    gap: 12,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuText: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  menuSub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  savedSection: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  savedEmpty: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 20,
  },
  savedEmptyText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  savedItem: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  savedThumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: colors.border,
  },
  savedInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  savedTitle: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 19,
  },
  savedMeta: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  catItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  catCheck: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.textMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  catLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 12,
    marginBottom: 4,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'white',
  },
  nameInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  nameSaveBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 10,
  },
  nameSaveText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 13,
    color: colors.textMuted,
  },
});
