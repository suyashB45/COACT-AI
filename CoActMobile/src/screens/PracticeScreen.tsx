import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Alert,
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
import { CHARACTERS, DEFAULT_SCENARIOS, MENTORSHIP_SCENARIOS } from '../data/scenarios';

export default function PracticeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { authSession, setSession } = useSessionStore();

  const [selectedCharacter, setSelectedCharacter] = useState<string>('alex');
  const [globalMode, setGlobalMode] = useState<'assessment' | 'mentorship'>('assessment');
  const [isStartingSession, setIsStartingSession] = useState(false);
  const [startingScenarioTitle, setStartingScenarioTitle] = useState<string | null>(null);

  const activeScenarios = globalMode === 'assessment' ? DEFAULT_SCENARIOS : MENTORSHIP_SCENARIOS;

  const handleStartSession = async (scenario: any) => {
    if (isStartingSession) return;

    try {
      setIsStartingSession(true);
      setStartingScenarioTitle(scenario.title);

      const token = authSession?.access_token || null;
      let displayAiRole = scenario.ai_role;

      // Swap names dynamically for Alex/Sarah
      if (
        scenario.scenario_type === 'reflection' ||
        displayAiRole.includes('Coach Alex') ||
        displayAiRole === 'AI Coach'
      ) {
        const charName = selectedCharacter === 'sarah' ? 'Sarah' : 'Alex';
        displayAiRole = `Coach ${charName}`;
      }

      const result = await api.startSession(
        {
          role: scenario.user_role,
          ai_role: displayAiRole,
          scenario: scenario.scenario,
          scenario_type: scenario.scenario_type,
          ai_character: selectedCharacter,
          title: scenario.title,
        },
        token
      );

      // Save to store for the Conversation screen
      setSession(result.session_id, {
        role: scenario.user_role,
        ai_role: displayAiRole,
        scenario: scenario.scenario,
        difficulty: 'Standard',
      });

      navigation.navigate('Conversation', {
        sessionId: result.session_id,
        aiIntro: result.ai_intro,
      });
    } catch (err: any) {
      console.error('Failed to start session:', err);
      Alert.alert('Error', 'Failed to start session. Please try again.');
    } finally {
      setIsStartingSession(false);
      setStartingScenarioTitle(null);
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      {/* Top App Bar */}
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>Practice Arena</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>1. Select Your Partner</Text>
        <View style={styles.characterRow}>
          {CHARACTERS.map((char) => {
            const isSelected = selectedCharacter === char.id;
            return (
              <TouchableOpacity
                key={char.id}
                activeOpacity={0.8}
                onPress={() => setSelectedCharacter(char.id)}
                style={[
                  styles.characterCard,
                  isSelected && styles.characterCardSelected,
                ]}
              >
                {isSelected && (
                  <View style={styles.checkBadge}>
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  </View>
                )}
                <View style={[styles.avatarPlaceholder, isSelected && styles.avatarSelected]}>
                  {char.id === 'alex' ? (
                    <Image source={require('../assets/images/alex.png')} style={styles.characterImage} />
                  ) : char.id === 'sarah' ? (
                    <Image source={require('../assets/images/sarah.png')} style={styles.characterImage} />
                  ) : (
                    <Ionicons name="person" size={32} color={isSelected ? Colors.background : Colors.onSurfaceVariant} />
                  )}
                </View>
                <Text style={[styles.characterName, isSelected && styles.textSelected]}>{char.name}</Text>
                <Text style={styles.characterRole}>{char.role}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>2. Choose Mode</Text>
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleButton, globalMode === 'assessment' && styles.toggleButtonActive]}
            onPress={() => setGlobalMode('assessment')}
            activeOpacity={0.8}
          >
            <Text style={[styles.toggleText, globalMode === 'assessment' && styles.toggleTextActive]}>
              Assessment
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, globalMode === 'mentorship' && styles.toggleButtonActiveMentorship]}
            onPress={() => setGlobalMode('mentorship')}
            activeOpacity={0.8}
          >
            <Text style={[styles.toggleText, globalMode === 'mentorship' && styles.toggleTextActiveMentorship]}>
              Mentorship
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>3. Select Scenario</Text>
        <View style={styles.scenariosContainer}>
          {activeScenarios.map((scenario, index) => (
            <TouchableOpacity
              key={index}
              activeOpacity={0.7}
              onPress={() => handleStartSession(scenario)}
              disabled={isStartingSession}
            >
              <GlassmorphicCard style={
                isStartingSession && startingScenarioTitle === scenario.title 
                  ? { ...styles.scenarioCard, ...styles.scenarioCardLoading }
                  : styles.scenarioCard
              }>
                <View style={styles.scenarioHeader}>
                  <View style={styles.scenarioIcon}>
                    <Ionicons name={scenario.icon as any} size={20} color={Colors.primary} />
                  </View>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {globalMode === 'assessment' ? 'SIMULATION' : 'MENTORSHIP'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.scenarioTitle}>{scenario.title}</Text>
                
                <View style={styles.roleContainer}>
                  <View style={styles.roleRow}>
                    <Text style={styles.roleLabel}>YOUR ROLE:</Text>
                    <Text style={styles.roleValue}>{scenario.user_role}</Text>
                  </View>
                  <View style={styles.roleRow}>
                    <Text style={styles.roleLabel}>PARTNER:</Text>
                    <Text style={[styles.roleValue, { color: Colors.primary }]}>{scenario.ai_role}</Text>
                  </View>
                </View>

                {isStartingSession && startingScenarioTitle === scenario.title ? (
                  <View style={styles.loadingOverlay}>
                    <ActivityIndicator color={Colors.primary} size="small" />
                    <Text style={styles.loadingText}>Starting...</Text>
                  </View>
                ) : null}
              </GlassmorphicCard>
            </TouchableOpacity>
          ))}
        </View>
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
  topBar: {
    paddingHorizontal: Spacing.containerMargin,
    paddingTop: 50,
    paddingBottom: 12,
    backgroundColor: 'rgba(29, 32, 39, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  topBarTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: -0.8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.containerMargin,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.onSurface,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  characterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  characterCard: {
    flex: 1,
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  characterCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(59,130,246,0.1)',
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  characterImage: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
  },
  avatarSelected: {
    backgroundColor: Colors.primary,
  },
  characterName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
  },
  textSelected: {
    color: Colors.onSurface,
  },
  characterRole: {
    fontSize: 11,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  checkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: Radii.full,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: Radii.full,
  },
  toggleButtonActive: {
    backgroundColor: 'rgba(59,130,246,0.15)',
  },
  toggleButtonActiveMentorship: {
    backgroundColor: 'rgba(16,185,129,0.15)',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.onSurfaceVariant,
  },
  toggleTextActive: {
    color: Colors.primary,
  },
  toggleTextActiveMentorship: {
    color: '#10B981', // emerald-500
  },
  scenariosContainer: {
    gap: Spacing.md,
  },
  scenarioCard: {
    padding: Spacing.lg,
  },
  scenarioCardLoading: {
    opacity: 0.7,
  },
  scenarioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  scenarioIcon: {
    width: 40,
    height: 40,
    borderRadius: Radii.md,
    backgroundColor: Colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(59,130,246,0.15)',
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.3)',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
  },
  scenarioTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.onSurface,
    marginBottom: Spacing.md,
  },
  roleContainer: {
    gap: 8,
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
    width: 80,
  },
  roleValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  loadingOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(11, 14, 21, 0.8)',
    borderRadius: Radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  loadingText: {
    color: Colors.primary,
    fontWeight: '600',
  },
});
