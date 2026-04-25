package llm

import (
	"context"
	"fmt"
	"log"
	"net/url"
	"os"

	"github.com/sashabaranov/go-openai"
)

var (
	Client *openai.Client
	IsAzure bool
)

func InitOpenAI() {
	azureEndpoint := os.Getenv("AZURE_OPENAI_ENDPOINT")
	if azureEndpoint != "" {
		IsAzure = true
		apiKey := os.Getenv("AZURE_OPENAI_API_KEY")
		apiVersion := os.Getenv("AZURE_OPENAI_API_VERSION")
		if apiVersion == "" {
			apiVersion = "2025-03-01-preview"
		}
		
		// Clean the endpoint to just contain scheme://host (Azure expects base url, not project paths)
		if u, err := url.Parse(azureEndpoint); err == nil && u.Host != "" {
			azureEndpoint = u.Scheme + "://" + u.Host
		}
		
		config := openai.DefaultAzureConfig(apiKey, azureEndpoint)
		config.APIVersion = apiVersion
		
		Client = openai.NewClientWithConfig(config)
		log.Println("[SUCCESS] Azure OpenAI client initialized.")
	} else {
		IsAzure = false
		apiKey := os.Getenv("OPENAI_API_KEY")
		if apiKey == "" {
			log.Println("[WARNING] No OPENAI_API_KEY provided.")
		}
		Client = openai.NewClient(apiKey)
		log.Println("[SUCCESS] OpenAI client initialized.")
	}
}

func LLMReply(messages []openai.ChatCompletionMessage, maxTokens int) (string, error) {
	if Client == nil {
		return "", fmt.Errorf("openai client not initialized")
	}

	model := os.Getenv("MODEL_NAME")
	if model == "" {
		model = openai.GPT4oMini
	}
	if IsAzure {
		deploymentName := os.Getenv("AZURE_OPENAI_DEPLOYMENT_NAME")
		if deploymentName != "" {
			model = deploymentName
		}
	}

	req := openai.ChatCompletionRequest{
		Model:       model,
		Messages:    messages,
		MaxTokens:   maxTokens,
		Temperature: 0.1,
	}

	resp, err := Client.CreateChatCompletion(context.Background(), req)
	if err != nil {
		return "", err
	}

	if len(resp.Choices) > 0 {
		return resp.Choices[0].Message.Content, nil
	}

	return "", fmt.Errorf("no choices returned")
}

// LLMReplyFromChatMsgs converts ChatMsg to openai messages and calls LLMReply
func LLMReplyFromChatMsgs(messages []ChatMsg, maxTokens int) (string, error) {
	var openaiMsgs []openai.ChatCompletionMessage
	for _, m := range messages {
		openaiMsgs = append(openaiMsgs, openai.ChatCompletionMessage{
			Role:    m.Role,
			Content: m.Content,
		})
	}
	return LLMReply(openaiMsgs, maxTokens)
}
