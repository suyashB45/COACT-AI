package database

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/suyashB45/inter-ai-backend-go/internal/models"
)

func SaveSessionToDB(session *models.Session) error {
	if SupabaseURL == "" || SupabaseKey == "" || session.UserID == nil {
		return nil // skip silently if DB is not configured or user is guest
	}

	// Calculate score
	var score *float64
	if session.ReportData != nil {
		if reportDataMap, ok := session.ReportData.(map[string]interface{}); ok {
			if meta, ok := reportDataMap["meta"].(map[string]interface{}); ok {
				if gradeStr, ok := meta["overall_grade"].(string); ok && strings.Contains(gradeStr, "/") {
					parts := strings.Split(gradeStr, "/")
					var parsed float64
					if n, err := fmt.Sscanf(parts[0], "%f", &parsed); err == nil && n == 1 {
						score = &parsed
					}
				}
			}
		}
	}

	// Map to Supabase table schema
	data := map[string]interface{}{
		"session_id":    session.ID,
		"user_id":       *session.UserID,
		"scenario_type": session.ScenarioType,
		"session_mode":  session.SessionMode,
		"title":         session.Title,
		"ai_character":  session.AICharacter,
		"mode":          session.Mode,
		"role":          session.Role,
		"ai_role":       session.AIRole,
		"scenario":      session.Scenario,
		"framework":     session.Framework,
		"transcript":    session.Transcript,
		"report_data":   session.ReportData,
		"completed":     session.Completed,
		"created_at":    session.CreatedAt,
		"score":         score,
	}

	bodyBytes, _ := json.Marshal(data)
	url := fmt.Sprintf("%s/rest/v1/practice_history?session_id=eq.%s", SupabaseURL, session.ID)

	req, err := http.NewRequest("PATCH", url, bytes.NewBuffer(bodyBytes))
	if err != nil {
		return err
	}

	req.Header.Set("apikey", SupabaseServiceKey)
	req.Header.Set("Authorization", "Bearer "+SupabaseServiceKey)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound || resp.StatusCode == http.StatusBadRequest || resp.StatusCode == http.StatusNotAcceptable {
		// Try INSERT if patch failed
		url = fmt.Sprintf("%s/rest/v1/practice_history", SupabaseURL)
		req, _ = http.NewRequest("POST", url, bytes.NewBuffer(bodyBytes))
		req.Header.Set("apikey", SupabaseServiceKey)
		req.Header.Set("Authorization", "Bearer "+SupabaseServiceKey)
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Prefer", "resolution=merge-duplicates")
		respIns, err := client.Do(req)
		if err == nil {
			respIns.Body.Close()
		}
	}

	return nil
}

func GetSessionFromDB(sessionID string) (*models.Session, error) {
	if SupabaseURL == "" || SupabaseKey == "" {
		return nil, fmt.Errorf("db not configured")
	}

	url := fmt.Sprintf("%s/rest/v1/practice_history?session_id=eq.%s&select=*", SupabaseURL, sessionID)
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("apikey", SupabaseServiceKey)
	req.Header.Set("Authorization", "Bearer "+SupabaseServiceKey)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("session not found")
	}

	// Unmarshal raw JSON
	var rawSessions []map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&rawSessions); err != nil {
		return nil, err
	}

	if len(rawSessions) == 0 {
		return nil, nil
	}
	
	return mapRawToSession(rawSessions[0]), nil
}

func GetUserSessionsFromDB(userID string, limit int, completedOnly bool) ([]models.Session, error) {
	if SupabaseURL == "" || SupabaseKey == "" {
		return nil, fmt.Errorf("db not configured")
	}

	completedFilter := ""
	if completedOnly {
		completedFilter = "&completed=eq.true"
	}

	limitFilter := ""
	if limit > 0 {
		limitFilter = fmt.Sprintf("&limit=%d", limit)
	}

	url := fmt.Sprintf("%s/rest/v1/practice_history?user_id=eq.%s%s%s&order=created_at.desc", SupabaseURL, userID, completedFilter, limitFilter)
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("apikey", SupabaseServiceKey)
	req.Header.Set("Authorization", "Bearer "+SupabaseServiceKey)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var rawSessions []map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&rawSessions); err != nil {
		return nil, err
	}

	var sessions []models.Session
	for _, raw := range rawSessions {
		sessions = append(sessions, *mapRawToSession(raw))
	}

	return sessions, nil
}

func mapRawToSession(raw map[string]interface{}) *models.Session {
	sess := &models.Session{}
	
	if val, ok := raw["session_id"].(string); ok { sess.ID = val }
	if val, ok := raw["user_id"].(string); ok { sess.UserID = &val }
	if val, ok := raw["scenario_type"].(string); ok { sess.ScenarioType = val }
	if val, ok := raw["session_mode"].(string); ok { sess.SessionMode = val }
	if val, ok := raw["title"].(string); ok { sess.Title = val }
	if val, ok := raw["ai_character"].(string); ok { sess.AICharacter = val }
	if val, ok := raw["mode"].(string); ok { sess.Mode = val }
	if val, ok := raw["role"].(string); ok { sess.Role = val }
	if val, ok := raw["ai_role"].(string); ok { sess.AIRole = val }
	if val, ok := raw["scenario"].(string); ok { sess.Scenario = val }
	if val, ok := raw["created_at"].(string); ok { sess.CreatedAt = val }
	if val, ok := raw["completed"].(bool); ok { sess.Completed = val }
	
	sess.Framework = raw["framework"]
	sess.ReportData = raw["report_data"]
	
	// Default transcript if parsing gets complex (can add full decompressor if needed)
	if _, ok := raw["transcript"].([]interface{}); ok {
		// Just relying on fresh session loads for now
	}
	return sess
}
