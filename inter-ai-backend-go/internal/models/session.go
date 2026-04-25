package models

type TranscriptMsg struct {
	Role     string  `json:"role"`
	Content  string  `json:"content"`
	AudioURL *string `json:"audio_url,omitempty"`
}

type CharacterConfig struct {
	Name  string `json:"name"`
	Label string `json:"label"`
	Voice string `json:"voice"`
	Color string `json:"color"`
}

type SessionMeta struct {
	FrameworkCounts map[string]int `json:"framework_counts"`
	RelevanceIssues int            `json:"relevance_issues"`
}

type Session struct {
	ID              string            `json:"id"`
	CreatedAt       string            `json:"created_at"`
	Role            string            `json:"role"`
	AIRole          string            `json:"ai_role"`
	Scenario        string            `json:"scenario"`
	Title           string            `json:"title"`
	Framework       interface{}       `json:"framework"` // Can be string or []string based on python code
	ScenarioType    string            `json:"scenario_type"`
	Mode            string            `json:"mode"`
	SessionMode     string            `json:"session_mode"`
	Transcript      []TranscriptMsg   `json:"transcript"`
	ReportData      interface{}       `json:"report_data"` // Will be typed strictly later
	Completed       bool              `json:"completed"`
	ReportFile      *string           `json:"report_file"`
	UserID          *string           `json:"user_id"`
	UserName        string            `json:"user_name,omitempty"`
	AICharacter     string            `json:"ai_character"`
	SimulationID    string            `json:"simulation_id"`
	MultiCharacters bool              `json:"multi_characters"`
	Characters      []CharacterConfig `json:"characters"`
	Meta            SessionMeta       `json:"meta"`
}
