/**
 * CoAct.AI Mobile — Scenario Catalog
 * Mirrors the scenario data used by the CoAct web app (Practice page).
 * Each scenario is driven by a structured simulation_id that the backend
 * recognizes, so the same scenarios behave identically on both platforms.
 */

export const CHARACTERS = [
  {
    id: 'alex',
    name: 'Alex',
    role: 'Senior AI Coach',
    desc: 'Fully adaptive roleplay partner. Shifts dynamically between evaluation and mentorship.',
    color: 'blue',
  },
  {
    id: 'sarah',
    name: 'Sarah',
    role: 'Senior AI Coach',
    desc: 'Fully adaptive roleplay partner. Shifts dynamically between evaluation and mentorship.',
    color: 'purple',
  },
];

export const DEFAULT_SCENARIOS = [
  {
    title: 'Good Attitude, Poor Results',
    description: 'Coach a sincere employee who keeps missing targets. Improve performance without demotivating the employee.',
    ai_role: 'Sales Associate',
    user_role: 'Store Manager',
    scenario:
      'The employee is sincere and well-liked, but their results have been consistently below target for the last 3 months. You need to coach them to understand the gap, identify root causes, and agree on a clear improvement plan.\n\nYOUR OBJECTIVES:\n1. Create a safe, respectful tone\n2. Use facts to discuss the performance gap\n3. Explore reasons behind the gap\n4. Agree on 2-3 actions and a follow-up plan',
    icon: 'people-outline',
    mode: 'evaluation',
    scenario_type: 'coaching_sim',
    session_mode: 'skill_assessment',
    simulation_id: 'SIM-01-PERF-001',
  },
  {
    title: 'High Performer, Toxic Attitude',
    description: 'Address behavior issues with a top performer without losing performance momentum.',
    ai_role: 'Top Sales Performer',
    user_role: 'Team Leader',
    scenario:
      'The employee is a top performer whose sales numbers consistently exceed target. However, multiple team members report they are sarcastic, dismissive, and undermine colleagues in front of customers. You must address the behavior without losing performance momentum.\n\nYOUR OBJECTIVES:\n1. Maintain psychological safety\n2. Address behavior clearly using examples\n3. Separate performance from behavior\n4. Create ownership and behavior shift commitment',
    icon: 'warning-outline',
    mode: 'evaluation',
    scenario_type: 'coaching_sim',
    session_mode: 'skill_assessment',
    simulation_id: 'SIM-02-BEH-001',
  },
  {
    title: 'The Silent Disengagement',
    description: 'Re-engage a once-dependable team member who has shown a decline in initiative.',
    ai_role: 'Disengaged Team Member',
    user_role: 'Manager',
    scenario:
      'The team member was once dependable, but over the last 6-8 weeks, their energy has dropped. They complete tasks but show no initiative and avoid extra responsibilities. There are no performance complaints—just a decline in engagement.\n\nYOUR OBJECTIVES:\n1. Create psychological safety\n2. Explore underlying causes without assumptions\n3. Avoid an accusatory tone\n4. Help the team member reconnect to purpose or ownership',
    icon: 'people-outline',
    mode: 'evaluation',
    scenario_type: 'coaching_sim',
    session_mode: 'skill_assessment',
    simulation_id: 'SIM-03-MOT-001',
  },
  {
    title: 'Pushing Back Upwards',
    description: 'Communicate concerns about unrealistic targets to a Regional Director professionally.',
    ai_role: 'Regional Director',
    user_role: 'Sales Manager',
    scenario:
      'Your Regional Director set a new quarterly sales target 35% higher than last quarter, which you believe is unrealistic due to staffing, market, and inventory constraints. You need to communicate concerns without appearing resistant or negative.\n\nYOUR OBJECTIVES:\n1. Remain professional and composed\n2. Use data to support your position\n3. Avoid an emotional or defensive tone\n4. Offer alternative solutions',
    icon: 'person-circle-outline',
    mode: 'evaluation',
    scenario_type: 'coaching_sim',
    session_mode: 'skill_assessment',
    simulation_id: 'SIM-04-COM-001',
  },
  {
    title: 'Two Team Members, One Growing Conflict',
    description: 'Resolve visible tension and breakdown in communication between two team members.',
    ai_role: 'Conflicted Team Members',
    user_role: 'Team Manager',
    scenario:
      'Two team members\' communication has broken down; each claims the other is causing delays and mistakes. Tension is now visible to other team members, and you have called both into a joint meeting to resolve it.\n\nYOUR OBJECTIVES:\n1. Establish neutrality\n2. Prevent blame escalation\n3. Identify the root cause\n4. Create a practical working agreement',
    icon: 'people-outline',
    mode: 'evaluation',
    scenario_type: 'coaching_sim',
    session_mode: 'skill_assessment',
    simulation_id: 'SIM-05-CON-001',
  },
  {
    title: 'The Escalating Client',
    description: 'Manage a frustrated key client threatening to escalate a delivery issue.',
    ai_role: 'Frustrated Key Client',
    user_role: 'Account Manager',
    scenario:
      'A key client is frustrated over a delivery issue and believes your team failed to meet expectations. They are threatening to escalate to senior leadership and reconsider future business.\n\nYOUR OBJECTIVES:\n1. Stay composed under pressure\n2. Acknowledge concerns without over-admitting liability\n3. Clarify facts\n4. Offer a structured path forward',
    icon: 'cart-outline',
    mode: 'evaluation',
    scenario_type: 'coaching_sim',
    session_mode: 'skill_assessment',
    simulation_id: 'SIM-06-CUST-001',
  },
  {
    title: 'The Overloaded Manager',
    description: 'Address a pattern of poor ownership with a capable team member.',
    ai_role: 'Team Member',
    user_role: 'Manager',
    scenario:
      'You are overwhelmed as critical tasks often end up back on your desk because a capable team member rarely takes full ownership. You need to address this pattern and redistribute responsibility.\n\nYOUR OBJECTIVES:\n1. Clarify expectations\n2. Avoid blame\n3. Define ownership boundaries\n4. Establish an accountability structure',
    icon: 'school-outline',
    mode: 'evaluation',
    scenario_type: 'coaching_sim',
    session_mode: 'skill_assessment',
    simulation_id: 'SIM-07-LEAD-001',
  },
  {
    title: 'Resistance to the New System',
    description: 'Understand and manage subtle resistance to organizational change.',
    ai_role: 'Experienced Team Member',
    user_role: 'Team Lead',
    scenario:
      'An experienced team member is subtly resisting a new organizational system, frequently calling it unnecessary. Their attitude is beginning to influence others.\n\nYOUR OBJECTIVES:\n1. Avoid confrontation\n2. Understand resistance drivers\n3. Reinforce the purpose of the change\n4. Encourage ownership in adaptation',
    icon: 'warning-outline',
    mode: 'evaluation',
    scenario_type: 'coaching_sim',
    session_mode: 'skill_assessment',
    simulation_id: 'SIM-08-CHG-001',
  },
  {
    title: 'Why Didn\'t I Get Promoted?',
    description: 'Provide developmental feedback to a high performer not selected for promotion.',
    ai_role: 'High Performer',
    user_role: 'Manager',
    scenario:
      'A high performer applied for a promotion but was not selected. They have requested a meeting to understand why they were not chosen.\n\nYOUR OBJECTIVES:\n1. Acknowledge the emotional impact\n2. Provide specific developmental feedback\n3. Avoid vague generalizations\n4. Offer a forward-looking growth plan',
    icon: 'school-outline',
    mode: 'evaluation',
    scenario_type: 'coaching_sim',
    session_mode: 'skill_assessment',
    simulation_id: 'SIM-09-CAR-001',
  },
  {
    title: 'Burnout Behind the Smile',
    description: 'Sustainably explore signs of exhaustion and burnout with a high performer.',
    ai_role: 'Exhausted Performer',
    user_role: 'Manager',
    scenario:
      'The employee remains high-performing, but you have noticed signs of exhaustion, such as shorter responses and avoiding extra tasks. You suspect early signs of burnout.\n\nYOUR OBJECTIVES:\n1. Observe without accusing\n2. Create psychological safety\n3. Explore wellbeing sensitively\n4. Protect sustainable performance',
    icon: 'people-outline',
    mode: 'evaluation',
    scenario_type: 'coaching_sim',
    session_mode: 'skill_assessment',
    simulation_id: 'SIM-10-WELL-001',
  },
];

export const MENTORSHIP_SCENARIOS = [
  {
    title: 'Observing Performance Coaching',
    description: 'Play the role of an underperforming Sales Associate. Observe how the AI Store Manager effectively coaches you.',
    ai_role: 'Store Manager',
    user_role: 'Sales Associate',
    scenario:
      'CONTEXT: You are a sincere employee but you have consistently missed your sales targets for 3 months.\n\nYOUR OBJECTIVES:\n1. Blame external factors for poor sales initially\n2. Open up about your lack of confidence only if asked good diagnostic questions\n3. Observe how the AI Manager uses facts and empathy to discuss the performance gap\n4. Notice how a clear improvement plan is co-created',
    icon: 'people-outline',
    mode: 'evaluation',
    scenario_type: 'mentorship_sim',
    session_mode: 'skill_assessment',
    simulation_id: 'MENT-01-PERF-001',
  },
  {
    title: 'Observing Behavioral Feedback',
    description: 'Play the role of a top performer with a toxic attitude. Observe how the AI Team Leader addresses your behavior.',
    ai_role: 'Team Leader',
    user_role: 'Top Sales Performer',
    scenario:
      'CONTEXT: Your sales numbers exceed targets, but you are often sarcastic and dismissive of teammates. You are in a meeting with your Team Leader.\n\nYOUR OBJECTIVES:\n1. Be dismissive of the feedback and point to your high sales numbers\n2. Show frustration at your slower team members\n3. Observe how the AI Team Leader separates performance from behavior\n4. Notice the techniques used to create ownership of team culture',
    icon: 'warning-outline',
    mode: 'evaluation',
    scenario_type: 'mentorship_sim',
    session_mode: 'skill_assessment',
    simulation_id: 'MENT-02-BEH-001',
  },
  {
    title: 'Observing Re-engagement',
    description: 'Play the role of a once-dependable but now disengaged employee. Observe how the AI Manager rebuilds your engagement.',
    ai_role: 'Manager',
    user_role: 'Disengaged Team Member',
    scenario:
      'CONTEXT: Over the last 6-8 weeks, your energy has dropped. You do the bare minimum and avoid extra responsibilities.\n\nYOUR OBJECTIVES:\n1. Show a lack of initiative and give minimal responses\n2. Act disinterested but not actively hostile\n3. Observe how the AI Manager explores underlying causes without assumptions\n4. Notice how the AI helps reconnect you to purpose or ownership',
    icon: 'people-outline',
    mode: 'evaluation',
    scenario_type: 'mentorship_sim',
    session_mode: 'skill_assessment',
    simulation_id: 'MENT-03-MOT-001',
  },
  {
    title: 'Observing Upward Pushback',
    description: 'Play the Regional Director handing down impossible targets. Observe how the AI Sales Manager professionally pushes back.',
    ai_role: 'Sales Manager',
    user_role: 'Regional Director',
    scenario:
      'CONTEXT: You are the Regional Director and have just handed the AI (Sales Manager) a 35% target increase. You expect them to just accept it. \n\nYOUR OBJECTIVES:\n1. Demand they hit the new targets\n2. Be skeptical of excuses\n3. Observe how the AI uses data and professionalism to push back\n4. Learn how to effectively manage upwards from the AI\'s approach',
    icon: 'person-circle-outline',
    mode: 'evaluation',
    scenario_type: 'mentorship_sim',
    session_mode: 'skill_assessment',
    simulation_id: 'MENT-04-COM-001',
  },
  {
    title: 'Observing Conflict Resolution',
    description: 'Play the role of a frustrated team member in a conflict. Observe how the AI Manager neutralizes blame and mediates.',
    ai_role: 'Team Manager',
    user_role: 'Conflicted Team Member',
    scenario:
      'CONTEXT: You are in a conflict with a colleague and blame them for delays. You are in a mediation meeting led by the AI Manager.\n\nYOUR OBJECTIVES:\n1. Express frustration with your colleague\n2. React defensively if you feel attacked\n3. Observe how the AI Manager establishes neutrality and identifies root causes\n4. Notice the techniques used to guide you toward a working agreement',
    icon: 'people-outline',
    mode: 'evaluation',
    scenario_type: 'mentorship_sim',
    session_mode: 'skill_assessment',
    simulation_id: 'MENT-05-CON-001',
  },
  {
    title: 'Observing Client De-escalation',
    description: 'Play the role of a furious client demanding answers. Observe how the AI Account Manager de-escalates and recovers trust.',
    ai_role: 'Account Manager',
    user_role: 'Frustrated Key Client',
    scenario:
      'CONTEXT: The company missed a critical delivery. You are extremely frustrated and threatening to leave for a competitor.\n\nYOUR OBJECTIVES:\n1. Express intense frustration over the missed delivery\n2. Threaten to escalate the issue\n3. Observe how the AI Account Manager acknowledges concerns without over-admitting liability\n4. Learn how to outline a concrete recovery plan under pressure',
    icon: 'cart-outline',
    mode: 'evaluation',
    scenario_type: 'mentorship_sim',
    session_mode: 'skill_assessment',
    simulation_id: 'MENT-06-CUST-001',
  },
  {
    title: 'Observing Accountability Coaching',
    description: 'Play the role of a capable but dependent team member. Observe how the AI Manager establishes boundaries and accountability.',
    ai_role: 'Manager',
    user_role: 'Team Member',
    scenario:
      'CONTEXT: You are a capable employee but you frequently hand difficult tasks back to your manager to solve. You are in a 1-on-1 meeting.\n\nYOUR OBJECTIVES:\n1. Make excuses for not completing tasks\n2. Ask the manager for answers instead of bringing solutions\n3. Observe how the AI Manager clarifies expectations without blame\n4. Notice how ownership boundaries are firmly established',
    icon: 'school-outline',
    mode: 'evaluation',
    scenario_type: 'mentorship_sim',
    session_mode: 'skill_assessment',
    simulation_id: 'MENT-07-LEAD-001',
  },
  {
    title: 'Observing Change Management',
    description: 'Play the role of a team member resisting a new system. Observe how the AI Team Lead manages your resistance.',
    ai_role: 'Team Lead',
    user_role: 'Experienced Team Member',
    scenario:
      'CONTEXT: You are an experienced employee who thinks the new organizational system is a waste of time and unnecessary.\n\nYOUR OBJECTIVES:\n1. Express cynicism about the new system\n2. Claim the old way worked perfectly fine\n3. Observe how the AI Team Lead understands resistance drivers without confrontation\n4. Notice how the AI reinforces purpose and encourages adaptation',
    icon: 'warning-outline',
    mode: 'evaluation',
    scenario_type: 'mentorship_sim',
    session_mode: 'skill_assessment',
    simulation_id: 'MENT-08-CHG-001',
  },
  {
    title: 'Observing Tough Career Feedback',
    description: 'Play a disappointed high performer who didn\'t get promoted. Observe how the AI Manager provides developmental feedback.',
    ai_role: 'Manager',
    user_role: 'High Performer',
    scenario:
      'CONTEXT: You are a high performer but you were passed over for a promotion. You are disappointed and want to know why.\n\nYOUR OBJECTIVES:\n1. Express frustration and disappointment\n2. Ask why you weren\'t chosen in a challenging tone\n3. Observe how the AI Manager acknowledges the emotional impact while remaining firm\n4. Notice how the AI provides specific, forward-looking developmental feedback',
    icon: 'school-outline',
    mode: 'evaluation',
    scenario_type: 'mentorship_sim',
    session_mode: 'skill_assessment',
    simulation_id: 'MENT-09-CAR-001',
  },
  {
    title: 'Observing Wellbeing Check-ins',
    description: 'Play the role of an exhausted, quiet high performer. Observe how the AI Manager sensitively explores signs of burnout.',
    ai_role: 'Manager',
    user_role: 'Exhausted Performer',
    scenario:
      'CONTEXT: You are still hitting your numbers but you are exhausted and avoiding extra tasks. The AI Manager has called a meeting to check in.\n\nYOUR OBJECTIVES:\n1. Be evasive and give short responses initially\n2. Claim \'everything is fine, just busy\'\n3. Observe how the AI Manager creates psychological safety without accusing\n4. Notice how the AI explores wellbeing and protects sustainable performance',
    icon: 'people-outline',
    mode: 'evaluation',
    scenario_type: 'mentorship_sim',
    session_mode: 'skill_assessment',
    simulation_id: 'MENT-10-WELL-001',
  },
];
