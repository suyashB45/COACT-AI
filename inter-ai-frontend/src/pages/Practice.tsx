"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

import { motion } from "framer-motion"
import {
    Sparkles,
    Swords,
    UserCog,
    DollarSign, Users, ShoppingCart, GraduationCap, AlertTriangle, Check, ChevronDown, ChevronUp, Info,
    Type, User, MessageSquare, BrainCircuit, Loader2
} from "lucide-react"
import Navigation from "../components/landing/Navigation"
import { getApiUrl, getAuthHeaders } from "../lib/api"

const ICON_MAP: any = {
    Users, ShoppingCart, GraduationCap, AlertTriangle, DollarSign, UserCog
}

const DEFAULT_SCENARIOS = [
    {
        name: "Coaching Simulations",
        color: "from-amber-500 to-orange-600",
        scenarios: [
            {
                title: "Good Attitude, Poor Results",
                description: "Coach a sincere employee who keeps missing targets. Improve performance without demotivating the employee.",
                ai_role: "Sales Associate",
                user_role: "Store Manager",
                scenario: `The employee is sincere and well-liked, but their results have been consistently below target for the last 3 months. You need to coach them to understand the gap, identify root causes, and agree on a clear improvement plan.\n\nYOUR OBJECTIVES:\n1. Create a safe, respectful tone\n2. Use facts to discuss the performance gap\n3. Explore reasons behind the gap\n4. Agree on 2-3 actions and a follow-up plan`,
                icon: "Users",
                output_type: "scored_report",
                mode: "evaluation",
                scenario_type: "coaching_sim",
                session_mode: "skill_assessment",
                simulation_id: "SIM-01-PERF-001"
            },
            {
                title: "High Performer, Toxic Attitude",
                description: "Address behavior issues with a top performer without losing performance momentum.",
                ai_role: "Top Sales Performer",
                user_role: "Team Leader",
                scenario: `The employee is a top performer whose sales numbers consistently exceed target. However, multiple team members report they are sarcastic, dismissive, and undermine colleagues in front of customers. You must address the behavior without losing performance momentum.\n\nYOUR OBJECTIVES:\n1. Maintain psychological safety\n2. Address behavior clearly using examples\n3. Separate performance from behavior\n4. Create ownership and behavior shift commitment`,
                icon: "AlertTriangle",
                output_type: "scored_report",
                mode: "evaluation",
                scenario_type: "coaching_sim",
                session_mode: "skill_assessment",
                simulation_id: "SIM-02-BEH-001"
            },
            {
                title: "The Silent Disengagement",
                description: "Re-engage a once-dependable team member who has shown a decline in initiative.",
                ai_role: "Disengaged Team Member",
                user_role: "Manager",
                scenario: `The team member was once dependable, but over the last 6-8 weeks, their energy has dropped. They complete tasks but show no initiative and avoid extra responsibilities. There are no performance complaints—just a decline in engagement.\n\nYOUR OBJECTIVES:\n1. Create psychological safety\n2. Explore underlying causes without assumptions\n3. Avoid an accusatory tone\n4. Help the team member reconnect to purpose or ownership`,
                icon: "Users",
                output_type: "scored_report",
                mode: "evaluation",
                scenario_type: "coaching_sim",
                session_mode: "skill_assessment",
                simulation_id: "SIM-03-MOT-001"
            },
            {
                title: "Pushing Back Upwards",
                description: "Communicate concerns about unrealistic targets to a Regional Director professionally.",
                ai_role: "Regional Director",
                user_role: "Sales Manager",
                scenario: `Your Regional Director set a new quarterly sales target 35% higher than last quarter, which you believe is unrealistic due to staffing, market, and inventory constraints. You need to communicate concerns without appearing resistant or negative.\n\nYOUR OBJECTIVES:\n1. Remain professional and composed\n2. Use data to support your position\n3. Avoid an emotional or defensive tone\n4. Offer alternative solutions`,
                icon: "UserCog",
                output_type: "scored_report",
                mode: "evaluation",
                scenario_type: "coaching_sim",
                session_mode: "skill_assessment",
                simulation_id: "SIM-04-COM-001"
            },
            {
                title: "Two Team Members, One Growing Conflict",
                description: "Resolve visible tension and breakdown in communication between two team members.",
                ai_role: "Conflicted Team Members",
                user_role: "Team Manager",
                scenario: `Two team members' communication has broken down; each claims the other is causing delays and mistakes. Tension is now visible to other team members, and you have called both into a joint meeting to resolve it.\n\nYOUR OBJECTIVES:\n1. Establish neutrality\n2. Prevent blame escalation\n3. Identify the root cause\n4. Create a practical working agreement`,
                icon: "Users",
                output_type: "scored_report",
                mode: "evaluation",
                scenario_type: "coaching_sim",
                session_mode: "skill_assessment",
                simulation_id: "SIM-05-CON-001"
            },
            {
                title: "The Escalating Client",
                description: "Manage a frustrated key client threatening to escalate a delivery issue.",
                ai_role: "Frustrated Key Client",
                user_role: "Account Manager",
                scenario: `A key client is frustrated over a delivery issue and believes your team failed to meet expectations. They are threatening to escalate to senior leadership and reconsider future business.\n\nYOUR OBJECTIVES:\n1. Stay composed under pressure\n2. Acknowledge concerns without over-admitting liability\n3. Clarify facts\n4. Offer a structured path forward`,
                icon: "ShoppingCart",
                output_type: "scored_report",
                mode: "evaluation",
                scenario_type: "coaching_sim",
                session_mode: "skill_assessment",
                simulation_id: "SIM-06-CUST-001"
            },
            {
                title: "The Overloaded Manager",
                description: "Address a pattern of poor ownership with a capable team member.",
                ai_role: "Team Member",
                user_role: "Manager",
                scenario: `You are overwhelmed as critical tasks often end up back on your desk because a capable team member rarely takes full ownership. You need to address this pattern and redistribute responsibility.\n\nYOUR OBJECTIVES:\n1. Clarify expectations\n2. Avoid blame\n3. Define ownership boundaries\n4. Establish an accountability structure`,
                icon: "GraduationCap",
                output_type: "scored_report",
                mode: "evaluation",
                scenario_type: "coaching_sim",
                session_mode: "skill_assessment",
                simulation_id: "SIM-07-LEAD-001"
            },
            {
                title: "Resistance to the New System",
                description: "Understand and manage subtle resistance to organizational change.",
                ai_role: "Experienced Team Member",
                user_role: "Team Lead",
                scenario: `An experienced team member is subtly resisting a new organizational system, frequently calling it unnecessary. Their attitude is beginning to influence others.\n\nYOUR OBJECTIVES:\n1. Avoid confrontation\n2. Understand resistance drivers\n3. Reinforce the purpose of the change\n4. Encourage ownership in adaptation`,
                icon: "AlertTriangle",
                output_type: "scored_report",
                mode: "evaluation",
                scenario_type: "coaching_sim",
                session_mode: "skill_assessment",
                simulation_id: "SIM-08-CHG-001"
            },
            {
                title: "Why Didn't I Get Promoted?",
                description: "Provide developmental feedback to a high performer not selected for promotion.",
                ai_role: "High Performer",
                user_role: "Manager",
                scenario: `A high performer applied for a promotion but was not selected. They have requested a meeting to understand why they were not chosen.\n\nYOUR OBJECTIVES:\n1. Acknowledge the emotional impact\n2. Provide specific developmental feedback\n3. Avoid vague generalizations\n4. Offer a forward-looking growth plan`,
                icon: "GraduationCap",
                output_type: "scored_report",
                mode: "evaluation",
                scenario_type: "coaching_sim",
                session_mode: "skill_assessment",
                simulation_id: "SIM-09-CAR-001"
            },
            {
                title: "Burnout Behind the Smile",
                description: "Sustainably explore signs of exhaustion and burnout with a high performer.",
                ai_role: "Exhausted Performer",
                user_role: "Manager",
                scenario: `The employee remains high-performing, but you have noticed signs of exhaustion, such as shorter responses and avoiding extra tasks. You suspect early signs of burnout.\n\nYOUR OBJECTIVES:\n1. Observe without accusing\n2. Create psychological safety\n3. Explore wellbeing sensitively\n4. Protect sustainable performance`,
                icon: "Users",
                output_type: "scored_report",
                mode: "evaluation",
                scenario_type: "coaching_sim",
                session_mode: "skill_assessment",
                simulation_id: "SIM-10-WELL-001"
            }
        ]
    }
]

const MENTORSHIP_SCENARIOS = [
    {
        name: "Mentorship Simulations",
        color: "from-blue-500 to-indigo-600",
        scenarios: [
            {
                title: "Observing Performance Coaching",
                description: "Play the role of an underperforming Sales Associate. Observe how the AI Store Manager effectively coaches you.",
                ai_role: "Store Manager",
                user_role: "Sales Associate",
                scenario: `CONTEXT: You are a sincere employee but you have consistently missed your sales targets for 3 months.

YOUR OBJECTIVES:
1. Blame external factors for poor sales initially
2. Open up about your lack of confidence only if asked good diagnostic questions
3. Observe how the AI Manager uses facts and empathy to discuss the performance gap
4. Notice how a clear improvement plan is co-created`,
                icon: "Users",
                output_type: "scored_report",
                mode: "evaluation",
                scenario_type: "mentorship_sim",
                session_mode: "skill_assessment",
                simulation_id: "MENT-01-PERF-001"
            },
            {
                title: "Observing Behavioral Feedback",
                description: "Play the role of a top performer with a toxic attitude. Observe how the AI Team Leader addresses your behavior.",
                ai_role: "Team Leader",
                user_role: "Top Sales Performer",
                scenario: `CONTEXT: Your sales numbers exceed targets, but you are often sarcastic and dismissive of teammates. You are in a meeting with your Team Leader.

YOUR OBJECTIVES:
1. Be dismissive of the feedback and point to your high sales numbers
2. Show frustration at your slower team members
3. Observe how the AI Team Leader separates performance from behavior
4. Notice the techniques used to create ownership of team culture`,
                icon: "AlertTriangle",
                output_type: "scored_report",
                mode: "evaluation",
                scenario_type: "mentorship_sim",
                session_mode: "skill_assessment",
                simulation_id: "MENT-02-BEH-001"
            },
            {
                title: "Observing Re-engagement",
                description: "Play the role of a once-dependable but now disengaged employee. Observe how the AI Manager rebuilds your engagement.",
                ai_role: "Manager",
                user_role: "Disengaged Team Member",
                scenario: `CONTEXT: Over the last 6-8 weeks, your energy has dropped. You do the bare minimum and avoid extra responsibilities.

YOUR OBJECTIVES:
1. Show a lack of initiative and give minimal responses
2. Act disinterested but not actively hostile
3. Observe how the AI Manager explores underlying causes without assumptions
4. Notice how the AI helps reconnect you to purpose or ownership`,
                icon: "Users",
                output_type: "scored_report",
                mode: "evaluation",
                scenario_type: "mentorship_sim",
                session_mode: "skill_assessment",
                simulation_id: "MENT-03-MOT-001"
            },
            {
                title: "Observing Upward Pushback",
                description: "Play the Regional Director handing down impossible targets. Observe how the AI Sales Manager professionally pushes back.",
                ai_role: "Sales Manager",
                user_role: "Regional Director",
                scenario: `CONTEXT: You are the Regional Director and have just handed the AI (Sales Manager) a 35% target increase. You expect them to just accept it. 

YOUR OBJECTIVES:
1. Demand they hit the new targets
2. Be skeptical of excuses
3. Observe how the AI uses data and professionalism to push back
4. Learn how to effectively manage upwards from the AI's approach`,
                icon: "UserCog",
                output_type: "scored_report",
                mode: "evaluation",
                scenario_type: "mentorship_sim",
                session_mode: "skill_assessment",
                simulation_id: "MENT-04-COM-001"
            },
            {
                title: "Observing Conflict Resolution",
                description: "Play the role of a frustrated team member in a conflict. Observe how the AI Manager neutralizes blame and mediates.",
                ai_role: "Team Manager",
                user_role: "Conflicted Team Member",
                scenario: `CONTEXT: You are in a conflict with a colleague and blame them for delays. You are in a mediation meeting led by the AI Manager.

YOUR OBJECTIVES:
1. Express frustration with your colleague
2. React defensively if you feel attacked
3. Observe how the AI Manager establishes neutrality and identifies root causes
4. Notice the techniques used to guide you toward a working agreement`,
                icon: "Users",
                output_type: "scored_report",
                mode: "evaluation",
                scenario_type: "mentorship_sim",
                session_mode: "skill_assessment",
                simulation_id: "MENT-05-CON-001"
            },
            {
                title: "Observing Client De-escalation",
                description: "Play the role of a furious client demanding answers. Observe how the AI Account Manager de-escalates and recovers trust.",
                ai_role: "Account Manager",
                user_role: "Frustrated Key Client",
                scenario: `CONTEXT: The company missed a critical delivery. You are extremely frustrated and threatening to leave for a competitor.

YOUR OBJECTIVES:
1. Express intense frustration over the missed delivery
2. Threaten to escalate the issue
3. Observe how the AI Account Manager acknowledges concerns without over-admitting liability
4. Learn how to outline a concrete recovery plan under pressure`,
                icon: "ShoppingCart",
                output_type: "scored_report",
                mode: "evaluation",
                scenario_type: "mentorship_sim",
                session_mode: "skill_assessment",
                simulation_id: "MENT-06-CUST-001"
            },
            {
                title: "Observing Accountability Coaching",
                description: "Play the role of a capable but dependent team member. Observe how the AI Manager establishes boundaries and accountability.",
                ai_role: "Manager",
                user_role: "Team Member",
                scenario: `CONTEXT: You are a capable employee but you frequently hand difficult tasks back to your manager to solve. You are in a 1-on-1 meeting.

YOUR OBJECTIVES:
1. Make excuses for not completing tasks
2. Ask the manager for answers instead of bringing solutions
3. Observe how the AI Manager clarifies expectations without blame
4. Notice how ownership boundaries are firmly established`,
                icon: "GraduationCap",
                output_type: "scored_report",
                mode: "evaluation",
                scenario_type: "mentorship_sim",
                session_mode: "skill_assessment",
                simulation_id: "MENT-07-LEAD-001"
            },
            {
                title: "Observing Change Management",
                description: "Play the role of a team member resisting a new system. Observe how the AI Team Lead manages your resistance.",
                ai_role: "Team Lead",
                user_role: "Experienced Team Member",
                scenario: `CONTEXT: You are an experienced employee who thinks the new organizational system is a waste of time and unnecessary.

YOUR OBJECTIVES:
1. Express cynicism about the new system
2. Claim the old way worked perfectly fine
3. Observe how the AI Team Lead understands resistance drivers without confrontation
4. Notice how the AI reinforces purpose and encourages adaptation`,
                icon: "AlertTriangle",
                output_type: "scored_report",
                mode: "evaluation",
                scenario_type: "mentorship_sim",
                session_mode: "skill_assessment",
                simulation_id: "MENT-08-CHG-001"
            },
            {
                title: "Observing Tough Career Feedback",
                description: "Play a disappointed high performer who didn't get promoted. Observe how the AI Manager provides developmental feedback.",
                ai_role: "Manager",
                user_role: "High Performer",
                scenario: `CONTEXT: You are a high performer but you were passed over for a promotion. You are disappointed and want to know why.

YOUR OBJECTIVES:
1. Express frustration and disappointment
2. Ask why you weren't chosen in a challenging tone
3. Observe how the AI Manager acknowledges the emotional impact while remaining firm
4. Notice how the AI provides specific, forward-looking developmental feedback`,
                icon: "GraduationCap",
                output_type: "scored_report",
                mode: "evaluation",
                scenario_type: "mentorship_sim",
                session_mode: "skill_assessment",
                simulation_id: "MENT-09-CAR-001"
            },
            {
                title: "Observing Wellbeing Check-ins",
                description: "Play the role of an exhausted, quiet high performer. Observe how the AI Manager sensitively explores signs of burnout.",
                ai_role: "Manager",
                user_role: "Exhausted Performer",
                scenario: `CONTEXT: You are still hitting your numbers but you are exhausted and avoiding extra tasks. The AI Manager has called a meeting to check in.

YOUR OBJECTIVES:
1. Be evasive and give short responses initially
2. Claim 'everything is fine, just busy'
3. Observe how the AI Manager creates psychological safety without accusing
4. Notice how the AI explores wellbeing and protects sustainable performance`,
                icon: "Users",
                output_type: "scored_report",
                mode: "evaluation",
                scenario_type: "mentorship_sim",
                session_mode: "skill_assessment",
                simulation_id: "MENT-10-WELL-001"
            }
        ]
    }
]


export default function Practice() {
    const navigate = useNavigate()

    const [selectedCharacter, setSelectedCharacter] = useState<"alex" | "sarah">("alex")

    const [expandedScenario, setExpandedScenario] = useState<string | null>(null)
    const [isStartingSession, setIsStartingSession] = useState(false)
    const [startingScenarioTitle, setStartingScenarioTitle] = useState<string | null>(null)

    // Custom Scenario State
    const [customForm, setCustomForm] = useState({
        title: "",
        userRole: "",
        aiRole: "",
        context: "",
        mode: "practice" as "practice",
        sessionType: "assessment" as "assessment" | "mentorship"
    })

    const [globalMode, setGlobalMode] = useState<"assessment" | "mentorship">("assessment")


    // Helper function to parse scenario text
    const parseScenarioDetails = (scenarioText: string) => {
        const sections = {
            context: '',
            focusAreas: '',
            aiBehavior: ''
        }

        // Extract CONTEXT
        const contextMatch = scenarioText.match(/CONTEXT:\s*(.*?)(?=\n\n|FOCUS AREAS:|AI BEHAVIOR:|$)/s)
        if (contextMatch) sections.context = contextMatch[1].trim()

        // Extract FOCUS AREAS
        const focusMatch = scenarioText.match(/FOCUS AREAS:\s*(.*?)(?=\n\n|AI BEHAVIOR:|$)/s)
        if (focusMatch) sections.focusAreas = focusMatch[1].trim()

        // Extract AI BEHAVIOR
        const behaviorMatch = scenarioText.match(/AI BEHAVIOR:\s*(.*?)$/s)
        if (behaviorMatch) sections.aiBehavior = behaviorMatch[1].trim()

        return sections
    }



    const handleStartSession = async (data: {
        role: string
        ai_role: string
        scenario: string
        scenario_type?: string
        session_mode?: string
        ai_character?: string
        title?: string
        mode?: string
        simulation_id?: string
        flip_roles?: boolean
    }) => {
        if (isStartingSession) return

        try {
            setIsStartingSession(true)
            setStartingScenarioTitle(data.title || 'custom')
            // Call backend to create session
            // Get auth token for session persistence
            const authHeaders: Record<string, string> = {
                'Content-Type': 'application/json'
            }

            const response = await fetch(getApiUrl('/api/session/start'), {
                method: 'POST',
                headers: { ...authHeaders, ...getAuthHeaders() },
                body: JSON.stringify({
                    role: data.role,
                    ai_role: data.ai_role,
                    scenario: data.scenario,
                    framework: 'auto',
                    scenario_type: data.scenario_type,
                    ai_character: data.ai_character || selectedCharacter,
                    title: data.title,
                    mode: data.mode,
                    simulation_id: data.simulation_id,
                    flip_roles: data.flip_roles || false
                })
            })

            if (!response.ok) {
                if (response.status === 403 || response.status === 429) {
                    setIsStartingSession(false)
                    setStartingScenarioTitle(null)
                    
                    let errorMsg = undefined
                    try {
                        const errorData = await response.json()
                        if (errorData.error) errorMsg = errorData.error
                    } catch (e) {}

                    navigate('/limit-reached', { state: { message: errorMsg } })
                    return
                }
                throw new Error('Failed to start session')
            }

            const result = await response.json()
            const session_id = result.session_id
            const summary = result.summary

            // Also save to localStorage for offline reference
            localStorage.setItem(
                `session_${session_id}`,
                JSON.stringify({
                    role: data.role,
                    ai_role: data.ai_role,
                    scenario: data.scenario,
                    title: data.title,
                    createdAt: new Date().toISOString(),
                    transcript: [{ role: "assistant", content: summary }],
                    sessionId: session_id,
                    completed: false,
                    scenario_type: result.scenario_type || 'custom',
                    session_mode: result.session_mode || data.session_mode || 'skill_assessment',
                    ai_character: result.ai_character || data.ai_character,
                    multi_characters: result.multi_characters || false,
                    characters: result.characters || null
                }),
            )
            navigate(`/system-check/${session_id}`)

        } catch (error) {
            console.error("Error starting session:", error)

            toast.error("Failed to start session", {
                description: "Please make sure the backend is running."
            })
            setIsStartingSession(false)
            setStartingScenarioTitle(null)
        }
    }

    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30 relative overflow-x-hidden">
            <Navigation />

            {/* Ambient Background */}

            <main className="container mx-auto px-4 sm:px-6 pt-24 sm:pt-32 pb-16 sm:pb-32">
                {/* Hero Section */}
                <div className="absolute top-0 left-0 w-full h-[50vh] bg-gradient-to-b from-primary/10 via-purple-500/5 to-transparent pointer-events-none -z-10" />
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="text-center mb-16 relative z-10"
                >
                    <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-[0.15em] mb-6 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
                        <Sparkles className="w-3.5 h-3.5" /> AI Training Arena
                    </div>
                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-black mb-6 tracking-tight text-foreground">
                        Practice Conversations <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">
                            That Matter
                        </span>
                    </h1>
                    <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                        Select a partner, choose your mode, and master your skills.
                    </p>
                </motion.div>

                {/* Character Selection */}
                <div className="flex flex-col items-center mb-20 relative">
                    <div className="bg-background px-4 relative z-10 mb-8">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Step 01</span>
                    </div>
                    <h3 className="text-2xl font-bold text-foreground mb-8 tracking-tight">Select Your Partner</h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8 w-full max-w-2xl px-4">
                        {[
                            {
                                id: "alex",
                                name: "Alex",
                                role: "Senior AI Coach",
                                desc: "Fully adaptive roleplay partner. Shifts dynamically between evaluation and mentorship.",
                                img: "/alex.png",
                                voice: "Male Voice (Fable)",
                                color: "blue",
                                traits: ["Scenario Adaptive", "Real-time Feedback", "Role Improvisation"]
                            },
                            {
                                id: "sarah",
                                name: "Sarah",
                                role: "Senior AI Coach",
                                desc: "Fully adaptive roleplay partner. Shifts dynamically between evaluation and mentorship.",
                                img: "/sarah.png",
                                voice: "Female Voice (Nova)",
                                color: "purple",
                                traits: ["Scenario Adaptive", "Real-time Feedback", "Role Improvisation"]
                            }
                        ].map((char) => (
                            <motion.button
                                key={char.id}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setSelectedCharacter(char.id as any)}
                                className={`relative group overflow-hidden rounded-xl border transition-all duration-300 text-left h-full flex flex-col ${selectedCharacter === char.id
                                    ? `border-primary bg-primary/5 shadow-sm ring-1 ring-primary`
                                    : "border-border bg-card hover:bg-muted"
                                    }`}
                            >
                                <div className="relative h-48 sm:h-64 overflow-hidden w-full">
                                    <div className={`absolute inset-0 bg-card/10 z-10`} />
                                    <img
                                        src={char.img}
                                        alt={char.name}
                                        className={`w-full h-full object-cover transition-transform duration-700 ${selectedCharacter === char.id ? 'scale-105' : 'group-hover:scale-110 opacity-60 group-hover:opacity-100'}`}
                                    />

                                    {/* Selection Check */}
                                    {selectedCharacter === char.id && (
                                        <div className="absolute top-4 right-4 z-20">
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className={`w-10 h-10 rounded-full bg-${char.color}-500 flex items-center justify-center shadow-lg border-2 border-white/20`}
                                            >
                                                <Check className="w-6 h-6 text-white" />
                                            </motion.div>
                                        </div>
                                    )}
                                </div>

                                <div className="p-4 sm:p-6 relative z-20 -mt-16 sm:-mt-20 flex-1 flex flex-col">
                                    <div className="mb-auto">
                                        <h4 className={`text-2xl sm:text-3xl font-black mb-1 ${selectedCharacter === char.id ? "text-foreground" : "text-muted-foreground"}`}>{char.name}</h4>
                                        <p className={`text-xs font-bold uppercase tracking-widest mb-4 ${selectedCharacter === char.id ? `text-${char.color}-400` : "text-muted-foreground"}`}>{char.role}</p>

                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            {char.desc}
                                        </p>
                                    </div>
                                </div>
                            </motion.button>
                        ))}
                    </div>
                </div>




                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="max-w-6xl mx-auto"
                >
                    <div className="space-y-12">
                        {/* Mode Toggle for Guided */}

                        {/* Step 2 Header */}
                        <div className="flex flex-col items-center mb-8 relative">
                            <div className="bg-background px-4 relative z-10 mb-8">
                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Step 02</span>
                            </div>
                            <h3 className="text-2xl font-bold text-foreground tracking-tight mb-6">Choose Your Challenge</h3>

                            {/* Global Mode Toggle */}
                            <div className="flex bg-card border border-border/50 rounded-2xl p-2 shadow-2xl backdrop-blur-md mb-12">
                                <button
                                    onClick={() => setGlobalMode("assessment")}
                                    className={`relative px-10 py-3.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${globalMode === "assessment"
                                        ? "text-primary bg-primary/10 shadow-[0_0_20px_rgba(59,130,246,0.15)] ring-1 ring-primary/20"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                        }`}
                                >
                                    <Swords className="w-4 h-4" /> Assessment
                                </button>
                                <button
                                    onClick={() => setGlobalMode("mentorship")}
                                    className={`relative px-10 py-3.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${globalMode === "mentorship"
                                        ? "text-emerald-500 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/20"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                        }`}
                                >
                                    <UserCog className="w-4 h-4" /> Mentorship
                                </button>
                            </div>
                        </div>

                        {(globalMode === "assessment" ? DEFAULT_SCENARIOS : MENTORSHIP_SCENARIOS).map((category, idx) => (
                            <div key={idx} className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className={`h-8 w-1 bg-primary rounded-full`} />
                                    <h3 className="text-2xl font-bold text-foreground tracking-tight">{category.name}</h3>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                                    {category.scenarios.map((scenario: any, sIdx: number) => {
                                        const Icon = ICON_MAP[scenario.icon] || Sparkles
                                        // Use scenario_type for badge display
                                        const scenarioType = scenario.scenario_type || 'custom'
                                        const typeLabels: any = {
                                            'coaching': 'Coaching',
                                            'negotiation': 'Negotiation',
                                            'reflection': 'Reflection',
                                            'mentorship': 'Mentorship',
                                            'mentorship_sim': 'Mentorship',
                                            'coaching_sim': 'Simulation',
                                        }
                                        const typeColors: any = {
                                            'coaching': 'bg-blue-500/10 text-blue-500 border-blue-500/30',
                                            'negotiation': 'bg-green-500/10 text-green-500 border-green-500/30',
                                            'reflection': 'bg-purple-500/10 text-purple-500 border-purple-500/30',
                                            'mentorship': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
                                            'mentorship_sim': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
                                            'coaching_sim': 'bg-amber-500/10 text-amber-500 border-amber-500/30',
                                            'custom': 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                        }
                                        const typeIcons: any = {
                                            'coaching': Users,
                                            'negotiation': ShoppingCart,
                                            'reflection': GraduationCap,
                                            'mentorship': UserCog,
                                            'mentorship_sim': UserCog,
                                            'coaching_sim': Swords,
                                            'custom': Sparkles
                                        }
                                        const modeLabel = typeLabels[scenarioType] || 'Custom'
                                        const ModeIcon = typeIcons[scenarioType] || Sparkles
                                        const badgeColor = typeColors[scenarioType] || typeColors['custom']

                                        // Dynamic Role Handling
                                        let displayAiRole = scenario.ai_role
                                        let displayDescription = scenario.description

                                        // Update text for Learning scenario (Coach Alex/Sarah) or "AI Coach"
                                        if (scenario.scenario_type === 'reflection' || displayAiRole.includes('Coach Alex') || displayAiRole === 'AI Coach') {
                                            const charName = selectedCharacter === 'sarah' ? 'Sarah' : 'Alex'
                                            displayAiRole = `Coach ${charName}`
                                            displayDescription = displayDescription.replace(/Coach Alex/g, `Coach ${charName}`).replace(/AI Coach/g, `Coach ${charName}`)
                                        }

                                        return (
                                            <motion.div
                                                key={sIdx}
                                                initial={{ opacity: 0, y: 24 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.4, delay: 0.08 * sIdx, ease: "easeOut" }}
                                                onClick={() => handleStartSession({
                                                    role: scenario.user_role,
                                                    ai_role: displayAiRole,
                                                    scenario: scenario.scenario,
                                                    scenario_type: scenario.scenario_type,
                                                    session_mode: scenario.session_mode,
                                                    ai_character: selectedCharacter,
                                                    title: scenario.title,
                                                    mode: scenario.mode,
                                                    simulation_id: scenario.simulation_id
                                                })}
                                                className={`group relative p-6 bg-card hover:bg-muted border border-border rounded-xl transition-all duration-200 cursor-pointer overflow-hidden shadow-sm hover:shadow-md ${isStartingSession ? 'opacity-70 pointer-events-none' : ''}`}
                                            >
                                                {isStartingSession && startingScenarioTitle === scenario.title && (
                                                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
                                                        <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
                                                        <span className="text-sm font-bold text-primary">Starting...</span>
                                                    </div>
                                                )}

                                                <div className="relative z-10">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div className={`w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 text-muted-foreground group-hover:text-foreground`}>
                                                            <Icon className="w-6 h-6" />
                                                        </div>
                                                        <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${badgeColor} flex items-center gap-1.5`}>
                                                            <ModeIcon className="w-3 h-3" />
                                                            {modeLabel}
                                                        </div>
                                                    </div>

                                                    <h4 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">{scenario.title}</h4>
                                                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{displayDescription}</p>

                                                    <div className="flex flex-col gap-2 mb-4">
                                                        <div className="flex items-center gap-2 text-xs">
                                                            <span className="font-bold text-muted-foreground uppercase">Your Role:</span>
                                                            <span className="text-foreground font-medium">{scenario.user_role}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-xs">
                                                            <span className="font-bold text-muted-foreground uppercase">Partner:</span>
                                                            <span className="text-primary font-medium">{displayAiRole}</span>
                                                        </div>
                                                    </div>

                                                    {/* Expandable Scenario Details */}
                                                    <div className="mb-4">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                setExpandedScenario(
                                                                    expandedScenario === scenario.title ? null : scenario.title
                                                                )
                                                            }}
                                                            className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400 hover:text-blue-300 transition-colors"
                                                        >
                                                            <Info className="w-3.5 h-3.5" />
                                                            <span>Scenario Details</span>
                                                            {expandedScenario === scenario.title ? (
                                                                <ChevronUp className="w-3.5 h-3.5" />
                                                            ) : (
                                                                <ChevronDown className="w-3.5 h-3.5" />
                                                            )}
                                                        </button>

                                                        {expandedScenario === scenario.title && (
                                                            <motion.div
                                                                initial={{ opacity: 0, height: 0 }}
                                                                animate={{ opacity: 1, height: "auto" }}
                                                                exit={{ opacity: 0, height: 0 }}
                                                                transition={{ duration: 0.3 }}
                                                                className="mt-3 p-4 bg-muted/30 rounded-xl border border-border/50 text-xs"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                {(() => {
                                                                    const details = parseScenarioDetails(scenario.scenario)
                                                                    return (
                                                                        <div className="text-muted-foreground leading-relaxed">
                                                                            {details.context}
                                                                        </div>
                                                                    )
                                                                })()}
                                                            </motion.div>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300 group-hover:text-blue-400 transition-colors mt-4">
                                                        <span>Start Scenario</span>
                                                        <Swords className="w-3 h-3" />
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )
                                    })}
                                </div>
                            </div>
                        ))}

                        {/* Custom Scenario Builder */}
                        <div className="relative mt-32 max-w-4xl mx-auto">
                            <div className="flex flex-col items-center mb-12 relative">
                                <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent -z-10" />
                                <div className="bg-background px-6 relative z-10 mb-6">
                                    <span className="text-xs font-black text-amber-500 tracking-[0.2em] uppercase border border-amber-500/30 bg-amber-500/10 px-6 py-2 rounded-full shadow-[0_0_20px_rgba(245,158,11,0.2)]">Custom Builder</span>
                                </div>
                                <h3 className="text-4xl sm:text-5xl font-black text-foreground tracking-tight mb-4">Build Your Scenario</h3>
                                <p className="text-lg text-muted-foreground text-center max-w-2xl mb-10 leading-relaxed">Design a specific situation to test your skills, explore a new dynamic, or rehearse for an upcoming conversation.</p>

                                {/* Custom Mode Toggle */}
                                <div className="flex bg-card border border-border/50 rounded-2xl p-2 shadow-2xl backdrop-blur-md">
                                    <button
                                        onClick={() => setCustomForm({ ...customForm, sessionType: "assessment" })}
                                        className={`relative px-10 py-3.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${customForm.sessionType === "assessment"
                                            ? "text-primary bg-primary/10 shadow-[0_0_20px_rgba(59,130,246,0.15)] ring-1 ring-primary/20"
                                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                            }`}
                                    >
                                        <Swords className="w-4 h-4" /> Assessment
                                    </button>
                                    <button
                                        onClick={() => setCustomForm({ ...customForm, sessionType: "mentorship" })}
                                        className={`relative px-10 py-3.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${customForm.sessionType === "mentorship"
                                            ? "text-emerald-500 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/20"
                                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                            }`}
                                    >
                                        <UserCog className="w-4 h-4" /> Mentorship
                                    </button>
                                </div>
                            </div>

                            <div className="relative group">
                                {/* Animated Gradient Background/Border */}
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 via-purple-500/30 to-emerald-500/30 rounded-[2.5rem] blur opacity-30 group-hover:opacity-60 transition duration-1000 group-hover:duration-200" />
                                
                                <div className="bg-card border border-border/50 rounded-[2rem] p-8 sm:p-12 backdrop-blur-xl shadow-2xl relative overflow-hidden">
                                    <div className="absolute -top-32 -right-32 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
                                    <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

                                    <div className="space-y-10 relative z-10">

                                        {/* 1. Basics */}
                                        <div className="space-y-6">
                                            <div className="grid grid-cols-1 gap-6">
                                                <div className="space-y-3">
                                                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-2">Scenario Title</label>
                                                    <div className="relative group/input">
                                                        <div className="absolute left-4 top-4 text-muted-foreground group-focus-within/input:text-primary transition-colors">
                                                            <Type className="w-5 h-5" />
                                                        </div>
                                                        <input
                                                            type="text"
                                                            value={customForm.title}
                                                            onChange={(e) => setCustomForm({ ...customForm, title: e.target.value })}
                                                            placeholder="e.g., Managing Underperformance"
                                                            className="w-full bg-background/50 border-2 border-border hover:border-primary/30 rounded-2xl pl-12 pr-4 py-4 text-base focus:outline-none focus:border-primary/50 transition-all font-medium shadow-inner"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-3">
                                                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-2">Your Role</label>
                                                    <div className="relative group/input">
                                                        <div className="absolute left-4 top-4 text-muted-foreground group-focus-within/input:text-indigo-400 transition-colors">
                                                            <User className="w-5 h-5" />
                                                        </div>
                                                        <input
                                                            type="text"
                                                            value={customForm.userRole}
                                                            onChange={(e) => setCustomForm({ ...customForm, userRole: e.target.value })}
                                                            placeholder="e.g., Engineering Lead"
                                                            className="w-full bg-background/50 border-2 border-border hover:border-indigo-500/30 rounded-2xl pl-12 pr-4 py-4 text-base focus:outline-none focus:border-indigo-500/50 transition-all font-medium shadow-inner"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-3">
                                                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-2">Partner Role (AI)</label>
                                                    <div className="relative group/input">
                                                        <div className="absolute left-4 top-4 text-muted-foreground group-focus-within/input:text-purple-400 transition-colors">
                                                            <BrainCircuit className="w-5 h-5" />
                                                        </div>
                                                        <input
                                                            type="text"
                                                            value={customForm.aiRole}
                                                            onChange={(e) => setCustomForm({ ...customForm, aiRole: e.target.value })}
                                                            placeholder="e.g., Junior Developer"
                                                            className="w-full bg-background/50 border-2 border-border hover:border-purple-500/30 rounded-2xl pl-12 pr-4 py-4 text-base focus:outline-none focus:border-purple-500/50 transition-all font-medium shadow-inner"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 3. Context */}
                                        <div className="space-y-3">
                                            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-2">Scenario Context</label>
                                            <div className="relative group/input">
                                                <div className="absolute left-4 top-5 text-muted-foreground group-focus-within/input:text-primary transition-colors">
                                                    <MessageSquare className="w-5 h-5" />
                                                </div>
                                                <textarea
                                                    value={customForm.context}
                                                    onChange={(e) => setCustomForm({ ...customForm, context: e.target.value })}
                                                    placeholder="Describe the situation clearly. Example: 'I need to give negative feedback to a high performer who has been arriving late recently.'..."
                                                    rows={5}
                                                    className="w-full bg-background/50 border-2 border-border hover:border-primary/30 rounded-2xl pl-12 pr-4 py-4 text-base focus:outline-none focus:border-primary/50 resize-none leading-relaxed shadow-inner"
                                                />
                                            </div>
                                        </div>

                                        <div className="pt-6 flex justify-end">
                                            <button
                                                onClick={() => {
                                                    if (!customForm.title || !customForm.userRole || !customForm.aiRole || !customForm.context) {
                                                        toast.error("Please fill in all fields")
                                                        return
                                                    }

                                                    // Dynamic mode based on toggle
                                                    const scenario_type = customForm.sessionType === 'mentorship' ? 'mentorship' : 'coaching_sim'
                                                    const session_mode = customForm.sessionType === 'mentorship' ? 'mentorship' : 'skill_assessment'
                                                    const mode_param = customForm.sessionType === 'mentorship' ? 'mentorship' : 'evaluation'

                                                    handleStartSession({
                                                        role: customForm.userRole,
                                                        ai_role: customForm.aiRole,
                                                        scenario: customForm.context,
                                                        title: customForm.title,
                                                        scenario_type: scenario_type,
                                                        session_mode: session_mode,
                                                        ai_character: selectedCharacter,
                                                        mode: mode_param
                                                    })
                                                }}
                                                disabled={isStartingSession}
                                                className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-lg hover:bg-primary/90 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(59,130,246,0.3)] hover:shadow-[0_0_40px_rgba(59,130,246,0.5)]"
                                            >
                                                {isStartingSession && startingScenarioTitle === customForm.title ? (
                                                    <>
                                                        <Loader2 className="w-6 h-6 animate-spin" />
                                                        Initializing Simulation...
                                                    </>
                                                ) : isStartingSession ? (
                                                    'Initializing Simulation...'
                                                ) : (
                                                    <>
                                                        Start Simulation
                                                        <Swords className="w-6 h-6" />
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </motion.div >
            </main >
        </div >
    )
}
