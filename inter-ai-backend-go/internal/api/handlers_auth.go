package api

import (
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/suyashB45/inter-ai-backend-go/internal/database"
)

func SyncUser(c *fiber.Ctx) error {
	authHeader := c.Get("Authorization")
	if authHeader == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "No token provided"})
	}

	token := strings.Replace(authHeader, "Bearer ", "", 1)
	user, err := database.GetUserFromToken(token)
	if err != nil || user == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid token", "success": false})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"user": fiber.Map{
			"id":    user.ID,
			"email": user.Email,
		},
	})
}
