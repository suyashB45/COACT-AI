package api

import (
	"log"
	"regexp"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/suyashB45/inter-ai-backend-go/internal/database"
)

func HealthCheck(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{
		"status":    "healthy",
		"timestamp": time.Now().Format(time.RFC3339),
		"version":   "enhanced-reports-v1.0-go",
	})
}

func ContactSales(c *fiber.Ctx) error {
	type ContactPayload struct {
		Name     string `json:"name"`
		Email    string `json:"email"`
		Company  string `json:"company"`
		TeamSize string `json:"teamSize"`
		Message  string `json:"message"`
	}

	var payload ContactPayload
	if err := c.BodyParser(&payload); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid JSON"})
	}

	// Truncate fields as per Python
	truncate := func(s string, l int) string {
		if len(s) > l {
			return s[:l]
		}
		return s
	}

	name := truncate(payload.Name, 200)
	email := truncate(payload.Email, 254)
	company := truncate(payload.Company, 200)
	teamSize := truncate(payload.TeamSize, 50)
	message := truncate(payload.Message, 2000)

	if name == "" || email == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Name and email are required"})
	}

	// Basic email format validation
	emailRegex := regexp.MustCompile(`^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`)
	if !emailRegex.MatchString(email) {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid email format"})
	}

	// We use the database package to insert this contact to supabase
	err := database.InsertContactSubmission(name, email, company, teamSize, message)
	if err != nil {
		log.Printf("[ERROR] Contact form error: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to save contact request"})
	}

	log.Printf("[SUCCESS] Contact form saved: %s (%s)", name, email)
	return c.Status(fiber.StatusOK).JSON(fiber.Map{"success": true})
}
