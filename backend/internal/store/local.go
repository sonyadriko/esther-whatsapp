package store

import (
	"sync"
	"time"

	"github.com/google/uuid"
)

// Template represents a message template
type Template struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	Content   string `json:"content"`
	CreatedAt string `json:"created_at"`
}

// ScheduledMessage represents a scheduled message
type ScheduledMessage struct {
	ID          string `json:"id"`
	Phone       string `json:"phone"`
	Message     string `json:"message"`
	ScheduledAt string `json:"scheduled_at"`
	Status      string `json:"status"` // pending | sent | failed
	CreatedAt   string `json:"created_at"`
}

// Broadcast represents a broadcast campaign
type Broadcast struct {
	ID         string   `json:"id"`
	Name       string   `json:"name"`
	Message    string   `json:"message"`
	AccountID  string   `json:"account_id"`
	Recipients []string `json:"recipients"` // Phone numbers
	Sent       int      `json:"sent"`
	Failed     int      `json:"failed"`
	Total      int      `json:"total"`
	Status     string   `json:"status"` // pending | running | completed | cancelled
	DelayMs    int      `json:"delay_ms"`
	CreatedAt  string   `json:"created_at"`
}

var (
	templates   = make(map[string]Template)
	scheduled   = make(map[string]ScheduledMessage)
	broadcasts  = make(map[string]*Broadcast)
	templateMu  sync.RWMutex
	scheduleMu  sync.RWMutex
	broadcastMu sync.RWMutex
)

// GetTemplates returns all templates
func GetTemplates() []Template {
	templateMu.RLock()
	defer templateMu.RUnlock()

	result := make([]Template, 0, len(templates))
	for _, t := range templates {
		result = append(result, t)
	}
	return result
}

// AddTemplate adds a new template
func AddTemplate(name, content string) Template {
	templateMu.Lock()
	defer templateMu.Unlock()

	id := uuid.New().String()
	t := Template{
		ID:        id,
		Name:      name,
		Content:   content,
		CreatedAt: time.Now().Format(time.RFC3339),
	}
	templates[id] = t
	return t
}

// DeleteTemplate deletes a template
func DeleteTemplate(id string) {
	templateMu.Lock()
	defer templateMu.Unlock()
	delete(templates, id)
}

// GetScheduled returns all scheduled messages
func GetScheduled() []ScheduledMessage {
	scheduleMu.RLock()
	defer scheduleMu.RUnlock()

	result := make([]ScheduledMessage, 0, len(scheduled))
	for _, s := range scheduled {
		result = append(result, s)
	}
	return result
}

// AddScheduled adds a new scheduled message
func AddScheduled(phone, message, scheduledAt string) ScheduledMessage {
	scheduleMu.Lock()
	defer scheduleMu.Unlock()

	id := uuid.New().String()
	s := ScheduledMessage{
		ID:          id,
		Phone:       phone,
		Message:     message,
		ScheduledAt: scheduledAt,
		Status:      "pending",
		CreatedAt:   time.Now().Format(time.RFC3339),
	}
	scheduled[id] = s
	return s
}

// DeleteScheduled deletes a scheduled message
func DeleteScheduled(id string) {
	scheduleMu.Lock()
	defer scheduleMu.Unlock()
	delete(scheduled, id)
}

// UpdateScheduledStatus updates the status of a scheduled message
func UpdateScheduledStatus(id, status string) {
	scheduleMu.Lock()
	defer scheduleMu.Unlock()
	if s, ok := scheduled[id]; ok {
		s.Status = status
		scheduled[id] = s
	}
}

// GetPendingScheduled returns scheduled messages that are due
func GetPendingScheduled() []ScheduledMessage {
	scheduleMu.RLock()
	defer scheduleMu.RUnlock()

	now := time.Now()
	result := make([]ScheduledMessage, 0)
	for _, s := range scheduled {
		if s.Status != "pending" {
			continue
		}
		scheduledTime, err := time.Parse(time.RFC3339, s.ScheduledAt)
		if err != nil {
			continue
		}
		if scheduledTime.Before(now) || scheduledTime.Equal(now) {
			result = append(result, s)
		}
	}
	return result
}

// ========== BROADCAST ==========

// GetBroadcasts returns all broadcasts
func GetBroadcasts() []*Broadcast {
	broadcastMu.RLock()
	defer broadcastMu.RUnlock()

	result := make([]*Broadcast, 0, len(broadcasts))
	for _, b := range broadcasts {
		result = append(result, b)
	}
	return result
}

// GetBroadcast returns a broadcast by ID
func GetBroadcast(id string) (*Broadcast, bool) {
	broadcastMu.RLock()
	defer broadcastMu.RUnlock()
	b, ok := broadcasts[id]
	return b, ok
}

// CreateBroadcast creates a new broadcast
func CreateBroadcast(name, message, accountID string, recipients []string, delayMs int) *Broadcast {
	broadcastMu.Lock()
	defer broadcastMu.Unlock()

	id := uuid.New().String()[:8]
	b := &Broadcast{
		ID:         id,
		Name:       name,
		Message:    message,
		AccountID:  accountID,
		Recipients: recipients,
		Sent:       0,
		Failed:     0,
		Total:      len(recipients),
		Status:     "pending",
		DelayMs:    delayMs,
		CreatedAt:  time.Now().Format(time.RFC3339),
	}
	broadcasts[id] = b
	return b
}

// UpdateBroadcast updates a broadcast
func UpdateBroadcast(id string, sent, failed int, status string) {
	broadcastMu.Lock()
	defer broadcastMu.Unlock()
	if b, ok := broadcasts[id]; ok {
		b.Sent = sent
		b.Failed = failed
		b.Status = status
	}
}

// DeleteBroadcast deletes a broadcast
func DeleteBroadcast(id string) {
	broadcastMu.Lock()
	defer broadcastMu.Unlock()
	delete(broadcasts, id)
}
