package api

import (
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func SetupRouter() *gin.Engine {
	r := gin.Default()

	// CORS middleware
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000", "http://127.0.0.1:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
	}))

	// API routes
	api := r.Group("/api")
	{
		api.GET("/health", HealthCheck)
		api.GET("/status", GetStatus)
		api.GET("/messages", GetMessages)
		api.GET("/users", GetUsers)
		api.POST("/send", SendMessage)
		api.GET("/stats", GetStats)
		api.GET("/validate", ValidateSend)

		// User management
		api.GET("/users/:id", GetUser)
		api.PUT("/users/:id", UpdateUserAPI)
		api.GET("/users/:id/messages", GetUserMessages)

		// Settings (extended with away message)
		api.GET("/settings", GetAllSettings)
		api.POST("/settings", UpdateAllSettings)

		// Keywords
		api.POST("/keywords", AddKeyword)
		api.DELETE("/keywords/:keyword", DeleteKeyword)

		// Templates
		api.GET("/templates", GetTemplates)
		api.POST("/templates", AddTemplate)
		api.DELETE("/templates/:id", DeleteTemplate)

		// Scheduled messages
		api.GET("/scheduled", GetScheduled)
		api.POST("/scheduled", AddScheduled)
		api.DELETE("/scheduled/:id", DeleteScheduled)

		// Broadcast
		api.GET("/broadcasts", GetBroadcasts)
		api.POST("/broadcasts", CreateBroadcast)
		api.GET("/broadcasts/:id", GetBroadcastStatus)
		api.POST("/broadcasts/:id/start", StartBroadcast)
		api.DELETE("/broadcasts/:id", DeleteBroadcast)

		// Account management (multi-account)
		api.GET("/accounts", GetAccounts)
		api.POST("/accounts", AddAccount)
		api.DELETE("/accounts/:id", DeleteAccount)
		api.GET("/accounts/:id/status", GetAccountStatus)
		api.POST("/accounts/:id/connect", ConnectAccount)
		api.POST("/accounts/:id/disconnect", DisconnectAccount)
		api.GET("/accounts/:id/qr", HandleAccountQRWebSocket)

		// Legacy QR WebSocket
		api.GET("/qr", HandleQRWebSocket)
	}

	return r
}
