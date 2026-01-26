package main

import (
	"log"
	"os"
	"os/signal"
	"syscall"

	"esther-whatsapp/internal/api"
	"esther-whatsapp/internal/config"
	"esther-whatsapp/internal/queue"
	"esther-whatsapp/internal/scheduler"
	"esther-whatsapp/internal/store"
	"esther-whatsapp/internal/whatsapp"
)

func main() {
	log.Println("🚀 Starting Esther WhatsApp Bot...")

	// Load config
	if err := config.Load(); err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}
	log.Println("✅ Config loaded")

	// Initialize Supabase
	if err := store.InitSupabase(); err != nil {
		log.Fatalf("Failed to initialize Supabase: %v", err)
	}
	log.Println("✅ Supabase connected")

	// Initialize WhatsApp client
	_, err := whatsapp.NewClient()
	if err != nil {
		log.Fatalf("Failed to create WhatsApp client: %v", err)
	}
	log.Println("✅ WhatsApp client created")

	// Register message handler
	whatsapp.RegisterHandler()
	log.Println("✅ Message handler registered")

	// Connect to WhatsApp
	if err := whatsapp.Connect(); err != nil {
		log.Fatalf("Failed to connect to WhatsApp: %v", err)
	}
	log.Println("✅ WhatsApp connected")

	// Start queue worker
	queue.Start()
	log.Println("✅ Queue worker started")

	// Start scheduler
	scheduler.Start()
	log.Println("✅ Scheduler started")

	// Setup HTTP router
	router := api.SetupRouter()

	// Start HTTP server in goroutine
	go func() {
		port := config.AppConfig.Port
		log.Printf("🌐 HTTP server starting on port %s", port)
		if err := router.Run(":" + port); err != nil {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	log.Println("=" + "===========================================")
	log.Println("🎉 Esther WhatsApp Bot is running!")
	log.Printf("📡 API: http://localhost:%s", config.AppConfig.Port)
	log.Println("=" + "===========================================")

	// Wait for interrupt signal
	sig := make(chan os.Signal, 1)
	signal.Notify(sig, syscall.SIGINT, syscall.SIGTERM)
	<-sig

	log.Println("\n🛑 Shutting down...")
	scheduler.Stop()
	queue.Stop()
	whatsapp.Disconnect()
	log.Println("👋 Goodbye!")
}
