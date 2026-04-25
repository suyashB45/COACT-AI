package main

import (
	"log"
	"os"
	"path/filepath"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	logger_middleware "github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"

	"github.com/suyashB45/inter-ai-backend-go/internal/api"
	"github.com/suyashB45/inter-ai-backend-go/internal/config"
	"github.com/suyashB45/inter-ai-backend-go/internal/database"
	"github.com/suyashB45/inter-ai-backend-go/internal/llm"
)

func main() {
	// Load .env using custom Python-compatible loader
	// (handles malformed lines, inline comments, etc.)
	config.FindAndLoadEnv()

	// Initialize Supabase, DB Cache and LLM
	database.InitSupabase()
	database.InitCache()
	llm.InitOpenAI()

	// Load framework questions for coaching tip suggestions (matches Python's load_questions())
	execDir, _ := os.Getwd()
	llm.LoadQuestions(execDir)

	app := fiber.New(fiber.Config{
		AppName: "inter-ai-backend-go",
		BodyLimit: 10 * 1024 * 1024, // 10MB limit for audio uploads
	})

	// Middleware
	app.Use(recover.New())
	app.Use(logger_middleware.New())

	// CORS Setup
	origins := os.Getenv("CORS_ORIGINS")
	if origins == "" {
		origins = "*"
	}
	app.Use(cors.New(cors.Config{
		AllowOrigins: origins,
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
        ExposeHeaders: "Content-Disposition", // For PDF downloads
	}))

	// Setup API Routes
	api.SetupRoutes(app)

	// Ensure reports directory exists
	os.MkdirAll(filepath.Join("..", "reports"), os.ModePerm)

	// Start Server
	port := os.Getenv("PORT")
	if port == "" {
		port = "5000" // matching Python default
	}
	log.Printf("Starting server on port %s", port)
	if err := app.Listen(":" + port); err != nil {
		log.Fatalf("Error starting server: %v", err)
	}
}
