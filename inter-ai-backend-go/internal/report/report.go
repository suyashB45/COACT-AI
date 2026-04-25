package report

import (
	"encoding/json"
	"fmt"
	"path/filepath"

	"github.com/go-pdf/fpdf"
	"github.com/suyashB45/inter-ai-backend-go/internal/models"
)

// GenerateReport uses go-fpdf to create a placeholder/simplified version of the Python report
// Porting the 3000-line fpdf + matplotlib python code exactly requires custom graphing packages and days of formatting.
// This is an approximate implementation of the report generation component.
func GenerateReport(session *models.Session, reportData map[string]interface{}) (string, error) {
	pdf := fpdf.New("P", "mm", "A4", "")
	pdf.AddPage()
	
	// Title
	pdf.SetFont("Arial", "B", 18)
	pdf.CellFormat(0, 15, "Roleplay Simulation Report", "0", 1, "C", false, 0, "")
	pdf.Ln(5)

	// Metadata
	pdf.SetFont("Arial", "B", 12)
	pdf.Cell(40, 10, fmt.Sprintf("User Role: %s", session.Role))
	pdf.Ln(8)
	pdf.Cell(40, 10, fmt.Sprintf("AI Role: %s", session.AIRole))
	pdf.Ln(8)
	pdf.Cell(40, 10, fmt.Sprintf("Scenario: %s", session.ScenarioType))
	pdf.Ln(8)
	pdf.Cell(40, 10, fmt.Sprintf("Mode: %s", session.SessionMode))
	pdf.Ln(15)

	// Inject extracted metrics
	pdf.SetFont("Arial", "B", 14)
	pdf.Cell(40, 10, "Summary & Evaluation")
	pdf.Ln(10)
	
	pdf.SetFont("Arial", "", 10)
	dataBytes, _ := json.MarshalIndent(reportData, "", "  ")
	pdf.MultiCell(0, 6, string(dataBytes), "", "L", false)

	// Save Output
	outputPath := filepath.Join("..", "reports", fmt.Sprintf("%s_report.pdf", session.ID))
	err := pdf.OutputFileAndClose(outputPath)
	if err != nil {
		return "", fmt.Errorf("failed to generate PDF: %w", err)
	}

	return outputPath, nil
}
