/**
 * Scenario catalog tests.
 * Verifies the mobile scenario data stays in sync with the CoAct web app's
 * Practice page (same titles, structured simulation_ids, coaching/mentorship pairing).
 */
import { DEFAULT_SCENARIOS, MENTORSHIP_SCENARIOS, CHARACTERS } from '../src/data/scenarios';

const REQUIRED_FIELDS = ['title', 'description', 'ai_role', 'user_role', 'scenario', 'mode', 'scenario_type', 'session_mode', 'simulation_id'] as const;

describe('DEFAULT_SCENARIOS (Coaching)', () => {
  it('has 10 coaching scenarios matching the web app', () => {
    expect(DEFAULT_SCENARIOS).toHaveLength(10);
  });

  it('every scenario has all required fields', () => {
    for (const s of DEFAULT_SCENARIOS) {
      for (const field of REQUIRED_FIELDS) {
        expect(s).toHaveProperty(field);
        expect(typeof s[field]).not.toBe('undefined');
      }
    }
  });

  it('uses coaching_sim scenario_type with SIM simulation ids', () => {
    for (const s of DEFAULT_SCENARIOS) {
      expect(s.scenario_type).toBe('coaching_sim');
      expect(s.simulation_id).toMatch(/^SIM-/);
    }
  });

  it('has unique titles and simulation ids', () => {
    const titles = new Set(DEFAULT_SCENARIOS.map((s) => s.title));
    const ids = new Set(DEFAULT_SCENARIOS.map((s) => s.simulation_id));
    expect(titles.size).toBe(DEFAULT_SCENARIOS.length);
    expect(ids.size).toBe(DEFAULT_SCENARIOS.length);
  });

  it('includes an icon for each scenario', () => {
    for (const s of DEFAULT_SCENARIOS) {
      expect(typeof s.icon).toBe('string');
      expect(String(s.icon).length).toBeGreaterThan(0);
    }
  });
});

describe('MENTORSHIP_SCENARIOS (Mentorship)', () => {
  it('has 10 mentorship scenarios matching the web app', () => {
    expect(MENTORSHIP_SCENARIOS).toHaveLength(10);
  });

  it('every scenario has all required fields', () => {
    for (const s of MENTORSHIP_SCENARIOS) {
      for (const field of REQUIRED_FIELDS) {
        expect(s).toHaveProperty(field);
        expect(typeof s[field]).not.toBe('undefined');
      }
    }
  });

  it('uses mentorship_sim scenario_type with MENT simulation ids', () => {
    for (const s of MENTORSHIP_SCENARIOS) {
      expect(s.scenario_type).toBe('mentorship_sim');
      expect(s.simulation_id).toMatch(/^MENT-/);
    }
  });

  it('has unique titles and simulation ids', () => {
    const titles = new Set(MENTORSHIP_SCENARIOS.map((s) => s.title));
    const ids = new Set(MENTORSHIP_SCENARIOS.map((s) => s.simulation_id));
    expect(titles.size).toBe(MENTORSHIP_SCENARIOS.length);
    expect(ids.size).toBe(MENTORSHIP_SCENARIOS.length);
  });
});

describe('Coaching <-> Mentorship pairing', () => {
  it('pairs each coaching simulation with a mentorship counterpart', () => {
    const coachingIds = DEFAULT_SCENARIOS.map((s) => s.simulation_id.replace('SIM-', ''));
    const mentorshipIds = MENTORSHIP_SCENARIOS.map((s) => s.simulation_id.replace('MENT-', ''));
    expect(mentorshipIds.sort()).toEqual(coachingIds.sort());
  });
});

describe('CHARACTERS', () => {
  it('exposes the Alex and Sarah coaches', () => {
    expect(CHARACTERS.map((c) => c.id)).toEqual(['alex', 'sarah']);
    expect(CHARACTERS[0]).toHaveProperty('name', 'Alex');
    expect(CHARACTERS[1]).toHaveProperty('name', 'Sarah');
  });
});
