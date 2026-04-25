package database

import (
	"encoding/json"
	"fmt"
	"net/http"
)

type SupabaseUser struct {
	ID    string `json:"id"`
	Email string `json:"email"`
}

func GetUserFromToken(token string) (*SupabaseUser, error) {
	if SupabaseURL == "" || token == "" {
		return nil, fmt.Errorf("missing supabase url or token")
	}

	url := fmt.Sprintf("%s/auth/v1/user", SupabaseURL)
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", "Bearer "+token)
	if SupabaseKey != "" {
		req.Header.Set("apikey", SupabaseKey)
	}

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("invalid token, status: %d", resp.StatusCode)
	}

	var user SupabaseUser
	if err := json.NewDecoder(resp.Body).Decode(&user); err != nil {
		return nil, err
	}

	return &user, nil
}
