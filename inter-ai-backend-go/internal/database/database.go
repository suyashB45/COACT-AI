package database

import (
	"log"
	"os"

	// Mock using community supabase interface or raw rest calls
	// For full DB interaction we will use raw HTTP or a postgrest library
)

var (
	SupabaseURL        string
	SupabaseKey        string
	SupabaseServiceKey string
)

func InitSupabase() {
	SupabaseURL = os.Getenv("SUPABASE_URL")
	SupabaseKey = os.Getenv("SUPABASE_KEY")
	SupabaseServiceKey = os.Getenv("SUPABASE_SERVICE_KEY")
	if SupabaseServiceKey == "" {
		SupabaseServiceKey = SupabaseKey
	}

	if SupabaseURL == "" || SupabaseKey == "" {
		log.Println("[WARNING] Supabase environment variables missing! Database interactions will fail.")
	} else {
		log.Println("[SUCCESS] Supabase config initialized.")
	}
}
