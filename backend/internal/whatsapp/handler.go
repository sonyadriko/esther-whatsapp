package whatsapp

import (
	"log"
	"strings"

	"esther-whatsapp/internal/config"
	"esther-whatsapp/internal/store"

	"go.mau.fi/whatsmeow/types"
	"go.mau.fi/whatsmeow/types/events"
)

// Keywords and their responses
var keywordResponses = map[string]string{
	"info":    "Halo 👋\nSelamat datang! Ini adalah bot informasi Esther.\n\nKetik:\n• *jadwal* - Lihat jadwal\n• *bantuan* - Hubungi CS",
	"jadwal":  "📅 Jadwal operasional:\nSenin - Sabtu: 08.00 - 20.00 WIB",
	"bantuan": "🙋 Tim CS kami akan segera menghubungi Anda.\nTerima kasih telah menunggu.",
	"stop":    "✅ Anda telah berhenti berlangganan notifikasi.\nKetik *start* untuk berlangganan kembali.",
	"start":   "✅ Anda telah berlangganan notifikasi.\nKetik *stop* untuk berhenti.",
}

// AddKeyword adds a new keyword response
func AddKeyword(keyword, response string) {
	keywordResponses[strings.ToLower(keyword)] = response
}

// RemoveKeyword removes a keyword
func RemoveKeyword(keyword string) {
	delete(keywordResponses, strings.ToLower(keyword))
}

// GetKeywords returns all keywords
func GetKeywords() map[string]string {
	return keywordResponses
}

// handleAccountEvent handles events for a specific account
func handleAccountEvent(account *Account, evt interface{}) {
	switch v := evt.(type) {
	case *events.Message:
		handleAccountMessage(account, v)
	case *events.Connected:
		log.Printf("✅ Account %s (%s) connected!", account.ID, account.Name)
		account.IsConnected = true
	case *events.Disconnected:
		log.Printf("❌ Account %s (%s) disconnected", account.ID, account.Name)
		account.IsConnected = false
	case *events.LoggedOut:
		log.Printf("⚠️ Account %s (%s) logged out", account.ID, account.Name)
		account.IsLoggedIn = false
	}
}

// handleAccountMessage handles incoming messages for a specific account
func handleAccountMessage(account *Account, msg *events.Message) {
	// Get sender info
	senderJID := msg.Info.Sender
	phone := senderJID.User

	// Get message text
	var text string
	if msg.Message.GetConversation() != "" {
		text = msg.Message.GetConversation()
	} else if msg.Message.GetExtendedTextMessage() != nil {
		text = msg.Message.GetExtendedTextMessage().GetText()
	}

	if text == "" {
		return // Ignore non-text messages
	}

	log.Printf("📨 [%s] Incoming from %s: %s", account.Name, phone, text)

	// Get or create user (linked to account)
	user, err := store.GetUserByPhoneAndAccount(phone, account.ID)
	if err != nil {
		log.Printf("Error getting user: %v", err)
	}

	if user == nil {
		// Create new user linked to this account
		user, err = store.CreateUserWithAccount(phone, nil, account.ID)
		if err != nil {
			log.Printf("Error creating user: %v", err)
			return
		}
	}

	// Update last_user_message_at
	if user != nil {
		store.UpdateUser(user.ID, map[string]interface{}{
			"last_user_message_at": "now()",
		})
	}

	// Log incoming message with account_id
	if user != nil {
		waID := msg.Info.ID
		store.LogMessageWithAccount(user.ID, account.ID, "incoming", "user", text, &waID)
	}

	// Check if auto-reply is enabled
	if !config.Settings.IsAutoReplyEnabled() {
		log.Println("⏸️ Auto-reply is disabled, skipping response")
		return
	}

	// Check if we should send away message (outside operating hours)
	if config.Settings.ShouldSendAwayMessage() {
		awayMsg := config.Settings.GetAwayMessage()
		log.Printf("🌙 Outside operating hours, sending away message to %s", phone)
		err := sendTextMessage(account.client, msg.Info.Chat, awayMsg)
		if err != nil {
			log.Printf("Error sending away message: %v", err)
		} else if user != nil {
			store.LogMessageWithAccount(user.ID, account.ID, "outgoing", "away", awayMsg, nil)
		}
		return // Don't process keywords when outside operating hours
	}

	// Check for keyword and respond
	keyword := strings.TrimSpace(strings.ToLower(text))

	// Handle stop/start special commands
	if keyword == "stop" && user != nil {
		store.UpdateUser(user.ID, map[string]interface{}{
			"opt_in": false,
		})
	} else if keyword == "start" && user != nil {
		store.UpdateUser(user.ID, map[string]interface{}{
			"opt_in": true,
		})
	}

	// Send response if keyword matches
	if response, ok := keywordResponses[keyword]; ok {
		err := sendTextMessage(account.client, msg.Info.Chat, response)
		if err != nil {
			log.Printf("Error sending response: %v", err)
		} else if user != nil {
			store.LogMessageWithAccount(user.ID, account.ID, "outgoing", "reply", response, nil)
		}
	}
}

// ParseJID parses a phone number into a JID
func ParseJID(phone string) types.JID {
	return types.NewJID(phone, types.DefaultUserServer)
}

// Legacy functions for backward compatibility with single-account mode
func RegisterHandler() {
	// No-op for multi-account mode
	// Handlers are registered per account in manager.go
}

func Connect() error {
	// Connect all accounts
	Manager.ConnectAllAccounts()
	return nil
}

func Disconnect() {
	Manager.DisconnectAllAccounts()
}

func IsConnected() bool {
	accounts := Manager.ListAccounts()
	for _, acc := range accounts {
		if acc.IsConnected {
			return true
		}
	}
	return false
}

func IsLoggedIn() bool {
	accounts := Manager.ListAccounts()
	for _, acc := range accounts {
		if acc.IsLoggedIn {
			return true
		}
	}
	return false
}
