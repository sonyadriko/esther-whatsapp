package whatsapp

import (
	"context"
	"fmt"
	"log"
	"math/rand"
	"time"

	"esther-whatsapp/internal/config"

	waProto "go.mau.fi/whatsmeow/binary/proto"
	"go.mau.fi/whatsmeow/types"
	"google.golang.org/protobuf/proto"
)

// SendSafe sends a message with random delay for natural behavior
func SendSafe(recipient types.JID, text string, msgType string) error {
	if Client == nil {
		return fmt.Errorf("client not initialized")
	}

	if !Client.IsConnected() {
		return fmt.Errorf("client not connected")
	}

	// Random delay between MinDelaySeconds and MaxDelaySeconds
	minDelay := config.AppConfig.MinDelaySeconds
	maxDelay := config.AppConfig.MaxDelaySeconds
	delay := time.Duration(rand.Intn(maxDelay-minDelay+1)+minDelay) * time.Second

	log.Printf("⏳ Waiting %v before sending to %s", delay, recipient.User)
	time.Sleep(delay)

	// Create message
	msg := &waProto.Message{
		Conversation: proto.String(text),
	}

	// Send message
	resp, err := Client.SendMessage(context.Background(), recipient, msg)
	if err != nil {
		log.Printf("❌ Failed to send message: %v", err)
		return err
	}

	log.Printf("✅ Message sent to %s (ID: %s)", recipient.User, resp.ID)
	return nil
}

// SendToPhone sends a message to a phone number
func SendToPhone(phone string, text string, msgType string) error {
	// Format phone number to JID
	jid := types.NewJID(phone, types.DefaultUserServer)
	return SendSafe(jid, text, msgType)
}
