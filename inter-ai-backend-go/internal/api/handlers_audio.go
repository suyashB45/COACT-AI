package api

import (
	"context"
	"fmt"
	"log"
	"math"
	"os"
	"path/filepath"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/sashabaranov/go-openai"
	"github.com/suyashB45/inter-ai-backend-go/internal/llm"
)

type SpeechMetrics struct {
	TotalWords      int            `json:"total_words"`
	FillerCount     int            `json:"filler_count"`
	FillerRatio     float64        `json:"filler_ratio"`
	FillerBreakdown map[string]int `json:"filler_breakdown"`
	WPM             *int           `json:"wpm"`
	WPMLabel        *string        `json:"wpm_label"`
}

func TranscribeAudio(c *fiber.Ctx) error {
	file, err := c.FormFile("file")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "No audio file uploaded"})
	}

	whisperModel := os.Getenv("WHISPER_DEPLOYMENT_NAME")
	if whisperModel == "" {
		whisperModel = "whisper"
	}

	// Save to temp file
	tempDir := os.TempDir()
	tempFilePath := filepath.Join(tempDir, file.Filename)
	if err := c.SaveFile(file, tempFilePath); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to save temp file"})
	}
	defer os.Remove(tempFilePath) // Clean up ALWAYS

	log.Printf("[INFO] Transcribing audio with Whisper (Deployment: %s)...", whisperModel)

	req := openai.AudioRequest{
		Model:       whisperModel,
		FilePath:    tempFilePath,
		Language:    "en",
		Temperature: 0,
	}

	res, err := llm.Client.CreateTranscription(context.Background(), req)
	if err != nil {
		log.Printf("[ERROR] STT Transcription Error: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	transcribedText := strings.TrimSpace(res.Text)

	// Filter common Whisper silence hallucinations
	lowerText := strings.ToLower(transcribedText)
	silenceHallucinations := []string{
		"thank you.", "thank you", "thanks for watching.", "thanks for watching",
		"amara.org", "you", "um, let's start the conversation.",
		"hello. yes, i understand. okay.", "hello.", "okay.",
	}
	for _, h := range silenceHallucinations {
		if lowerText == h {
			transcribedText = ""
			break
		}
	}

	log.Printf("[SUCCESS] Transcribed: %s", transcribedText)

	// -- SPEECH ANALYSIS --
	var metrics *SpeechMetrics
	if transcribedText != "" {
		words := strings.Fields(transcribedText)
		totalWords := len(words)
		fillerWords := []string{"um", "uh", "like", "you know", "sort of", "kind of", "basically", "actually", "literally", "right"}
		
		fillerCount := 0
		fillerBreakdown := make(map[string]int)
		for _, filler := range fillerWords {
			count := strings.Count(lowerText, filler)
			if count > 0 {
				fillerCount += count
				fillerBreakdown[filler] = count
			}
		}

		var fillerRatio float64
		if totalWords > 0 {
			fillerRatio = math.Round((float64(fillerCount)/float64(totalWords))*1000) / 1000
		}

		durationSeconds := c.FormValue("duration_seconds")
		var wpm *int
		var wpmLabel *string
		if durationSeconds != "" {
			var ds float64
			fmt.Sscanf(durationSeconds, "%f", &ds)
			if ds > 0 {
				w := int(math.Round(float64(totalWords) / (ds / 60)))
				wpm = &w
				label := "Confident"
				if w > 160 {
					label = "Anxious/Rushed"
				} else if w < 100 {
					label = "Uncertain/Hesitant"
				}
				wpmLabel = &label
			}
		}

		metrics = &SpeechMetrics{
			TotalWords:      totalWords,
			FillerCount:     fillerCount,
			FillerRatio:     fillerRatio,
			FillerBreakdown: fillerBreakdown,
			WPM:             wpm,
			WPMLabel:        wpmLabel,
		}
	}

	return c.JSON(fiber.Map{
		"text":           transcribedText,
		"audio_url":      nil,
		"speech_metrics": metrics,
	})
}

func SpeakText(c *fiber.Ctx) error {
	type SpeakPayload struct {
		Text  string `json:"text"`
		Voice string `json:"voice"`
	}

	var payload SpeakPayload
	if err := c.BodyParser(&payload); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid payload"})
	}

	if payload.Text == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "No text provided"})
	}
	if payload.Voice == "" {
		payload.Voice = "alloy"
	}

	defaultModel := openai.TTSModel1
	if llm.IsAzure {
		defaultModel = "tts" // Azure fallback
	}
	ttsModel := os.Getenv("TTS_MODEL_NAME")
	if azureTTS := os.Getenv("AZURE_OPENAI_TTS_DEPLOYMENT"); azureTTS != "" {
		ttsModel = azureTTS
	}
	if ttsModel == "" {
		ttsModel = string(defaultModel)
	}

	// Avoid printing massive lines to logs
	preview := payload.Text
	if len(preview) > 80 {
		preview = preview[:80]
	}
	log.Printf("[INFO] Generating TTS for: '%s...' voice=%s model=%s", preview, payload.Voice, ttsModel)

	req := openai.CreateSpeechRequest{
		Model:          openai.SpeechModel(ttsModel),
		Input:          payload.Text,
		Voice:          openai.SpeechVoice(payload.Voice),
		ResponseFormat: openai.SpeechResponseFormatMp3,
	}

	res, err := llm.Client.CreateSpeech(context.Background(), req)
	if err != nil {
		log.Printf("[ERROR] TTS Error: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	c.Set("Content-Type", "audio/mpeg")
	return c.SendStream(res)
}
