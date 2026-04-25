package config

import (
	"bufio"
	"log"
	"os"
	"path/filepath"
	"strings"
)

// LoadEnvFile mimics Python's dotenv behavior:
//   - Skips blank lines and comment lines (starting with #)
//   - Skips malformed lines that don't contain '='
//   - Strips inline comments (unquoted # after value)
//   - Sets values into os environment
func LoadEnvFile(path string) error {
	f, err := os.Open(path)
	if err != nil {
		return err
	}
	defer f.Close()

	scanner := bufio.NewScanner(f)
	lineNum := 0
	loaded := 0

	for scanner.Scan() {
		lineNum++
		line := strings.TrimSpace(scanner.Text())

		// Remove BOM if present (first line of Windows files)
		line = strings.TrimPrefix(line, "\xef\xbb\xbf")

		// Skip empty lines and full-line comments
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}

		// Must contain '=' to be a valid KEY=VALUE pair
		eqIdx := strings.Index(line, "=")
		if eqIdx < 0 {
			log.Printf("[env] Skipping malformed line %d: no '=' found", lineNum)
			continue
		}

		key := strings.TrimSpace(line[:eqIdx])
		value := line[eqIdx+1:]

		// Validate key: must look like a variable name (letters, digits, underscore)
		if !isValidEnvKey(key) {
			log.Printf("[env] Skipping malformed line %d: invalid key %q", lineNum, key)
			continue
		}

		// Handle quoted values (preserve content inside quotes, including #)
		value = strings.TrimSpace(value)
		if (strings.HasPrefix(value, "\"") && strings.HasSuffix(value, "\"")) ||
			(strings.HasPrefix(value, "'") && strings.HasSuffix(value, "'")) {
			// Strip surrounding quotes
			value = value[1 : len(value)-1]
		} else {
			// Strip inline comments for unquoted values
			// Only strip if # is preceded by a space (like Python dotenv)
			if idx := strings.Index(value, " #"); idx >= 0 {
				value = strings.TrimSpace(value[:idx])
			}
		}

		os.Setenv(key, value)
		loaded++
	}

	log.Printf("[env] Loaded %d variables from %s", loaded, path)
	return scanner.Err()
}

func isValidEnvKey(key string) bool {
	if key == "" {
		return false
	}
	for i, ch := range key {
		if ch == '_' {
			continue
		}
		if ch >= 'A' && ch <= 'Z' {
			continue
		}
		if ch >= 'a' && ch <= 'z' {
			continue
		}
		if i > 0 && ch >= '0' && ch <= '9' {
			continue
		}
		return false
	}
	return true
}

// FindAndLoadEnv walks up from cwd looking for .env, just like Python dotenv
func FindAndLoadEnv() bool {
	dir, err := os.Getwd()
	if err != nil {
		return false
	}

	for i := 0; i < 5; i++ {
		p := filepath.Join(dir, ".env")
		if _, err := os.Stat(p); err == nil {
			if err := LoadEnvFile(p); err == nil {
				return true
			} else {
				log.Printf("[env] Error loading %s: %v", p, err)
			}
		}
		parent := filepath.Dir(dir)
		if parent == dir {
			break
		}
		dir = parent
	}

	log.Println("[env] No .env file found, using system environment variables")
	return false
}
