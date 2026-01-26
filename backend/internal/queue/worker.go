package queue

import (
	"log"
	"sync"
	"time"

	"esther-whatsapp/internal/rules"
	"esther-whatsapp/internal/store"
	"esther-whatsapp/internal/whatsapp"
)

type Job struct {
	Phone       string
	Message     string
	MsgType     string
	ScheduledAt time.Time
}

var (
	jobQueue = make(chan Job, 100)
	wg       sync.WaitGroup
	running  = false
)

// Start starts the queue worker
func Start() {
	if running {
		return
	}
	running = true

	go func() {
		for job := range jobQueue {
			processJob(job)
		}
	}()

	log.Println("📬 Queue worker started")
}

// Stop stops the queue worker
func Stop() {
	running = false
	close(jobQueue)
	wg.Wait()
	log.Println("📭 Queue worker stopped")
}

// Enqueue adds a job to the queue
func Enqueue(phone, message, msgType string, scheduledAt time.Time) {
	job := Job{
		Phone:       phone,
		Message:     message,
		MsgType:     msgType,
		ScheduledAt: scheduledAt,
	}
	jobQueue <- job
	log.Printf("📥 Job enqueued for %s", phone)
}

// EnqueueNow adds a job to be processed immediately
func EnqueueNow(phone, message, msgType string) {
	Enqueue(phone, message, msgType, time.Now())
}

func processJob(job Job) {
	wg.Add(1)
	defer wg.Done()

	// Wait until scheduled time
	if time.Now().Before(job.ScheduledAt) {
		waitTime := time.Until(job.ScheduledAt)
		log.Printf("⏰ Waiting %v for scheduled job to %s", waitTime, job.Phone)
		time.Sleep(waitTime)
	}

	// Validate before sending
	result := rules.IsAntiBanSafe(job.MsgType, job.Phone)
	if !result.CanSend {
		log.Printf("🚫 Job rejected for %s: %s", job.Phone, result.Reason)
		return
	}

	// Send message
	err := whatsapp.SendToPhone(job.Phone, job.Message, job.MsgType)
	if err != nil {
		log.Printf("❌ Failed to send job to %s: %v", job.Phone, err)
		return
	}

	// Update last_system_sent_at if it's a system message
	if job.MsgType == "system" {
		user, _ := store.GetUserByPhone(job.Phone)
		if user != nil {
			store.UpdateUser(user.ID, map[string]interface{}{
				"last_system_sent_at": "now()",
			})
			store.LogMessage(user.ID, "outgoing", "system", job.Message, nil)
		}
	}

	log.Printf("✅ Job completed for %s", job.Phone)
}
