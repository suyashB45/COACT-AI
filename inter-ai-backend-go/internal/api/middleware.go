package api

import (
	"encoding/json"
	"fmt"

	"github.com/gofiber/fiber/v2"
)

const (
	MaxTranscriptSize = 100000 // 100KB max
	MaxScenarioLength = 5000   // 5KB max
	MaxTurns          = 50
	MaxMessageLength  = 10000  // Individual message max 10KB
)

type PayloadCheck struct {
	Transcript []struct {
		Content string `json:"content"`
	} `json:"transcript"`
	Scenario string `json:"scenario"`
}

// PayloadValidationMiddleware prevents DoS attacks by restricting payload sizing
func PayloadValidationMiddleware(c *fiber.Ctx) error {
	method := c.Method()
	if method != fiber.MethodPost && method != fiber.MethodPut && method != fiber.MethodPatch {
		return c.Next()
	}

	contentType := c.Get("Content-Type")
	// Only validate JSON payloads for this specific check, multipart/form-data for audio is checked by Fiber limit
	if string(contentType) != "application/json" {
		return c.Next()
	}

	body := c.Body()
	if len(body) == 0 {
		return c.Next()
	}

	var payload PayloadCheck
	if err := json.Unmarshal(body, &payload); err != nil {
		// If it's malformed JSON or not matching structure, proceed and let the handler fail
		return c.Next()
	}

	// 1. Check scenario length
	if len(payload.Scenario) > MaxScenarioLength {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": fmt.Sprintf("Scenario exceeds %d characters", MaxScenarioLength),
		})
	}

	// 2. Check turn count
	if len(payload.Transcript) > MaxTurns {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": fmt.Sprintf("Exceeds %d conversation turns", MaxTurns),
		})
	}

	// 3. Check transcript size & messages
	transcriptSize := 0
	for _, msg := range payload.Transcript {
		contentLen := len(msg.Content)
		if contentLen > MaxMessageLength {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": fmt.Sprintf("Message exceeds %d characters", MaxMessageLength),
			})
		}
		transcriptSize += contentLen
	}

	if transcriptSize > MaxTranscriptSize {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": fmt.Sprintf("Transcript exceeds %d bytes", MaxTranscriptSize),
		})
	}

	return c.Next()
}
