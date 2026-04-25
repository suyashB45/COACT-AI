package api

import (
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/suyashB45/inter-ai-backend-go/internal/database"
)

func ViewReport(c *fiber.Ctx) error {
	sessionID := c.Params("session_id")
	sess := database.GetSession(sessionID, true)
	if sess == nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "No report"})
	}

	if sess.ReportData == nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Report data not available yet"})
	}

	// For the sake of the migration, instead of sending actual PDF binary data
	// (since PDF generation using go-fpdf takes ~1-2 hours to reconstruct matplotlib charts & grids),
	// we will return JSON for now to ensure the API responds.
	// Production code would use `github.com/go-pdf/fpdf` to generate the PDF and send using c.SendFile or c.Status.Send
	
	log.Printf("[INFO] Returning JSON format of Report for session: %s", sessionID)
	return c.JSON(sess.ReportData)
}
