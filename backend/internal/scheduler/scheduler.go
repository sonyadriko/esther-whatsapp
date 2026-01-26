package scheduler

import (
	"log"
	"time"

	"esther-whatsapp/internal/queue"
	"esther-whatsapp/internal/store"
)

var stopChan chan struct{}

// Start starts the scheduler that checks for pending scheduled messages
func Start() {
	stopChan = make(chan struct{})
	go run()
	log.Println("⏰ Scheduler started")
}

// Stop stops the scheduler
func Stop() {
	if stopChan != nil {
		close(stopChan)
	}
	log.Println("⏰ Scheduler stopped")
}

func run() {
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-stopChan:
			return
		case <-ticker.C:
			processPending()
		}
	}
}

func processPending() {
	pending := store.GetPendingScheduled()
	for _, msg := range pending {
		log.Printf("⏰ Sending scheduled message to %s", msg.Phone)
		queue.EnqueueNow(msg.Phone, msg.Message, "system")
		store.UpdateScheduledStatus(msg.ID, "sent")
	}
}
