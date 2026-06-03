/**
 * HistoryScreen — Enhanced session history with mode badges, proper scores, and search.
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  TextInput,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../theme/colors';
import { Spacing, Radii } from '../theme/styles';
import { GlassmorphicCard } from '../components/GlassmorphicCard';
import { api } from '../lib/api';
import { useSessionStore } from '../stores/useSessionStore';

interface HistoryItem {
  session_id: string;
  scenario: string;
  title?: string;
  role: string;
  ai_role: string;
  score?: number;
  completed?: boolean;
  created_at?: string;
  date?: string;
  scenario_type?: string;
  session_mode?: string;
}

export default function HistoryScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { authSession } = useSessionStore();

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchHistory = useCallback(async () => {
    try {
      const token = authSession?.access_token || null;
      const data = await api.getHistory(token);
      setHistory(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Failed to fetch history:', err);
    } finally {
      setLoading(false);
    }
  }, [authSession]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchHistory();
    setRefreshing(false);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Recent';
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const filteredHistory = history.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (item.scenario || '').toLowerCase().includes(q) ||
      (item.title || '').toLowerCase().includes(q) ||
      (item.role || '').toLowerCase().includes(q) ||
      (item.ai_role || '').toLowerCase().includes(q)
    );
  });

  const getScoreColor = (score?: number) => {
    if (score == null) return Colors.textMuted;
    if (score >= 7) return Colors.secondary;
    if (score >= 5) return Colors.tertiary;
    return Colors.recordingRed;
  };

  const renderItem = ({ item }: { item: HistoryItem }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => navigation.navigate('Report', { sessionId: item.session_id })}
    >
      <GlassmorphicCard style={styles.card}>
        {/* Top: Mode badge + Date */}
        <View style={styles.cardTop}>
          <View style={[styles.modeBadge, {
            backgroundColor: item.session_mode === 'mentorship' ? 'rgba(139,92,246,0.1)' : 'rgba(59,130,246,0.1)',
            borderColor: item.session_mode === 'mentorship' ? 'rgba(139,92,246,0.25)' : 'rgba(59,130,246,0.25)',
          }]}>
            <Ionicons
              name={item.session_mode === 'mentorship' ? 'book-outline' : 'sparkles-outline'}
              size={11}
              color={item.session_mode === 'mentorship' ? '#a855f7' : '#3b82f6'}
            />
            <Text style={[styles.modeBadgeText, {
              color: item.session_mode === 'mentorship' ? '#a855f7' : '#3b82f6',
            }]}>
              {item.session_mode === 'mentorship' ? 'Mentorship' : 'Assessment'}
            </Text>
          </View>
          <Text style={styles.dateText}>{formatDate(item.created_at || item.date)}</Text>
        </View>

        {/* Title */}
        <Text style={styles.titleText} numberOfLines={1}>
          {item.title || item.scenario || 'Simulation'}
        </Text>

        {/* Bottom: Roles + Score */}
        <View style={styles.cardBottom}>
          <View style={styles.rolesRow}>
            <Ionicons name="person-outline" size={13} color={Colors.primary} />
            <Text style={styles.roleText} numberOfLines={1}>{item.role}</Text>
            <Text style={styles.dotSep}>•</Text>
            <Ionicons name="hardware-chip-outline" size={13} color="#a855f7" />
            <Text style={styles.roleText} numberOfLines={1}>{item.ai_role}</Text>
          </View>
          <View style={styles.scoreContainer}>
            {item.score != null ? (
              <View style={styles.scoreRow}>
                <Text style={[styles.scoreText, { color: getScoreColor(item.score) }]}>
                  {item.score}/10
                </Text>
                {item.score >= 7 && (
                  <Ionicons name="trending-up" size={14} color={Colors.secondary} />
                )}
              </View>
            ) : (
              <Text style={styles.noScoreText}>-</Text>
            )}
            <Text style={[styles.statusText, {
              color: item.completed ? Colors.secondary : Colors.tertiary,
            }]}>
              {item.completed ? 'COMPLETED' : 'IN PROGRESS'}
            </Text>
          </View>
        </View>
      </GlassmorphicCard>
    </TouchableOpacity>
  );

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Session History</Text>
        <Text style={styles.headerCount}>
          {history.length} session{history.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={18} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search sessions..."
          placeholderTextColor={Colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={filteredHistory}
          keyExtractor={(item, index) => item.session_id || index.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={onRefresh}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="folder-open-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyText}>
                {searchQuery ? 'No matching sessions found.' : 'No sessions found.'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline',
    paddingHorizontal: Spacing.containerMargin, paddingTop: 50, paddingBottom: Spacing.sm,
    backgroundColor: 'rgba(29, 32, 39, 0.8)',
    borderBottomWidth: 1, borderBottomColor: Colors.glassBorderLight,
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: Colors.onSurface },
  headerCount: { fontSize: 13, fontWeight: '600', color: Colors.textMuted },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    margin: Spacing.containerMargin, marginBottom: 0,
    backgroundColor: Colors.surfaceContainer, borderRadius: Radii.full,
    paddingHorizontal: Spacing.md, height: 44,
    borderWidth: 1, borderColor: Colors.outlineVariant,
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.onSurface },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: Spacing.containerMargin, paddingBottom: 100 },
  card: { marginBottom: Spacing.sm },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  modeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radii.sm, borderWidth: 1,
  },
  modeBadgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
  dateText: { fontSize: 11, fontWeight: '600', color: Colors.textMuted },
  titleText: { fontSize: 15, fontWeight: '700', color: Colors.onSurface, marginBottom: 8 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rolesRow: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
  roleText: { fontSize: 12, color: Colors.onSurfaceVariant, maxWidth: 100 },
  dotSep: { fontSize: 10, color: Colors.glassBorder },
  scoreContainer: { alignItems: 'flex-end' },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  scoreText: { fontSize: 16, fontWeight: '800', fontVariant: ['tabular-nums'] },
  noScoreText: { fontSize: 16, fontWeight: '600', color: Colors.textMuted },
  statusText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.8, marginTop: 2 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { marginTop: Spacing.md, fontSize: 15, color: Colors.textMuted },
});
