package api

import (
	"github.com/gofiber/fiber/v2"
)

func SetupRoutes(app *fiber.App) {
	api := app.Group("/api")

	// Global Payload Validation matching Python check_payload()
	api.Use(PayloadValidationMiddleware)

	api.Get("/health", HealthCheck)
	api.Post("/contact-sales", ContactSales)
	
	// Transcribe and Speak
	api.Post("/transcribe", TranscribeAudio)
	api.Post("/speak", SpeakText)
	
	// Auth
	auth := api.Group("/auth")
	auth.Post("/sync", SyncUser)

	// History
	history := api.Group("/history")
	history.Get("/", GetHistory)

	// Analytics & User Sessions (Dashboard)
	api.Get("/analytics", GetAnalytics)
	user := api.Group("/user")
	user.Get("/sessions", GetUserSessions)

	// Sessions
	session := api.Group("/session")
	session.Post("/start", StartSession)
	session.Post("/:session_id/chat", ChatSession)
	session.Post("/:session_id/complete", CompleteSession)
	session.Get("/:session_id/report_data", GetReportData)

	// Reports
	report := api.Group("/report")
	report.Get("/:session_id", ViewReport)
}
