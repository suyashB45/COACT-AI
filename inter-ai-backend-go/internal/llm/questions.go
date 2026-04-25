package llm

import (
	"encoding/json"
	"log"
	"os"
	"path/filepath"
	"sync"
)

// QuestionsData holds the loaded framework questions (thread-safe)
var (
	questionsData []map[string]interface{}
	questionsMu   sync.RWMutex
)

// LoadQuestions loads framework_questions.json from the given base directory or its parents.
// Mirrors Python's load_questions() which reads from QUESTIONS_FILE = BASE_DIR/framework_questions.json
func LoadQuestions(baseDir string) {
	fileName := "framework_questions.json"

	// Search in: local data folder first, then siblings
	searchDirs := []string{
		filepath.Join(baseDir, "data"),
		baseDir,
		filepath.Join(baseDir, "..", "inter-ai-backend"),
		filepath.Join(baseDir, "..", "..", "inter-ai-backend"),
	}

	// Also try walking up from CWD
	cwd, _ := os.Getwd()
	searchDirs = append(searchDirs,
		filepath.Join(cwd, "data"),
		cwd,
		filepath.Join(cwd, "..", "inter-ai-backend"),
	)

	for _, dir := range searchDirs {
		p := filepath.Join(dir, fileName)
		absPath, _ := filepath.Abs(p)
		if _, err := os.Stat(absPath); err == nil {
			data, err := os.ReadFile(absPath)
			if err != nil {
				log.Printf("[WARNING] Found %s but could not read it: %v", absPath, err)
				continue
			}
			var questions []map[string]interface{}
			if err := json.Unmarshal(data, &questions); err != nil {
				log.Printf("[WARNING] Could not parse %s: %v", absPath, err)
				continue
			}
			questionsMu.Lock()
			questionsData = questions
			questionsMu.Unlock()
			log.Printf("[SUCCESS] Loaded %d questions from %s", len(questions), absPath)
			return
		}
	}

	log.Printf("[WARNING] framework_questions.json not found. Coaching tip suggestions will be disabled.")
}

// GetQuestionsData returns a safe copy of the loaded questions
func GetQuestionsData() []map[string]interface{} {
	questionsMu.RLock()
	defer questionsMu.RUnlock()
	return questionsData
}
