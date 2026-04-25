package api

import (
	"encoding/json"
	"log"
	"regexp"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	openai "github.com/sashabaranov/go-openai"
	"github.com/suyashB45/inter-ai-backend-go/internal/database"
	"github.com/suyashB45/inter-ai-backend-go/internal/llm"
	"github.com/suyashB45/inter-ai-backend-go/internal/models"
	"github.com/suyashB45/inter-ai-backend-go/internal/report"
)

func StartSession(c *fiber.Ctx) error {
	log.Println("[DEBUG] Entered /session/start")

	var payload map[string]interface{}
	if err := c.BodyParser(&payload); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid fields"})
	}

	role, _ := payload["role"].(string)
	aiRole, _ := payload["ai_role"].(string)
	scenario, _ := payload["scenario"].(string)
	title, _ := payload["title"].(string)
	frameworkRaw := payload["framework"]
	flipRoles, _ := payload["flip_roles"].(bool)
	scenarioType, _ := payload["scenario_type"].(string)
	mode, _ := payload["mode"].(string)
	sessionMode, _ := payload["session_mode"].(string)
	simulationID, _ := payload["simulation_id"].(string)
	aiCharacter, _ := payload["ai_character"].(string)

	if role == "" || aiRole == "" || scenario == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Missing fields"})
	}

	if flipRoles {
		log.Println("[INFO] flip_roles flag detected - swapping role and ai_role")
		role, aiRole = aiRole, role
	}

	if aiCharacter == "" {
		aiCharacter = "alex"
	}

	// Auto-detect scenario_type
	if scenarioType == "" {
		scenarioType = llm.DetectScenarioType(scenario, aiRole, role)
	}
	log.Printf("[INFO] Session scenario_type set to: %s", scenarioType)

	// Detect session_mode
	if sessionMode == "" {
		modeMapping := map[string]string{
			"coaching": "skill_assessment", "negotiation": "skill_assessment",
			"reflection": "practice", "mentorship": "mentorship",
			"coaching_sim": "skill_assessment", "mentorship_sim": "mentorship",
			"custom": "practice",
		}
		if m, ok := modeMapping[scenarioType]; ok {
			sessionMode = m
		} else {
			sessionMode = "practice"
		}
	}
	log.Printf("[INFO] Session mode set to: %s", sessionMode)

	// Map scenario_type to mode for backward compatibility
	if mode == "" {
		modeMap := map[string]string{
			"coaching": "evaluation", "negotiation": "evaluation",
			"mentorship": "mentorship", "mentorship_sim": "mentorship",
			"reflection": "coaching", "custom": "coaching",
		}
		if m, ok := modeMap[scenarioType]; ok {
			mode = m
		} else {
			mode = "coaching"
		}
	}

	// Simulation-specific mode override
	if simulationID != "" && scenarioType != "mentorship" && scenarioType != "mentorship_sim" {
		mode = "evaluation"
		log.Printf("[INFO] Simulation %s detected, mode forced to evaluation", simulationID)
	}

	// Handle framework selection
	var framework []string
	frameworkStr := ""
	needsAutoFramework := false

	switch v := frameworkRaw.(type) {
	case string:
		if v == "auto" || v == "AUTO" || v == "" {
			needsAutoFramework = true
		} else {
			framework = []string{strings.ToUpper(v)}
		}
	case []interface{}:
		for _, f := range v {
			if s, ok := f.(string); ok {
				framework = append(framework, strings.ToUpper(s))
			}
		}
	default:
		needsAutoFramework = true
	}

	sessionID := uuid.New().String()

	// Get authenticated user
	authHeader := c.Get("Authorization")
	var userID *string
	if authHeader != "" {
		token := strings.Replace(authHeader, "Bearer ", "", 1)
		user, err := database.GetUserFromToken(token)
		if err == nil && user != nil {
			userID = &user.ID
			log.Printf("[INFO] Session created for user: %s", user.ID)

			// Session limit check
			sessions, err := database.GetUserSessionsFromDB(user.ID, 1, true)
			if err == nil && len(sessions) >= 3 {
				return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
					"error": "Free Limit Reached (3/3 sessions). Please contact sales to upgrade.",
				})
			}
		} else {
			log.Println("[WARNING] Session created without user authentication")
		}
	}

	// Check for hardcoded openings
	var summary string
	if opening, ok := llm.HARDCODED_OPENINGS[simulationID]; ok {
		if needsAutoFramework {
			framework = llm.SelectFrameworkForScenario(scenario, aiRole, simulationID)
		}
		summary = opening
		log.Printf("[PERF] Used hardcoded opening for %s - skipped LLM summary call", simulationID)
	} else {
		if needsAutoFramework {
			framework = llm.SelectFrameworkForScenario(scenario, aiRole, simulationID)
		}
		// Build prompt and call LLM
		promptMsgs := llm.BuildSummaryPrompt(role, aiRole, scenario, framework, mode, aiCharacter, simulationID)
		var openaiMsgs []openai.ChatCompletionMessage
		for _, m := range promptMsgs {
			openaiMsgs = append(openaiMsgs, openai.ChatCompletionMessage{Role: m.Role, Content: m.Content})
		}
		resp, err := llm.LLMReply(openaiMsgs, 150)
		if err != nil {
			log.Printf("[ERROR] Summary LLM call failed: %v", err)
			summary = "Hello, let's begin our roleplay session."
		} else {
			summary = llm.SanitizeLLMOutput(resp)
		}
	}

	// Multi-character detection
	multiCharacters := simulationID == "SIM-05-CON-001" || simulationID == "MENT-05-CON-001"
	var characters []models.CharacterConfig
	if simulationID == "SIM-05-CON-001" {
		characters = []models.CharacterConfig{
			{Name: "Rohan", Label: "[Rohan]", Voice: "fable", Color: "blue"},
			{Name: "Meera", Label: "[Meera]", Voice: "nova", Color: "pink"},
		}
	} else if simulationID == "MENT-05-CON-001" {
		characters = []models.CharacterConfig{
			{Name: "Manager", Label: "[Manager]", Voice: "fable", Color: "blue"},
			{Name: "Colleague", Label: "[Colleague]", Voice: "nova", Color: "pink"},
		}
	}

	// Serialize framework
	if len(framework) > 0 {
		fwBytes, _ := json.Marshal(framework)
		frameworkStr = string(fwBytes)
	}

	sess := &models.Session{
		ID:              sessionID,
		CreatedAt:       time.Now().Format(time.RFC3339),
		Role:            role,
		AIRole:          aiRole,
		Scenario:        scenario,
		Title:           title,
		Framework:       frameworkStr,
		ScenarioType:    scenarioType,
		Mode:            mode,
		SessionMode:     sessionMode,
		Transcript:      []models.TranscriptMsg{{Role: "assistant", Content: summary}},
		ReportData:      nil,
		Completed:       false,
		UserID:          userID,
		AICharacter:     aiCharacter,
		SimulationID:    simulationID,
		MultiCharacters: multiCharacters,
		Characters:      characters,
		Meta:            models.SessionMeta{FrameworkCounts: map[string]int{}, RelevanceIssues: 0},
	}

	database.SessionCache.Set(sessionID, sess, 0)
	go database.SaveSessionToDB(sess)

	return c.JSON(fiber.Map{
		"session_id":       sessionID,
		"summary":          summary,
		"framework":        framework,
		"scenario_type":    scenarioType,
		"session_mode":     sessionMode,
		"ai_character":     aiCharacter,
		"multi_characters": multiCharacters,
		"characters":       characters,
	})
}

func ChatSession(c *fiber.Ctx) error {
	sessionID := c.Params("session_id")
	sess := database.GetSession(sessionID, false)
	if sess == nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Session not found"})
	}

	// Verify ownership
	authHeader := c.Get("Authorization")
	if sess.UserID != nil && *sess.UserID != "" {
		if authHeader == "" {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Forbidden"})
		}
		token := strings.Replace(authHeader, "Bearer ", "", 1)
		user, err := database.GetUserFromToken(token)
		if err != nil || user == nil || user.ID != *sess.UserID {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Forbidden"})
		}
	}

	var data map[string]string
	if err := c.BodyParser(&data); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid JSON"})
	}

	userMsg := llm.NormalizeText(data["message"])
	audioURL := data["audio_url"]

	var aURL *string
	if audioURL != "" {
		aURL = &audioURL
	}

	sess.Transcript = append(sess.Transcript, models.TranscriptMsg{
		Role: "user", Content: userMsg, AudioURL: aURL,
	})

	// Parse active frameworks from session (matching Python's chat handler)
	var activeFW []string
	switch v := sess.Framework.(type) {
	case string:
		if strings.HasPrefix(v, "[") {
			var parsed []string
			if err := json.Unmarshal([]byte(v), &parsed); err == nil {
				activeFW = parsed
			}
		} else if v != "" {
			activeFW = []string{v}
		}
	case []interface{}:
		for _, f := range v {
			if s, ok := f.(string); ok {
				activeFW = append(activeFW, s)
			}
		}
	}

	// Get RAG coaching suggestions from framework_questions.json (matches Python)
	_ = llm.GetRelevantQuestions(userMsg, activeFW, llm.GetQuestionsData())

	// Convert session to map for prompt building
	sessMap := sessionToMap(sess)

	// Build follow-up prompt
	messages := llm.BuildFollowupPrompt(sessMap, userMsg)

	// Convert to OpenAI format
	var openaiMsgs []openai.ChatCompletionMessage
	for _, m := range messages {
		openaiMsgs = append(openaiMsgs, openai.ChatCompletionMessage{Role: m.Role, Content: m.Content})
	}

	turnCount := 0
	for _, t := range sess.Transcript {
		if t.Role == "user" {
			turnCount++
		}
	}

	rawResponse, err := llm.LLMReply(openaiMsgs, 300)
	if err != nil {
		log.Printf("[ERROR] Chat LLM call failed: %v", err)
		rawResponse = "I understand. Could you tell me more about that?"
	}

	// 1. Extract and remove [THOUGHT] tags
	thoughtRe := regexp.MustCompile(`(?s)\[THOUGHT\].*?\[/THOUGHT\]`)
	visibleResponse := thoughtRe.ReplaceAllString(rawResponse, "")
	visibleResponse = strings.TrimSpace(visibleResponse)

	// 2. Clean <<...>> tags
	tagRe := regexp.MustCompile(`(?s)<<.*?>>`)
	cleanResponse := tagRe.ReplaceAllString(visibleResponse, "")
	cleanResponse = strings.TrimSpace(cleanResponse)

	// 3. Detect framework
	fwRe := regexp.MustCompile(`<<FRAMEWORK:\s*(\w+)>>`)
	fwMatch := fwRe.FindStringSubmatch(rawResponse)
	detectedFW := ""
	if len(fwMatch) > 1 {
		detectedFW = strings.ToUpper(fwMatch[1])
	}
	if detectedFW == "" {
		detectedFW = llm.DetectFrameworkFallback(cleanResponse)
	}

	// 4. Update framework counts
	if detectedFW != "" {
		sess.Meta.FrameworkCounts[detectedFW] = sess.Meta.FrameworkCounts[detectedFW] + 1
	}

	// 5. Append assistant response
	sess.Transcript = append(sess.Transcript, models.TranscriptMsg{
		Role: "assistant", Content: cleanResponse,
	})

	database.SessionCache.Set(sessionID, sess, 0)
	go database.SaveSessionToDB(sess)

	return c.JSON(fiber.Map{
		"follow_up":          cleanResponse,
		"framework_detected": detectedFW,
		"framework_counts":   sess.Meta.FrameworkCounts,
	})
}

func CompleteSession(c *fiber.Ctx) error {
	sessionID := c.Params("session_id")
	sess := database.GetSession(sessionID, false)
	if sess == nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Not found"})
	}

	// Verify ownership
	authHeader := c.Get("Authorization")
	if sess.UserID != nil && *sess.UserID != "" {
		if authHeader == "" {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Forbidden"})
		}
		token := strings.Replace(authHeader, "Bearer ", "", 1)
		user, err := database.GetUserFromToken(token)
		if err != nil || user == nil || user.ID != *sess.UserID {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Forbidden"})
		}
	}

	scenarioType := sess.ScenarioType
	mode := sess.Mode
	if mode == "" {
		mode = "coaching"
	}

	// Generate report data via LLM if not already present
	if sess.ReportData == nil {
		log.Printf("[COST] Generating report data for %s (scenario_type: %s)...", sessionID, scenarioType)

		// Convert transcript to []interface{} for the analysis function
		var transcriptIface []interface{}
		for _, t := range sess.Transcript {
			transcriptIface = append(transcriptIface, map[string]interface{}{
				"role": t.Role, "content": t.Content,
			})
		}

		data := llm.AnalyzeFullReportData(
			transcriptIface, sess.Role, sess.AIRole, sess.Scenario,
			sess.Framework, mode, scenarioType, sess.AICharacter,
			sess.SimulationID, sess.SessionMode,
		)
		sess.ReportData = data
	}

	sess.Completed = true

	// Generate PDF
	if reportDataMap, ok := sess.ReportData.(map[string]interface{}); ok {
		reportFilePath, err := report.GenerateReport(sess, reportDataMap)
		if err == nil {
			sess.ReportFile = &reportFilePath
		} else {
			log.Printf("[ERROR] PDF generation failed: %v", err)
		}
	}

	database.SessionCache.Set(sessionID, sess, 0)
	go database.SaveSessionToDB(sess)

	return c.JSON(fiber.Map{
		"message":       "Report generated",
		"report_file":   sess.ReportFile,
		"scenario_type": scenarioType,
	})
}

// sessionToMap converts a Session struct to map[string]interface{} for prompt building
func sessionToMap(sess *models.Session) map[string]interface{} {
	var transcriptIface []interface{}
	for _, t := range sess.Transcript {
		transcriptIface = append(transcriptIface, map[string]interface{}{
			"role": t.Role, "content": t.Content,
		})
	}
	return map[string]interface{}{
		"transcript":    transcriptIface,
		"role":          sess.Role,
		"ai_role":       sess.AIRole,
		"scenario":      sess.Scenario,
		"mode":          sess.Mode,
		"ai_character":  sess.AICharacter,
		"simulation_id": sess.SimulationID,
	}
}
