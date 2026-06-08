/**
 * DashboardScreen — Full analytics dashboard matching the web app.
 * Stats cards, performance trend (improvement banner), strongest/weakest skills,
 * recent history, and quick actions.
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  StatusBar,
  Animated,
  Image,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../theme/colors';
import { Spacing, Radii } from '../theme/styles';
import { GlassmorphicCard } from '../components/GlassmorphicCard';
import { api } from '../lib/api';
import { useSessionStore } from '../stores/useSessionStore';

interface SkillItem {
  dimension: string;
  average: number;
  count: number;
}

interface AnalyticsData {
  performance_trend: { date: string; score: number; scenario_type: string }[];
  all_time_average: number;
  consistency_index: number;
  strongest_skills: SkillItem[];
  weakest_skills: SkillItem[];
  session_counts: Record<string, number>;
  improvement_status: 'improving' | 'declining' | 'stable' | 'insufficient_data' | 'no_data';
  repeated_scenarios: {
    title: string;
    attempts: number;
    first_score: number;
    latest_score: number;
    change: number;
  }[];
}

interface RecentSession {
  id?: string;
  session_id: string;
  created_at: string;
  role: string;
  ai_role: string;
  scenario?: string;
  title?: string;
  score?: number;
  session_mode?: string;
  completed?: boolean;
}

// Animated skill bar component
function SkillBar({ label, value, maxValue = 10, color, count, delay = 0 }: {
  label: string; value: number; maxValue?: number; color: string; count: number; delay?: number;
}) {
  const animWidth = useState(new Animated.Value(0))[0];

  useEffect(() => {
    Animated.timing(animWidth, {
      toValue: (value / maxValue) * 100,
      duration: 800,
      delay: delay,
      useNativeDriver: false,
    }).start();
  }, [value]);

  const width = animWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={skillStyles.container}>
      <View style={skillStyles.labelRow}>
        <Text style={skillStyles.label} numberOfLines={1}>{label}</Text>
        <Text style={[skillStyles.count, { color: Colors.textMuted }]}>({count})</Text>
        <Text style={[skillStyles.value, { color }]}>{value.toFixed(1)}</Text>
      </View>
      <View style={skillStyles.barBg}>
        <Animated.View style={[skillStyles.barFill, { width, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const skillStyles = StyleSheet.create({
  container: { marginBottom: 14 },
  labelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 6 },
  label: { flex: 1, fontSize: 13, fontWeight: '600', color: Colors.onSurface },
  count: { fontSize: 11 },
  value: { fontSize: 14, fontWeight: '800', fontVariant: ['tabular-nums'], width: 36, textAlign: 'right' },
  barBg: { height: 6, borderRadius: 3, backgroundColor: Colors.surfaceContainerHigh, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
});

export default function DashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { user, authSession } = useSessionStore();
  const [refreshing, setRefreshing] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const token = authSession?.access_token || null;
      const [analyticsRes, sessionsRes] = await Promise.allSettled([
        api.getAnalytics(token),
        api.getUserSessions(token),
      ]);

      if (analyticsRes.status === 'fulfilled') {
        setAnalytics(analyticsRes.value as unknown as AnalyticsData);
      }
      if (sessionsRes.status === 'fulfilled') {
        const val = sessionsRes.value as any;
        const list = val?.sessions || val;
        setRecentSessions(Array.isArray(list) ? list.slice(0, 5) : []);
      }
      if (analyticsRes.status === 'rejected') {
        throw analyticsRes.reason;
      }
    } catch (err: any) {
      console.warn('Dashboard fetch error:', err);
      setErrorMsg(err.message || 'Failed to fetch data. Is the backend running?');
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

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const userName = user?.email?.split('@')[0] || 'User';
  const displayName = userName.charAt(0).toUpperCase() + userName.slice(1);

  const noData = !analytics || analytics.improvement_status === 'no_data';

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      {/* Background orbs */}
      <View style={[styles.orb, styles.orbTopLeft]} />
      <View style={[styles.orb, styles.orbBottomRight]} />

      {/* Top App Bar */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <Image
            source={require('../assets/images/coact-logo.png')}
            style={styles.topBarLogo}
            resizeMode="contain"
          />
          <Text style={styles.topBarTitle}>CoAct.AI</Text>
        </View>
        <TouchableOpacity
          style={styles.avatarCircle}
          onPress={() => navigation.navigate('ProfileTab')}
        >
          <Ionicons name="person" size={18} color={Colors.onSurfaceVariant} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primaryContainer]}
          />
        }
      >
        {/* Greeting */}
        <View style={styles.greeting}>
          <Text style={styles.greetingTitle}>Hello, {displayName}.</Text>
          <Text style={styles.greetingSubtitle}>
            Track your learning curve and skill development.
          </Text>
        </View>

        {noData ? (
          /* Empty State */
          <GlassmorphicCard style={styles.emptyCard}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="bar-chart-outline" size={40} color={Colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No Analytics Yet</Text>
            <Text style={styles.emptyDesc}>
              Complete your first simulation to start tracking your progress and skill development.
            </Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => navigation.navigate('PracticeTab')}
            >
              <Ionicons name="sparkles" size={16} color={Colors.onPrimaryContainer} />
              <Text style={styles.emptyBtnText}>Start First Session</Text>
            </TouchableOpacity>
          </GlassmorphicCard>
        ) : (
          <>
            {/* Improvement Banner */}
            {analytics!.improvement_status === 'improving' && (
              <View style={[styles.banner, { backgroundColor: 'rgba(16, 185, 129, 0.08)', borderColor: 'rgba(16, 185, 129, 0.25)' }]}>
                <View style={[styles.bannerIcon, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                  <Ionicons name="trending-up" size={22} color={Colors.secondary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.bannerTitle, { color: Colors.secondary }]}>You're Improving! 🎉</Text>
                  <Text style={styles.bannerDesc}>Recent sessions show a positive trend. Keep it up!</Text>
                </View>
              </View>
            )}
            {analytics!.improvement_status === 'declining' && (
              <View style={[styles.banner, { backgroundColor: 'rgba(245, 158, 11, 0.08)', borderColor: 'rgba(245, 158, 11, 0.25)' }]}>
                <View style={[styles.bannerIcon, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                  <Ionicons name="alert-circle" size={22} color={Colors.tertiary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.bannerTitle, { color: Colors.tertiary }]}>Room for Growth</Text>
                  <Text style={styles.bannerDesc}>Recent scores are below average. Focus on your weakest skills!</Text>
                </View>
              </View>
            )}

            {/* Stats Cards */}
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, { borderColor: 'rgba(173, 198, 255, 0.2)' }]}>
                <View style={[styles.statIconWrap, { backgroundColor: 'rgba(173, 198, 255, 0.1)' }]}>
                  <Ionicons name="pulse-outline" size={18} color={Colors.primary} />
                </View>
                <Text style={styles.statLabel}>TOTAL SESSIONS</Text>
                <Text style={[styles.statValue, { color: Colors.primary }]}>{analytics!.session_counts?.total || 0}</Text>
              </View>
              <View style={[styles.statCard, { borderColor: 'rgba(16, 185, 129, 0.2)' }]}>
                <View style={[styles.statIconWrap, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                  <Ionicons name="ribbon-outline" size={18} color={Colors.secondary} />
                </View>
                <Text style={styles.statLabel}>ALL-TIME AVG</Text>
                <Text style={[styles.statValue, { color: analytics!.all_time_average >= 7 ? Colors.secondary : analytics!.all_time_average >= 5 ? Colors.tertiary : Colors.recordingRed }]}>
                  {analytics!.all_time_average.toFixed(1)}/10
                </Text>
              </View>
              <View style={[styles.statCard, { borderColor: 'rgba(139, 92, 246, 0.2)' }]}>
                <View style={[styles.statIconWrap, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
                  <Ionicons name="shield-checkmark-outline" size={18} color="#a855f7" />
                </View>
                <Text style={styles.statLabel}>CONSISTENCY</Text>
                <Text style={[styles.statValue, { color: '#a855f7' }]}>{analytics!.consistency_index}%</Text>
              </View>
              <View style={[styles.statCard, { borderColor: 'rgba(59, 130, 246, 0.2)' }]}>
                <View style={[styles.statIconWrap, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                  <Ionicons
                    name={analytics!.improvement_status === 'improving' ? 'trending-up' : analytics!.improvement_status === 'declining' ? 'trending-down' : 'remove-outline'}
                    size={18}
                    color={analytics!.improvement_status === 'improving' ? Colors.secondary : analytics!.improvement_status === 'declining' ? Colors.recordingRed : '#3b82f6'}
                  />
                </View>
                <Text style={styles.statLabel}>TREND</Text>
                <Text style={[styles.statValue, {
                  color: analytics!.improvement_status === 'improving' ? Colors.secondary : analytics!.improvement_status === 'declining' ? Colors.recordingRed : '#3b82f6',
                  fontSize: 16,
                }]}>
                  {analytics!.improvement_status === 'improving' ? '↑ Up' : analytics!.improvement_status === 'declining' ? '↓ Down' : '→ Stable'}
                </Text>
              </View>
            </View>

            {/* Strongest Skills */}
            {analytics!.strongest_skills?.length > 0 && (
              <GlassmorphicCard style={styles.skillsCard}>
                <View style={styles.skillsHeader}>
                  <View style={[styles.skillsIconWrap, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                    <Ionicons name="flash" size={18} color={Colors.secondary} />
                  </View>
                  <Text style={styles.skillsTitle}>STRONGEST SKILLS</Text>
                </View>
                {analytics!.strongest_skills.map((skill, i) => (
                  <SkillBar
                    key={skill.dimension}
                    label={skill.dimension}
                    value={skill.average}
                    color={Colors.secondary}
                    count={skill.count}
                    delay={i * 100}
                  />
                ))}
              </GlassmorphicCard>
            )}

            {/* Weakest Skills */}
            {analytics!.weakest_skills?.length > 0 && (
              <GlassmorphicCard style={styles.skillsCard}>
                <View style={styles.skillsHeader}>
                  <View style={[styles.skillsIconWrap, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                    <Ionicons name="fitness" size={18} color={Colors.recordingRed} />
                  </View>
                  <Text style={styles.skillsTitle}>NEEDS IMPROVEMENT</Text>
                </View>
                {analytics!.weakest_skills.map((skill, i) => (
                  <SkillBar
                    key={skill.dimension}
                    label={skill.dimension}
                    value={skill.average}
                    color={Colors.recordingRed}
                    count={skill.count}
                    delay={i * 100}
                  />
                ))}
              </GlassmorphicCard>
            )}

            {/* Scenario Mastery */}
            {analytics!.repeated_scenarios?.length > 0 && (
              <GlassmorphicCard style={styles.skillsCard}>
                <View style={styles.skillsHeader}>
                  <View style={[styles.skillsIconWrap, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
                    <Ionicons name="trophy" size={18} color="#a855f7" />
                  </View>
                  <Text style={styles.skillsTitle}>SCENARIO MASTERY</Text>
                </View>
                {analytics!.repeated_scenarios.map((s, i) => (
                  <View key={i} style={styles.masteryRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.masteryTitle} numberOfLines={1}>{s.title || 'Untitled'}</Text>
                      <Text style={styles.masteryAttempts}>{s.attempts} attempts</Text>
                    </View>
                    <View style={styles.masteryScores}>
                      <Text style={styles.masteryScoreLabel}>{s.first_score.toFixed(1)}</Text>
                      <Ionicons name="arrow-forward" size={12} color={Colors.textMuted} />
                      <Text style={styles.masteryScoreLabel}>{s.latest_score.toFixed(1)}</Text>
                      <View style={[styles.changeBadge, {
                        backgroundColor: s.change > 0 ? 'rgba(16,185,129,0.1)' : s.change < 0 ? 'rgba(239,68,68,0.1)' : 'rgba(100,116,139,0.1)',
                      }]}>
                        <Text style={[styles.changeText, {
                          color: s.change > 0 ? Colors.secondary : s.change < 0 ? Colors.recordingRed : Colors.textMuted,
                        }]}>
                          {s.change > 0 ? '+' : ''}{s.change.toFixed(1)}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </GlassmorphicCard>
            )}

            {/* Quick Actions */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.actionCard}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('PracticeTab')}
              >
                <Text style={styles.actionTitle}>Start New Session</Text>
                <Text style={styles.actionDesc}>Practice and improve</Text>
                <Ionicons name="arrow-forward" size={16} color={Colors.primary} style={{ position: 'absolute', right: 16, top: 20 }} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionCard}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('HistoryTab')}
              >
                <Text style={styles.actionTitle}>View All Sessions</Text>
                <Text style={styles.actionDesc}>Review past reports</Text>
                <Ionicons name="arrow-forward" size={16} color={Colors.primary} style={{ position: 'absolute', right: 16, top: 20 }} />
              </TouchableOpacity>
            </View>

            {/* Recent Sessions */}
            {recentSessions.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Recent Sessions</Text>
                  <TouchableOpacity onPress={() => navigation.navigate('HistoryTab')}>
                    <Text style={styles.viewAllText}>View All →</Text>
                  </TouchableOpacity>
                </View>
                {recentSessions.map((session, index) => (
                  <TouchableOpacity
                    key={session.id || session.session_id || index}
                    activeOpacity={0.7}
                    onPress={() => navigation.navigate('Report', { sessionId: session.id || session.session_id })}
                  >
                    <GlassmorphicCard style={styles.sessionCard}>
                      <View style={styles.sessionTop}>
                        <View style={[styles.modeBadge, {
                          backgroundColor: session.session_mode === 'mentorship' ? 'rgba(139,92,246,0.1)' : 'rgba(59,130,246,0.1)',
                          borderColor: session.session_mode === 'mentorship' ? 'rgba(139,92,246,0.25)' : 'rgba(59,130,246,0.25)',
                        }]}>
                          <Ionicons
                            name={session.session_mode === 'mentorship' ? 'book-outline' : 'sparkles-outline'}
                            size={12}
                            color={session.session_mode === 'mentorship' ? '#a855f7' : '#3b82f6'}
                          />
                          <Text style={[styles.modeBadgeText, {
                            color: session.session_mode === 'mentorship' ? '#a855f7' : '#3b82f6',
                          }]}>
                            {session.session_mode === 'mentorship' ? 'Mentorship' : 'Assessment'}
                          </Text>
                        </View>
                        <Text style={styles.sessionDate}>{formatDate(session.created_at)}</Text>
                      </View>
                      <Text style={styles.sessionTitle} numberOfLines={1}>
                        {session.title || session.scenario || 'Untitled Scenario'}
                      </Text>
                      <View style={styles.sessionBottom}>
                        <View style={styles.sessionRoles}>
                          <Ionicons name="person-outline" size={13} color={Colors.primary} />
                          <Text style={styles.sessionRoleText}>{session.role}</Text>
                          <Text style={styles.sessionDot}>•</Text>
                          <Ionicons name="hardware-chip-outline" size={13} color="#a855f7" />
                          <Text style={styles.sessionRoleText}>{session.ai_role}</Text>
                        </View>
                        {session.score != null && session.session_mode !== 'mentorship' && (
                          <Text style={[styles.sessionScore, {
                            color: session.score >= 7 ? Colors.secondary : session.score >= 5 ? Colors.tertiary : Colors.recordingRed,
                          }]}>
                            {Number(session.score).toFixed(1)}/10
                          </Text>
                        )}
                      </View>
                    </GlassmorphicCard>
                  </TouchableOpacity>
                ))}
              </>
            )}
          </>
        )}

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
  orb: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.08,
  },
  orbTopLeft: {
    top: -50,
    left: -50,
    backgroundColor: Colors.primaryContainer,
  },
  orbBottomRight: {
    bottom: '20%',
    right: -100,
    backgroundColor: Colors.secondary,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.containerMargin,
    paddingTop: 50,
    paddingBottom: 12,
    backgroundColor: 'rgba(29, 32, 39, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  topBarLogo: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  topBarTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: -0.8,
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceVariant,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.containerMargin,
  },
  greeting: {
    marginBottom: Spacing.lg,
  },
  greetingTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.onSurface,
    lineHeight: 32,
    marginBottom: Spacing.xs,
  },
  greetingSubtitle: {
    fontSize: 14,
    color: Colors.onSurfaceVariant,
    lineHeight: 20,
  },
  // Empty state
  emptyCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xl * 2,
    gap: Spacing.md,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  emptyDesc: {
    fontSize: 14,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: Spacing.xl,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primaryContainer,
    borderRadius: Radii.md,
  },
  emptyBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.onPrimaryContainer,
  },
  // Banner
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radii.lg,
    borderWidth: 1,
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  bannerIcon: {
    width: 44,
    height: 44,
    borderRadius: Radii.default,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  bannerDesc: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    lineHeight: 17,
  },
  // Stats grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  statCard: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    borderWidth: 1,
    gap: 6,
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radii.default,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 1.2,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  // Skills card
  skillsCard: {
    marginBottom: Spacing.lg,
  },
  skillsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  skillsIconWrap: {
    width: 32,
    height: 32,
    borderRadius: Radii.default,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skillsTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.onSurface,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  // Mastery
  masteryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.glassBorder,
  },
  masteryTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onSurface,
    marginBottom: 2,
  },
  masteryAttempts: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  masteryScores: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  masteryScoreLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onSurface,
    fontVariant: ['tabular-nums'],
  },
  changeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.sm,
  },
  changeText: {
    fontSize: 11,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  // Actions
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  actionCard: {
    flex: 1,
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.onSurface,
    marginBottom: 4,
  },
  actionDesc: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
  },
  // Recent sessions
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
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  sessionCard: {
    marginBottom: Spacing.sm,
  },
  sessionTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.sm,
    borderWidth: 1,
  },
  modeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  sessionDate: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  sessionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.onSurface,
    marginBottom: 8,
  },
  sessionBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionRoles: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  sessionRoleText: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
  },
  sessionDot: {
    fontSize: 10,
    color: Colors.glassBorder,
  },
  sessionScore: {
    fontSize: 16,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
});
