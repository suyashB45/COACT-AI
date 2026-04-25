package database

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

func InsertContactSubmission(name, email, company, teamSize, message string) error {
	if SupabaseURL == "" || SupabaseKey == "" {
		return fmt.Errorf("supabase is not configured")
	}

	payload := map[string]string{
		"name":      name,
		"email":     email,
		"company":   company,
		"team_size": teamSize,
		"message":   message,
		"status":    "new",
	}
	bodyBytes, _ := json.Marshal(payload)

	url := fmt.Sprintf("%s/rest/v1/contact_submissions", SupabaseURL)
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(bodyBytes))
	if err != nil {
		return err
	}

	req.Header.Set("apikey", SupabaseKey)
	req.Header.Set("Authorization", "Bearer "+SupabaseKey)
	req.Header.Set("Content-Type", "application/json")
	// return representation header is minimal by default

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return fmt.Errorf("supabase returned status %d", resp.StatusCode)
	}

	return nil
}
