package api

import (
	"fmt"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/suyashB45/inter-ai-backend-go/internal/database"
)

func GetHistory(c *fiber.Ctx) error {
	authHeader := c.Get("Authorization")
	if authHeader == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized - no Authorization header"})
	}

	token := strings.Replace(authHeader, "Bearer ", "", 1)
	user, err := database.GetUserFromToken(token)
	if err != nil || user == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid token"})
	}

	sessions, err := database.GetUserSessionsFromDB(user.ID, 0, false)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	var historyItems []fiber.Map
	for _, s := range sessions {
		var score float64 = 0

		if reportDataMap, ok := s.ReportData.(map[string]interface{}); ok {
			if meta, ok := reportDataMap["meta"].(map[string]interface{}); ok {
				if gradeStr, ok := meta["overall_grade"].(string); ok && strings.Contains(gradeStr, "/") {
                    // Quick parse logic
                    parts := strings.Split(gradeStr, "/")
                    var parsed float64
                    fmt.Sscanf(parts[0], "%f", &parsed)
                    score = parsed
				}
			}
		}

		scenarioType := s.ScenarioType
		if scenarioType == "" {
			scenarioType = "custom"
		}
		sessionMode := s.SessionMode
		if sessionMode == "" {
			sessionMode = "skill_assessment"
		}

		historyItems = append(historyItems, fiber.Map{
			"session_id":    s.ID,
			"date":          s.CreatedAt,
			"role":          s.Role,
			"ai_role":       s.AIRole,
			"title":         s.Title,
			"scenario":      s.Scenario,
			"scenario_type": scenarioType,
			"session_mode":  sessionMode,
			"completed":     s.Completed,
			"score":         score,
		})
	}

	if historyItems == nil {
		historyItems = []fiber.Map{}
	}

	return c.JSON(historyItems)
}
