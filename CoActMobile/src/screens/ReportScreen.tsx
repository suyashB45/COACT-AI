/**
 * ReportScreen — Comprehensive post-session analysis matching the web app.
 * Shows score, summary, scorecard bars, coaching style, behavior analysis,
 * EQ insights, strengths/improvements, and action plan.
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Linking,
  StatusBar,
  Animated,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../theme/colors';
import { Spacing, Radii } from '../theme/styles';
import { GlassmorphicCard } from '../components/GlassmorphicCard';
import { api } from '../lib/api';
import { useSessionStore } from '../stores/useSessionStore';

// Animated bar for scorecard
function ScoreBar({ label, score, delay = 0 }: { label: string; score: number; delay?: number }) {
  const animWidth = useState(new Animated.Value(0))[0];

  useEffect(() => {
    Animated.timing(animWidth, {
      toValue: (score / 10) * 100,
      duration: 800,
      delay,
      useNativeDriver: false,
    }).start();
  }, [score]);

  const width = animWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  const color = score >= 8 ? Colors.secondary : score >= 5 ? Colors.tertiary : Colors.recordingRed;

  return (
    <View style={barStyles.container}>
      <View style={barStyles.labelRow}>
        <Text style={barStyles.label} numberOfLines={1}>{label}</Text>
        <Text style={[barStyles.score, { color }]}>{score}/10</Text>
      </View>
      <View style={barStyles.track}>
        <Animated.View style={[barStyles.fill, { width, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const barStyles = StyleSheet.create({
  container: { marginBottom: 16 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.onSurface, flex: 1, marginRight: 8 },
  score: { fontSize: 14, fontWeight: '800', fontVariant: ['tabular-nums'] },
  track: { height: 6, borderRadius: 3, backgroundColor: Colors.surfaceContainerHigh, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
});

export default function ReportScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { sessionId } = route.params;
  const { authSession, clearSession } = useSessionStore();

  const [loading, setLoading] = useState(true);
  const [rawData, setRawData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const token = authSession?.access_token || null;
        const data = await api.getReportData(sessionId, token);
        setRawData(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load report');
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [sessionId, authSession]);

  const handleDownloadPdf = () => {
    const url = api.getReportUrl(sessionId);
    Linking.openURL(url).catch((err) => console.error("Couldn't load page", err));
  };

  const handlePracticeAgain = () => {
    clearSession();
    navigation.navigate('MainTabs');
  };

  if (loading) {
    return (
      <View style={[styles.screen, styles.center]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Analyzing session...</Text>
      </View>
    );
  }

  if (error || !rawData) {
    return (
      <View style={[styles.screen, styles.center]}>
        <Ionicons name="alert-circle-outline" size={48} color={Colors.error} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.button} onPress={handlePracticeAgain}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // --- Parse the data ---
  const meta = rawData?.meta || {};
  const execSummary = rawData?.executive_summary || {};
  const isMentorship = meta.session_mode === 'mentorship'
    || rawData?.type === 'mentorship_report'
    || String(meta.scenario_type || '').toLowerCase().includes('mentorship');
  const gradeStr = meta.overall_grade || execSummary.final_score || '0/10';
  const scoreParts = gradeStr.split('/');
  const scoreNum = parseFloat(scoreParts[0]) || 0;
  const scorePercent = scoreNum <= 10 ? scoreNum * 10 : scoreNum;

  const summary = meta.summary || execSummary.snapshot || 'Session completed.';
  const coachingStyle = rawData?.coaching_style;
  const scorecard: any[] = Array.isArray(rawData?.scorecard) ? rawData.scorecard : [];
  const behaviours: any[] = Array.isArray(rawData?.behaviour_analysis) ? rawData.behaviour_analysis : [];
  const eqAnalysis: any[] = Array.isArray(rawData?.eq_analysis) ? rawData.eq_analysis : [];
  const strengthsAndImprovements = rawData?.strengths_and_improvements || {};
  const actionPlan = rawData?.action_plan || {};
  const turningPoints: any[] = Array.isArray(rawData?.turning_points) ? rawData.turning_points : [];
  const characterAssessment = rawData?.character_assessment || {};
  const finalEval = rawData?.final_evaluation || {};

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.surfaceContainerLowest} />
      <View style={[styles.bgGlow, styles.bgGlowTop]} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={handlePracticeAgain}>
          <Ionicons name="arrow-back" size={24} color={Colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Session Report</Text>
        <TouchableOpacity onPress={handleDownloadPdf}>
          <Ionicons name="download-outline" size={22} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Hero Card (numeric score hidden for mentorship) */}
        <GlassmorphicCard style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroTitle}>{isMentorship ? 'Mentorship Report' : 'Performance Score'}</Text>
              <Text style={styles.heroSubtitle}>{isMentorship ? 'Qualitative Development Summary' : 'Overall Evaluation'}</Text>
            </View>
            {!isMentorship && (
              <View style={[styles.scoreCircle, {
                borderColor: scoreNum >= 7 ? Colors.secondary : scoreNum >= 5 ? Colors.tertiary : Colors.recordingRed,
              }]}>
                <Text style={[styles.scoreNumber, {
                  color: scoreNum >= 7 ? Colors.secondary : scoreNum >= 5 ? Colors.tertiary : Colors.recordingRed,
                }]}>{scorePercent}%</Text>
              </View>
            )}
          </View>
          <View style={styles.divider} />
          <Text style={styles.summaryText}>{summary}</Text>
        </GlassmorphicCard>

        {/* Coaching Style */}
        {coachingStyle && (
          <GlassmorphicCard style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="compass-outline" size={20} color="#a855f7" />
              <Text style={styles.sectionCardTitle}>Coaching Style</Text>
            </View>
            <View style={styles.styleBadge}>
              <Text style={styles.styleBadgeText}>{coachingStyle.primary_style || 'N/A'}</Text>
            </View>
            {coachingStyle.description && (
              <Text style={styles.styleDesc}>{coachingStyle.description}</Text>
            )}
          </GlassmorphicCard>
        )}

        {/* Scorecard */}
        {scorecard.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Scorecard</Text>
            <GlassmorphicCard style={{ marginBottom: Spacing.lg }}>
              {scorecard.map((item: any, index: number) => {
                const dimScore = parseFloat(String(item.score).split('/')[0]) || 0;
                return (
                  <View key={index}>
                    <ScoreBar label={item.dimension} score={dimScore} delay={index * 100} />
                    {item.reasoning && (
                      <Text style={styles.reasoningText}>{item.reasoning}</Text>
                    )}
                  </View>
                );
              })}
            </GlassmorphicCard>
          </>
        )}

        {/* Behaviour Analysis */}
        {behaviours.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Behavioral Analysis</Text>
            {behaviours.map((b: any, i: number) => (
              <GlassmorphicCard key={i} style={styles.behaviourCard}>
                <View style={styles.behaviourHeader}>
                  <Ionicons
                    name={String(b.impact).toLowerCase() === 'negative' ? 'close-circle' : 'checkmark-circle'}
                    size={18}
                    color={String(b.impact).toLowerCase() === 'negative' ? Colors.recordingRed : Colors.secondary}
                  />
                  <Text style={styles.behaviourTitle}>{b.behavior}</Text>
                </View>
                {b.quote && (
                  <Text style={styles.quoteText}>"{b.quote}"</Text>
                )}
                <Text style={styles.insightText}>{b.insight}</Text>
                {b.improved_approach && (
                  <View style={styles.improvedBox}>
                    <Text style={styles.improvedLabel}>💡 Better approach:</Text>
                    <Text style={styles.improvedText}>{b.improved_approach}</Text>
                  </View>
                )}
              </GlassmorphicCard>
            ))}
          </>
        )}

        {/* EQ Analysis */}
        {eqAnalysis.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Emotional Intelligence</Text>
            {eqAnalysis.map((eq: any, i: number) => (
              <GlassmorphicCard key={i} style={styles.eqCard}>
                <Text style={styles.eqNuance}>{eq.nuance}</Text>
                <Text style={styles.eqObservation}>{eq.observation}</Text>
                {eq.suggestion && (
                  <View style={styles.eqSuggestionBox}>
                    <Text style={styles.eqSuggestionLabel}>SUGGESTION</Text>
                    <Text style={styles.eqSuggestion}>{eq.suggestion}</Text>
                  </View>
                )}
              </GlassmorphicCard>
            ))}
          </>
        )}

        {/* Turning Points */}
        {turningPoints.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Turning Points</Text>
            <GlassmorphicCard style={{ marginBottom: Spacing.lg }}>
              {turningPoints.map((tp: any, i: number) => (
                <View key={i} style={styles.tpRow}>
                  <View style={styles.tpDot} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.tpText}>{tp.point}</Text>
                    {tp.timestamp && <Text style={styles.tpTimestamp}>{tp.timestamp}</Text>}
                  </View>
                </View>
              ))}
            </GlassmorphicCard>
          </>
        )}

        {/* Strengths & Improvements */}
        {(strengthsAndImprovements.strengths?.length > 0 || strengthsAndImprovements.missed_opportunities?.length > 0) && (
          <View style={styles.twoColRow}>
            {strengthsAndImprovements.strengths?.length > 0 && (
              <GlassmorphicCard style={{...styles.halfCard, borderColor: 'rgba(16,185,129,0.15)'}}>
                <Text style={[styles.halfCardTitle, { color: Colors.secondary }]}>✅ Strengths</Text>
                {strengthsAndImprovements.strengths.map((s: string, i: number) => (
                  <Text key={i} style={styles.bulletText}>• {s}</Text>
                ))}
              </GlassmorphicCard>
            )}
            {strengthsAndImprovements.missed_opportunities?.length > 0 && (
              <GlassmorphicCard style={{...styles.halfCard, borderColor: 'rgba(245,158,11,0.15)'}}>
                <Text style={[styles.halfCardTitle, { color: Colors.tertiary }]}>⚠️ Missed</Text>
                {strengthsAndImprovements.missed_opportunities.map((m: string, i: number) => (
                  <Text key={i} style={styles.bulletText}>• {m}</Text>
                ))}
              </GlassmorphicCard>
            )}
          </View>
        )}

        {/* Action Plan */}
        {actionPlan.specific_actions?.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Action Plan</Text>
            <GlassmorphicCard style={{ marginBottom: Spacing.lg }}>
              {actionPlan.timeline && (
                <View style={styles.timelineBadge}>
                  <Ionicons name="time-outline" size={14} color={Colors.primary} />
                  <Text style={styles.timelineText}>{actionPlan.timeline}</Text>
                </View>
              )}
              {actionPlan.specific_actions.map((action: string, i: number) => (
                <View key={i} style={styles.actionRow}>
                  <View style={styles.actionDot} />
                  <Text style={styles.actionText}>{action}</Text>
                </View>
              ))}
            </GlassmorphicCard>
          </>
        )}

        {/* Final Evaluation */}
        {finalEval.readiness_level && (
          <GlassmorphicCard style={styles.finalCard}>
            <Text style={styles.finalTitle}>Final Evaluation</Text>
            <View style={styles.finalRow}>
              <Text style={styles.finalLabel}>Readiness</Text>
              <Text style={styles.finalValue}>{finalEval.readiness_level}</Text>
            </View>
            {finalEval.maturity_rating && (
              <View style={styles.finalRow}>
                <Text style={styles.finalLabel}>Maturity</Text>
                <Text style={styles.finalValue}>{finalEval.maturity_rating}</Text>
              </View>
            )}
            {finalEval.long_term_suggestion && (
              <Text style={styles.finalSuggestion}>{finalEval.long_term_suggestion}</Text>
            )}
          </GlassmorphicCard>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.primaryBtn} onPress={handlePracticeAgain}>
            <Text style={styles.primaryBtnText}>Practice Again</Text>
            <Ionicons name="refresh" size={20} color={Colors.onPrimaryContainer} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={handleDownloadPdf}>
            <Ionicons name="document-text-outline" size={20} color={Colors.primary} />
            <Text style={styles.secondaryBtnText}>Download PDF Report</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.surfaceContainerLowest },
  center: { alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  bgGlow: { position: 'absolute', width: 300, height: 300, borderRadius: 150, opacity: 0.1 },
  bgGlowTop: { top: -100, right: -50, backgroundColor: Colors.secondary },
  loadingText: { marginTop: Spacing.md, fontSize: 16, color: Colors.onSurfaceVariant },
  errorText: { marginTop: Spacing.md, fontSize: 16, color: Colors.error, textAlign: 'center', marginBottom: Spacing.lg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.containerMargin, paddingTop: 50, paddingBottom: Spacing.sm,
    backgroundColor: 'rgba(11, 14, 21, 0.8)',
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: Colors.onSurface },
  content: { padding: Spacing.containerMargin },
  heroCard: { marginBottom: Spacing.xl },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  heroTitle: { fontSize: 18, fontWeight: '600', color: Colors.white, marginBottom: 4 },
  heroSubtitle: { fontSize: 13, color: Colors.onSurfaceVariant },
  scoreCircle: {
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: 'rgba(78, 222, 163, 0.08)',
    borderWidth: 2.5, alignItems: 'center', justifyContent: 'center',
  },
  scoreNumber: { fontSize: 20, fontWeight: '800' },
  divider: { height: 1, backgroundColor: Colors.outlineVariant, opacity: 0.3, marginBottom: Spacing.md },
  summaryText: { fontSize: 14, lineHeight: 22, color: Colors.onSurface },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.onSurface, marginBottom: Spacing.md, marginTop: Spacing.xs },
  // Coaching style
  sectionCard: { marginBottom: Spacing.lg },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Spacing.md },
  sectionCardTitle: { fontSize: 16, fontWeight: '700', color: Colors.onSurface },
  styleBadge: {
    alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 6,
    backgroundColor: 'rgba(139, 92, 246, 0.12)', borderRadius: Radii.full,
    borderWidth: 1, borderColor: 'rgba(139, 92, 246, 0.3)', marginBottom: 10,
  },
  styleBadgeText: { fontSize: 13, fontWeight: '700', color: '#a855f7' },
  styleDesc: { fontSize: 13, lineHeight: 20, color: Colors.onSurfaceVariant },
  reasoningText: { fontSize: 12, lineHeight: 18, color: Colors.textMuted, marginTop: -8, marginBottom: 12 },
  // Behaviour
  behaviourCard: { marginBottom: Spacing.sm },
  behaviourHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  behaviourTitle: { fontSize: 14, fontWeight: '700', color: Colors.onSurface, flex: 1 },
  quoteText: { fontSize: 13, fontStyle: 'italic', color: Colors.onSurfaceVariant, marginBottom: 8, paddingLeft: 10, borderLeftWidth: 2, borderLeftColor: Colors.primary },
  insightText: { fontSize: 13, lineHeight: 19, color: Colors.onSurfaceVariant },
  improvedBox: { marginTop: 10, padding: 10, backgroundColor: 'rgba(16,185,129,0.06)', borderRadius: Radii.default, borderWidth: 1, borderColor: 'rgba(16,185,129,0.15)' },
  improvedLabel: { fontSize: 11, fontWeight: '700', color: Colors.secondary, marginBottom: 4 },
  improvedText: { fontSize: 12, lineHeight: 18, color: Colors.onSurfaceVariant },
  // EQ
  eqCard: { marginBottom: Spacing.sm },
  eqNuance: { fontSize: 13, fontWeight: '800', color: '#a855f7', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  eqObservation: { fontSize: 13, lineHeight: 19, color: Colors.onSurfaceVariant, marginBottom: 8 },
  eqSuggestionBox: { padding: 10, backgroundColor: 'rgba(100,116,139,0.06)', borderRadius: Radii.default },
  eqSuggestionLabel: { fontSize: 10, fontWeight: '800', color: Colors.textMuted, letterSpacing: 1, marginBottom: 4 },
  eqSuggestion: { fontSize: 12, lineHeight: 18, color: Colors.onSurfaceVariant },
  // Turning points
  tpRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
  tpDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary, marginTop: 5 },
  tpText: { fontSize: 13, lineHeight: 19, color: Colors.onSurface },
  tpTimestamp: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  // Strengths/Improvements
  twoColRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  halfCard: { flex: 1, borderWidth: 1 },
  halfCardTitle: { fontSize: 14, fontWeight: '700', marginBottom: 8 },
  bulletText: { fontSize: 12, lineHeight: 18, color: Colors.onSurfaceVariant, marginBottom: 4 },
  // Action plan
  timelineBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12, paddingVertical: 4, paddingHorizontal: 10, backgroundColor: 'rgba(173,198,255,0.08)', borderRadius: Radii.full, alignSelf: 'flex-start' },
  timelineText: { fontSize: 12, fontWeight: '600', color: Colors.primary },
  actionRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  actionDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.secondary, marginTop: 6 },
  actionText: { fontSize: 13, lineHeight: 19, color: Colors.onSurface, flex: 1 },
  // Final eval
  finalCard: { marginBottom: Spacing.lg },
  finalTitle: { fontSize: 16, fontWeight: '700', color: Colors.onSurface, marginBottom: 12 },
  finalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  finalLabel: { fontSize: 13, color: Colors.textMuted, fontWeight: '600' },
  finalValue: { fontSize: 13, fontWeight: '700', color: Colors.onSurface },
  finalSuggestion: { fontSize: 13, lineHeight: 19, color: Colors.onSurfaceVariant, marginTop: 8, fontStyle: 'italic' },
  // Buttons
  actionsContainer: { gap: Spacing.sm },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.primaryContainer, borderRadius: Radii.md,
    paddingVertical: Spacing.md, gap: Spacing.xs,
  },
  primaryBtnText: { fontSize: 16, fontWeight: '600', color: Colors.onPrimaryContainer },
  secondaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.transparent, borderRadius: Radii.md,
    paddingVertical: Spacing.md, borderWidth: 1, borderColor: Colors.glassBorderLight, gap: Spacing.xs,
  },
  secondaryBtnText: { fontSize: 16, fontWeight: '600', color: Colors.primary },
  button: { marginTop: Spacing.lg, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, backgroundColor: Colors.primaryContainer, borderRadius: Radii.md },
  buttonText: { fontSize: 16, fontWeight: '600', color: Colors.onPrimaryContainer },
});
