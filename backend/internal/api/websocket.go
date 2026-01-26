package api

import (
	"log"
	"net/http"

	"esther-whatsapp/internal/whatsapp"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins for development
	},
}

type QRMessage struct {
	Type string `json:"type"` // qr, success, timeout, error, connected
	Code string `json:"code,omitempty"`
}

// HandleQRWebSocket handles QR code WebSocket for legacy single-account mode
func HandleQRWebSocket(c *gin.Context) {
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("WebSocket upgrade error: %v", err)
		return
	}
	defer conn.Close()

	if whatsapp.IsLoggedIn() {
		conn.WriteJSON(QRMessage{Type: "connected"})
		return
	}

	qrChan, err := whatsapp.GetNewQRChannel()
	if err != nil {
		log.Printf("❌ Failed to get QR channel: %v", err)
		conn.WriteJSON(QRMessage{Type: "error", Code: err.Error()})
		return
	}

	log.Println("📷 Waiting for QR code...")

	for evt := range qrChan {
		switch evt.Event {
		case "code":
			log.Printf("📷 QR Code generated, sending to client")
			err := conn.WriteJSON(QRMessage{Type: "qr", Code: evt.Code})
			if err != nil {
				log.Printf("❌ Error sending QR: %v", err)
				return
			}
		case "success":
			log.Println("✅ QR scan successful")
			conn.WriteJSON(QRMessage{Type: "success"})
			return
		case "timeout":
			log.Println("⏰ QR timeout")
			conn.WriteJSON(QRMessage{Type: "timeout"})
			return
		}
	}
	log.Println("📱 QR channel closed")
}

// HandleAccountQRWebSocket handles QR code WebSocket for a specific account
func HandleAccountQRWebSocket(c *gin.Context) {
	accountID := c.Param("id")
	if accountID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "account id is required"})
		return
	}

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("WebSocket upgrade error: %v", err)
		return
	}
	defer conn.Close()

	account, exists := whatsapp.Manager.GetAccount(accountID)
	if !exists {
		conn.WriteJSON(QRMessage{Type: "error", Code: "Account not found"})
		return
	}

	if account.IsLoggedIn {
		conn.WriteJSON(QRMessage{Type: "connected"})
		return
	}

	qrChan, err := whatsapp.Manager.GetQRChannel(accountID)
	if err != nil {
		log.Printf("❌ Failed to get QR channel for account %s: %v", accountID, err)
		conn.WriteJSON(QRMessage{Type: "error", Code: err.Error()})
		return
	}

	log.Printf("📷 [%s] Waiting for QR code...", account.Name)

	for evt := range qrChan {
		switch evt.Event {
		case "code":
			log.Printf("📷 [%s] QR Code generated, sending to client", account.Name)
			err := conn.WriteJSON(QRMessage{Type: "qr", Code: evt.Code})
			if err != nil {
				log.Printf("❌ Error sending QR: %v", err)
				return
			}
		case "success":
			log.Printf("✅ [%s] QR scan successful", account.Name)
			conn.WriteJSON(QRMessage{Type: "success"})
			return
		case "timeout":
			log.Printf("⏰ [%s] QR timeout", account.Name)
			conn.WriteJSON(QRMessage{Type: "timeout"})
			return
		}
	}
	log.Printf("📱 [%s] QR channel closed", account.Name)
}
