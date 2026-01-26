package rules

import (
	"time"

	"esther-whatsapp/internal/config"
	"esther-whatsapp/internal/store"
)

type ValidationResult struct {
	CanSend bool
	Reason  string
}

// CanSendSystemMessage checks if a system message can be sent to a user
func CanSendSystemMessage(phone string) ValidationResult {
	// Get user
	user, err := store.GetUserByPhone(phone)
	if err != nil {
		return ValidationResult{CanSend: false, Reason: "Database error"}
	}

	if user == nil {
		return ValidationResult{CanSend: false, Reason: "User not found"}
	}

	// Check if user is blocked
	if user.Blocked {
		return ValidationResult{CanSend: false, Reason: "User is blocked"}
	}

	// Check if user has opted out
	if !user.OptIn {
		return ValidationResult{CanSend: false, Reason: "User has opted out"}
	}

	// Check operating hours (08:00 - 20:00)
	now := time.Now()
	hour := now.Hour()
	startHour := config.AppConfig.OperatingHourStart
	endHour := config.AppConfig.OperatingHourEnd

	if hour < startHour || hour >= endHour {
		return ValidationResult{
			CanSend: false,
			Reason:  "Outside operating hours",
		}
	}

	// Check last system message sent (max 1 per 24 hours)
	if user.LastSystemSentAt != nil {
		lastSent, err := time.Parse(time.RFC3339, *user.LastSystemSentAt)
		if err == nil {
			if time.Since(lastSent) < 24*time.Hour {
				return ValidationResult{
					CanSend: false,
					Reason:  "Rate limit: already sent within 24 hours",
				}
			}
		}
	}

	return ValidationResult{CanSend: true, Reason: "OK"}
}

// CanReply checks if bot can reply to a user message (always allowed)
func CanReply(phone string) ValidationResult {
	// Get user
	user, err := store.GetUserByPhone(phone)
	if err != nil {
		return ValidationResult{CanSend: false, Reason: "Database error"}
	}

	if user != nil && user.Blocked {
		return ValidationResult{CanSend: false, Reason: "User is blocked"}
	}

	// Replies are always allowed (user initiated conversation)
	return ValidationResult{CanSend: true, Reason: "OK"}
}

// IsAntiBanSafe checks if sending is safe from anti-ban perspective
func IsAntiBanSafe(msgType string, phone string) ValidationResult {
	switch msgType {
	case "reply":
		return CanReply(phone)
	case "system":
		return CanSendSystemMessage(phone)
	case "manual":
		// Manual messages are allowed (dashboard operator sends)
		return CanReply(phone)
	case "promo", "broadcast", "blast":
		return ValidationResult{CanSend: false, Reason: "Promo/broadcast is prohibited"}
	default:
		return ValidationResult{CanSend: false, Reason: "Unknown message type"}
	}
}
