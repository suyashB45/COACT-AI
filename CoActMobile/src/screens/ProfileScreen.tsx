/**
 * ProfileScreen — Full-featured profile matching the web app.
 * Shows user info, stats cards (sessions/completed/avg score),
 * recent practice history, and logout.
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
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
  role: string;
  ai_role: string;
  score?: number;
  completed?: boolean;
  created_at?: string;
  date?: string;
  scenario_type?: string;
  session_mode?: string;
}

export default function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { user, authSession, clearAuth } = useSessionStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sessions, setSessions] = useState<HistoryItem[]>([]);
  const [stats, setStats] = useState({ total: 0, completed: 0, avgScore: 0 });

  const fetchData = useCallback(async () => {
    try {
      const token = authSession?.access_token || null;
      const data = await api.getHistory(token);
      const list: HistoryItem[] = Array.isArray(data) ? data : [];
      setSessions(list);

      const completed = list.filter((s) => s.completed).length;
      const scores = list.filter((s) => s.score != null).map((s) => s.score || 0);
      const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10 : 0;
      setStats({ total: list.length, completed, avgScore: avg });
    } catch (err) {
      console.warn('Profile fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [authSession]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    clearAuth();
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Recent';
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const displayName = userName.charAt(0).toUpperCase() + userName.slice(1);
  const initials = displayName.charAt(0).toUpperCase();

  if (loading) {
    return (
      <View style={[styles.screen, styles.center]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {/* Profile Card */}
        <GlassmorphicCard style={styles.profileCard}>
          <View style={styles.profileRow}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{displayName}</Text>
              <View style={styles.emailRow}>
                <Ionicons name="mail-outline" size={14} color={Colors.onSurfaceVariant} />
                <Text style={styles.emailText}>{user?.email}</Text>
              </View>
            </View>
          </View>
        </GlassmorphicCard>

        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { borderColor: 'rgba(139, 92, 246, 0.3)' }]}>
            <Ionicons name="play-circle-outline" size={28} color="#a855f7" />
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total Sessions</Text>
          </View>
          <View style={[styles.statCard, { borderColor: 'rgba(16, 185, 129, 0.3)' }]}>
            <Ionicons name="trophy-outline" size={28} color={Colors.secondary} />
            <Text style={styles.statValue}>{stats.completed}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={[styles.statCard, { borderColor: 'rgba(59, 130, 246, 0.3)' }]}>
            <Ionicons name="stats-chart-outline" size={28} color={Colors.primary} />
            <Text style={styles.statValue}>{stats.avgScore || '-'}</Text>
            <Text style={styles.statLabel}>Avg Score</Text>
          </View>
        </View>

        {/* Practice History */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Practice History</Text>
          <TouchableOpacity onPress={() => navigation.navigate('PracticeTab')}>
            <View style={styles.newSessionBtn}>
              <Text style={styles.newSessionText}>New Session</Text>
              <Ionicons name="arrow-forward" size={14} color={Colors.primary} />
            </View>
          </TouchableOpacity>
        </View>

        {sessions.length === 0 ? (
          <GlassmorphicCard style={styles.emptyCard}>
            <Ionicons name="play-circle-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No practice sessions yet.</Text>
            <TouchableOpacity
              style={styles.startBtn}
              onPress={() => navigation.navigate('PracticeTab')}
            >
              <Text style={styles.startBtnText}>Start Your First Session</Text>
            </TouchableOpacity>
          </GlassmorphicCard>
        ) : (
          sessions.slice(0, 10).map((session, index) => (
            <TouchableOpacity
              key={session.session_id || index}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Report', { sessionId: session.session_id })}
            >
              <GlassmorphicCard style={styles.historyItem}>
                <View style={styles.historyRow}>
                  <View style={styles.historyLeft}>
                    <View style={[styles.statusDot, { backgroundColor: session.completed ? Colors.secondary : Colors.tertiary }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.historyRole} numberOfLines={1}>{session.role || 'Practice Session'}</Text>
                      <Text style={styles.historyType}>{session.scenario_type || 'Custom'}</Text>
                    </View>
                  </View>
                  <View style={styles.historyRight}>
                    {session.score != null && (
                      <Text style={styles.historyScore}>{session.score}/10</Text>
                    )}
                    <Text style={styles.historyDate}>{formatDate(session.created_at || session.date)}</Text>
                    <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
                  </View>
                </View>
              </GlassmorphicCard>
            </TouchableOpacity>
          ))
        )}

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={Colors.recordingRed} />
          <Text style={styles.logoutBtnText}>Log Out</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    paddingHorizontal: Spacing.containerMargin,
    paddingTop: 50,
    paddingBottom: Spacing.md,
    backgroundColor: 'rgba(29, 32, 39, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: Colors.glassBorderLight,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  scrollContent: {
    padding: Spacing.containerMargin,
  },
  profileCard: {
    marginBottom: Spacing.lg,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  avatarContainer: {},
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarText: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.white,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.onSurface,
    marginBottom: 4,
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  emailText: {
    fontSize: 13,
    color: Colors.onSurfaceVariant,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    gap: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  newSessionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  newSessionText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xl * 2,
    gap: Spacing.md,
  },
  emptyText: {
    fontSize: 15,
    color: Colors.textMuted,
  },
  startBtn: {
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  startBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#a855f7',
  },
  historyItem: {
    marginBottom: Spacing.sm,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  historyRole: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.onSurface,
    marginBottom: 2,
  },
  historyType: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    textTransform: 'capitalize',
  },
  historyRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  historyScore: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  historyDate: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  logoutBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.recordingRed,
  },
});
