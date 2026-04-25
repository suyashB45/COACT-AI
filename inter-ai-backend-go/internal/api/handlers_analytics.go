package api

import (
	"fmt"
	"math"
	"sort"
	"strconv"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/suyashB45/inter-ai-backend-go/internal/database"
)

// GetReportData returns the report_data JSON for a specific session.
// Called by frontend Report page: GET /api/session/:session_id/report_data
func GetReportData(c *fiber.Ctx) error {
	sessionID := c.Params("session_id")
	sess := database.GetSession(sessionID, true) // force DB refresh for latest data
	if sess == nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Session not found"})
	}

	if sess.ReportData == nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Report data not available yet"})
	}

	return c.JSON(sess.ReportData)
}

// GetUserSessions returns a paginated list of the user's sessions.
// Called by frontend Dashboard: GET /api/user/sessions?limit=5
func GetUserSessions(c *fiber.Ctx) error {
	authHeader := c.Get("Authorization")
	if authHeader == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}

	token := strings.Replace(authHeader, "Bearer ", "", 1)
	user, err := database.GetUserFromToken(token)
	if err != nil || user == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid token"})
	}

	limitStr := c.Query("limit", "10")
	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit <= 0 {
		limit = 10
	}

	sessions, err := database.GetUserSessionsFromDB(user.ID, limit, false)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	var sessionItems []fiber.Map
	for _, s := range sessions {
		var score *float64
		if reportDataMap, ok := s.ReportData.(map[string]interface{}); ok {
			if meta, ok := reportDataMap["meta"].(map[string]interface{}); ok {
				if gradeStr, ok := meta["overall_grade"].(string); ok && strings.Contains(gradeStr, "/") {
					parts := strings.Split(gradeStr, "/")
					var parsed float64
					if _, err := fmt.Sscanf(parts[0], "%f", &parsed); err == nil {
						score = &parsed
					}
				}
			}
		}

		sessionItems = append(sessionItems, fiber.Map{
			"id":           s.ID,
			"session_id":   s.ID,
			"created_at":   s.CreatedAt,
			"role":         s.Role,
			"ai_role":      s.AIRole,
			"scenario":     s.Scenario,
			"title":        s.Title,
			"score":        score,
			"session_mode": s.SessionMode,
			"completed":    s.Completed,
		})
	}

	if sessionItems == nil {
		sessionItems = []fiber.Map{}
	}

	return c.JSON(fiber.Map{
		"sessions": sessionItems,
	})
}

// GetAnalytics computes analytics from a user's completed sessions.
// Called by frontend Dashboard: GET /api/analytics
func GetAnalytics(c *fiber.Ctx) error {
	authHeader := c.Get("Authorization")
	if authHeader == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}

	token := strings.Replace(authHeader, "Bearer ", "", 1)
	user, err := database.GetUserFromToken(token)
	if err != nil || user == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid token"})
	}

	sessions, err := database.GetUserSessionsFromDB(user.ID, 0, true) // completed only
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	if len(sessions) == 0 {
		return c.JSON(fiber.Map{
			"performance_trend":  []interface{}{},
			"all_time_average":   0,
			"consistency_index":  0,
			"strongest_skills":   []interface{}{},
			"weakest_skills":     []interface{}{},
			"session_counts":     fiber.Map{"total": 0, "completed": 0},
			"improvement_status": "no_data",
			"repeated_scenarios": []interface{}{},
		})
	}

	// --- Extract scores from sessions ---
	type scoredSession struct {
		Date         string
		Score        float64
		ScenarioType string
		Title        string
	}

	var scored []scoredSession
	skillTotals := map[string][]float64{}

	for _, s := range sessions {
		reportDataMap, ok := s.ReportData.(map[string]interface{})
		if !ok {
			continue
		}

		meta, ok := reportDataMap["meta"].(map[string]interface{})
		if !ok {
			continue
		}

		gradeStr, ok := meta["overall_grade"].(string)
		if !ok || !strings.Contains(gradeStr, "/") {
			continue
		}

		parts := strings.Split(gradeStr, "/")
		var parsed float64
		if _, err := fmt.Sscanf(parts[0], "%f", &parsed); err != nil {
			continue
		}

		scenarioType := s.ScenarioType
		if scenarioType == "" {
			scenarioType = "custom"
		}

		scored = append(scored, scoredSession{
			Date:         s.CreatedAt,
			Score:        parsed,
			ScenarioType: scenarioType,
			Title:        s.Title,
		})

		// Extract dimension scores from scorecard
		if scorecard, ok := reportDataMap["scorecard"].([]interface{}); ok {
			for _, item := range scorecard {
				if sc, ok := item.(map[string]interface{}); ok {
					dimension, _ := sc["dimension"].(string)
					scoreStr, _ := sc["score"].(string)
					if dimension != "" && scoreStr != "" && strings.Contains(scoreStr, "/") {
						dimParts := strings.Split(scoreStr, "/")
						var dimScore float64
						if _, err := fmt.Sscanf(dimParts[0], "%f", &dimScore); err == nil {
							skillTotals[dimension] = append(skillTotals[dimension], dimScore)
						}
					}
				}
			}
		}
	}

	if len(scored) == 0 {
		return c.JSON(fiber.Map{
			"performance_trend":  []interface{}{},
			"all_time_average":   0,
			"consistency_index":  0,
			"strongest_skills":   []interface{}{},
			"weakest_skills":     []interface{}{},
			"session_counts":     fiber.Map{"total": len(sessions), "completed": len(sessions)},
			"improvement_status": "no_data",
			"repeated_scenarios": []interface{}{},
		})
	}

	// --- Performance trend (sorted by date) ---
	sort.Slice(scored, func(i, j int) bool { return scored[i].Date < scored[j].Date })
	var performanceTrend []fiber.Map
	for _, s := range scored {
		performanceTrend = append(performanceTrend, fiber.Map{
			"date":          s.Date,
			"score":         s.Score,
			"scenario_type": s.ScenarioType,
		})
	}

	// --- All-time average ---
	var totalScore float64
	for _, s := range scored {
		totalScore += s.Score
	}
	allTimeAverage := math.Round((totalScore/float64(len(scored)))*10) / 10

	// --- Consistency index (100 - coefficient of variation) ---
	var variance float64
	for _, s := range scored {
		diff := s.Score - allTimeAverage
		variance += diff * diff
	}
	stdDev := math.Sqrt(variance / float64(len(scored)))
	consistencyIndex := 0
	if allTimeAverage > 0 {
		cv := (stdDev / allTimeAverage) * 100
		consistencyIndex = int(math.Max(0, math.Min(100, 100-cv)))
	}

	// --- Improvement status ---
	improvementStatus := "stable"
	if len(scored) >= 3 {
		recentN := 3
		if recentN > len(scored) {
			recentN = len(scored)
		}
		var recentAvg float64
		for _, s := range scored[len(scored)-recentN:] {
			recentAvg += s.Score
		}
		recentAvg /= float64(recentN)

		if recentAvg > allTimeAverage+0.5 {
			improvementStatus = "improving"
		} else if recentAvg < allTimeAverage-0.5 {
			improvementStatus = "declining"
		}
	} else {
		improvementStatus = "insufficient_data"
	}

	// --- Skill averages ---
	type skillAvg struct {
		Dimension string  `json:"dimension"`
		Average   float64 `json:"average"`
		Count     int     `json:"count"`
	}

	var allSkills []skillAvg
	for dim, scores := range skillTotals {
		var sum float64
		for _, v := range scores {
			sum += v
		}
		avg := math.Round((sum/float64(len(scores)))*10) / 10
		allSkills = append(allSkills, skillAvg{Dimension: dim, Average: avg, Count: len(scores)})
	}

	// Sort by average
	sort.Slice(allSkills, func(i, j int) bool { return allSkills[i].Average > allSkills[j].Average })

	topN := 5
	if topN > len(allSkills) {
		topN = len(allSkills)
	}
	strongestSkills := allSkills[:topN]

	sort.Slice(allSkills, func(i, j int) bool { return allSkills[i].Average < allSkills[j].Average })
	bottomN := 5
	if bottomN > len(allSkills) {
		bottomN = len(allSkills)
	}
	weakestSkills := allSkills[:bottomN]

	// --- Session counts by scenario type ---
	sessionCounts := map[string]int{"total": len(sessions), "completed": len(sessions)}
	for _, s := range scored {
		sessionCounts[s.ScenarioType]++
	}

	// --- Repeated scenarios ---
	type scenarioAttempt struct {
		Title      string
		Scores     []float64
		FirstScore float64
		LastScore  float64
	}
	scenarioMap := map[string]*scenarioAttempt{}
	for _, s := range scored {
		key := s.Title
		if key == "" {
			key = s.ScenarioType
		}
		if _, exists := scenarioMap[key]; !exists {
			scenarioMap[key] = &scenarioAttempt{Title: key}
		}
		scenarioMap[key].Scores = append(scenarioMap[key].Scores, s.Score)
	}

	var repeatedScenarios []fiber.Map
	for _, sa := range scenarioMap {
		if len(sa.Scores) >= 2 {
			repeatedScenarios = append(repeatedScenarios, fiber.Map{
				"title":        sa.Title,
				"attempts":     len(sa.Scores),
				"first_score":  sa.Scores[0],
				"latest_score": sa.Scores[len(sa.Scores)-1],
				"change":       math.Round((sa.Scores[len(sa.Scores)-1]-sa.Scores[0])*10) / 10,
			})
		}
	}

	if repeatedScenarios == nil {
		repeatedScenarios = []fiber.Map{}
	}

	return c.JSON(fiber.Map{
		"performance_trend":  performanceTrend,
		"all_time_average":   allTimeAverage,
		"consistency_index":  consistencyIndex,
		"strongest_skills":   strongestSkills,
		"weakest_skills":     weakestSkills,
		"session_counts":     sessionCounts,
		"improvement_status": improvementStatus,
		"repeated_scenarios": repeatedScenarios,
	})
}
