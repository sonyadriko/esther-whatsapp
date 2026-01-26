package broadcast

import (
	"log"
	"sync"
	"time"

	"esther-whatsapp/internal/store"
	"esther-whatsapp/internal/whatsapp"
)

var (
	runningBroadcasts = make(map[string]chan struct{})
	broadcastMu       sync.Mutex
)

// Start starts a broadcast
func Start(broadcastID string) {
	broadcast, exists := store.GetBroadcast(broadcastID)
	if !exists {
		log.Printf("Broadcast %s not found", broadcastID)
		return
	}

	broadcastMu.Lock()
	if _, running := runningBroadcasts[broadcastID]; running {
		broadcastMu.Unlock()
		log.Printf("Broadcast %s already running", broadcastID)
		return
	}
	stopChan := make(chan struct{})
	runningBroadcasts[broadcastID] = stopChan
	broadcastMu.Unlock()

	go run(broadcast, stopChan)
}

// Stop stops a broadcast
func Stop(broadcastID string) {
	broadcastMu.Lock()
	defer broadcastMu.Unlock()

	if stopChan, exists := runningBroadcasts[broadcastID]; exists {
		close(stopChan)
		delete(runningBroadcasts, broadcastID)
		store.UpdateBroadcast(broadcastID, 0, 0, "cancelled")
		log.Printf("Broadcast %s stopped", broadcastID)
	}
}

func run(broadcast *store.Broadcast, stopChan chan struct{}) {
	log.Printf("📢 Starting broadcast: %s (ID: %s)", broadcast.Name, broadcast.ID)
	store.UpdateBroadcast(broadcast.ID, 0, 0, "running")

	sent := 0
	failed := 0
	delay := time.Duration(broadcast.DelayMs) * time.Millisecond
	if delay < 3*time.Second {
		delay = 3 * time.Second // Minimum 3 second delay for safety
	}

	for _, phone := range broadcast.Recipients {
		select {
		case <-stopChan:
			log.Printf("📢 Broadcast %s cancelled", broadcast.ID)
			return
		default:
		}

		// Send message
		err := whatsapp.Manager.SendMessage(broadcast.AccountID, phone, broadcast.Message)
		if err != nil {
			log.Printf("❌ Failed to send to %s: %v", phone, err)
			failed++
		} else {
			log.Printf("✅ Sent to %s", phone)
			sent++
		}

		// Update progress
		store.UpdateBroadcast(broadcast.ID, sent, failed, "running")

		// Delay before next message
		select {
		case <-stopChan:
			log.Printf("📢 Broadcast %s cancelled during delay", broadcast.ID)
			return
		case <-time.After(delay):
		}
	}

	store.UpdateBroadcast(broadcast.ID, sent, failed, "completed")
	log.Printf("📢 Broadcast %s completed: %d sent, %d failed", broadcast.ID, sent, failed)

	// Clean up
	broadcastMu.Lock()
	delete(runningBroadcasts, broadcast.ID)
	broadcastMu.Unlock()
}

// IsRunning checks if a broadcast is running
func IsRunning(broadcastID string) bool {
	broadcastMu.Lock()
	defer broadcastMu.Unlock()
	_, running := runningBroadcasts[broadcastID]
	return running
}
