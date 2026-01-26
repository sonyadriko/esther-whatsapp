package config

import (
	"sync"
	"time"
)

// BotSettings holds runtime settings for the bot
type BotSettings struct {
	AutoReplyEnabled  bool   `json:"auto_reply_enabled"`
	AwayEnabled       bool   `json:"away_enabled"`
	AwayMessage       string `json:"away_message"`
	OperatingStart    int    `json:"operating_start"`      // Hour in 24h format (e.g. 8 for 08:00)
	OperatingEnd      int    `json:"operating_end"`        // Hour in 24h format (e.g. 20 for 20:00)
	MinDelayMs        int    `json:"min_delay_ms"`         // Minimum delay between messages
	MaxDelayMs        int    `json:"max_delay_ms"`         // Maximum delay between messages
	DailyLimitPerUser int    `json:"daily_limit_per_user"` // Max messages per user per day
	mu                sync.RWMutex
}

var Settings = &BotSettings{
	AutoReplyEnabled:  true,
	AwayEnabled:       true,
	AwayMessage:       "Terima kasih telah menghubungi kami. Saat ini kami sedang di luar jam operasional.\n\n📅 Jam Operasional:\nSenin - Sabtu: 08.00 - 20.00 WIB\n\nPesan Anda akan kami balas saat jam kerja. Terima kasih! 🙏",
	OperatingStart:    8,
	OperatingEnd:      20,
	MinDelayMs:        3000,  // 3 seconds
	MaxDelayMs:        10000, // 10 seconds
	DailyLimitPerUser: 5,     // 5 messages per user per day
}

// IsAutoReplyEnabled returns whether auto-reply is enabled
func (s *BotSettings) IsAutoReplyEnabled() bool {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.AutoReplyEnabled
}

// SetAutoReplyEnabled sets the auto-reply state
func (s *BotSettings) SetAutoReplyEnabled(enabled bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.AutoReplyEnabled = enabled
}

// IsAwayEnabled returns whether away message is enabled
func (s *BotSettings) IsAwayEnabled() bool {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.AwayEnabled
}

// SetAwayEnabled sets the away message state
func (s *BotSettings) SetAwayEnabled(enabled bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.AwayEnabled = enabled
}

// GetAwayMessage returns the away message
func (s *BotSettings) GetAwayMessage() string {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.AwayMessage
}

// SetAwayMessage sets the away message
func (s *BotSettings) SetAwayMessage(msg string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.AwayMessage = msg
}

// GetOperatingHours returns start and end hours
func (s *BotSettings) GetOperatingHours() (int, int) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.OperatingStart, s.OperatingEnd
}

// SetOperatingHours sets operating hours
func (s *BotSettings) SetOperatingHours(start, end int) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.OperatingStart = start
	s.OperatingEnd = end
}

// GetRateLimits returns rate limit settings
func (s *BotSettings) GetRateLimits() (int, int, int) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.MinDelayMs, s.MaxDelayMs, s.DailyLimitPerUser
}

// SetRateLimits sets rate limit settings
func (s *BotSettings) SetRateLimits(minDelay, maxDelay, dailyLimit int) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if minDelay >= 1000 { // Minimum 1 second
		s.MinDelayMs = minDelay
	}
	if maxDelay >= minDelay {
		s.MaxDelayMs = maxDelay
	}
	if dailyLimit >= 1 {
		s.DailyLimitPerUser = dailyLimit
	}
}

// IsWithinOperatingHours checks if current time is within operating hours
func (s *BotSettings) IsWithinOperatingHours() bool {
	s.mu.RLock()
	defer s.mu.RUnlock()

	// Get current hour in local timezone
	now := time.Now()
	hour := now.Hour()
	weekday := now.Weekday()

	// Check if it's Sunday (closed)
	if weekday == time.Sunday {
		return false
	}

	// Check if within operating hours
	return hour >= s.OperatingStart && hour < s.OperatingEnd
}

// ShouldSendAwayMessage returns if away message should be sent
func (s *BotSettings) ShouldSendAwayMessage() bool {
	if !s.IsAwayEnabled() {
		return false
	}
	return !s.IsWithinOperatingHours()
}

// GetAllSettings returns all current settings
func GetAllSettings() map[string]interface{} {
	start, end := Settings.GetOperatingHours()
	minDelay, maxDelay, dailyLimit := Settings.GetRateLimits()
	return map[string]interface{}{
		"auto_reply_enabled":   Settings.IsAutoReplyEnabled(),
		"away_enabled":         Settings.IsAwayEnabled(),
		"away_message":         Settings.GetAwayMessage(),
		"operating_start":      start,
		"operating_end":        end,
		"is_operating":         Settings.IsWithinOperatingHours(),
		"min_delay_ms":         minDelay,
		"max_delay_ms":         maxDelay,
		"daily_limit_per_user": dailyLimit,
	}
}
