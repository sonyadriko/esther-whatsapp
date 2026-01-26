package api

import (
	"net/http"
	"strconv"
	"time"

	"esther-whatsapp/internal/config"
	"esther-whatsapp/internal/rules"
	"esther-whatsapp/internal/store"
	"esther-whatsapp/internal/whatsapp"

	"github.com/gin-gonic/gin"
)

// HealthCheck returns the health status
func HealthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status": "ok",
		"time":   "now",
	})
}

// GetStatus returns WhatsApp connection status
func GetStatus(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"connected": whatsapp.IsConnected(),
		"logged_in": whatsapp.IsLoggedIn(),
	})
}

// GetMessages returns paginated messages
func GetMessages(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	messages, err := store.GetMessages(limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"messages": messages,
		"limit":    limit,
		"offset":   offset,
	})
}

// GetUsers returns all users
func GetUsers(c *gin.Context) {
	users, err := store.GetUsers()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"users": users,
	})
}

// GetUser returns a single user by ID
func GetUser(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "user id is required",
		})
		return
	}

	user, err := store.GetUserByID(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	if user == nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "user not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"user": user,
	})
}

// UpdateUserRequest is the request body for updating a user
type UpdateUserRequest struct {
	Name    *string `json:"name"`
	Notes   *string `json:"notes"`
	Blocked *bool   `json:"blocked"`
	OptIn   *bool   `json:"opt_in"`
}

// UpdateUserAPI updates a user
func UpdateUserAPI(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "user id is required",
		})
		return
	}

	var req UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	updates := make(map[string]interface{})
	if req.Name != nil {
		updates["name"] = *req.Name
	}
	if req.Notes != nil {
		updates["notes"] = *req.Notes
	}
	if req.Blocked != nil {
		updates["blocked"] = *req.Blocked
	}
	if req.OptIn != nil {
		updates["opt_in"] = *req.OptIn
	}

	if len(updates) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "no updates provided",
		})
		return
	}

	err := store.UpdateUser(id, updates)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	// Get updated user
	user, _ := store.GetUserByID(id)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"user":    user,
	})
}

// GetUserMessages returns messages for a specific user
func GetUserMessages(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "user id is required",
		})
		return
	}

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "100"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	messages, err := store.GetMessagesByUser(id, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"messages": messages,
		"limit":    limit,
		"offset":   offset,
	})
}

// SendMessageRequest is the request body for sending a message
type SendMessageRequest struct {
	Phone     string `json:"phone" binding:"required"`
	Message   string `json:"message" binding:"required"`
	Type      string `json:"type"`       // reply | system | manual
	AccountID string `json:"account_id"` // Which account to send from
}

// SendMessage sends a message to a phone number
func SendMessage(c *gin.Context) {
	var req SendMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	msgType := req.Type
	if msgType == "" {
		msgType = "manual"
	}

	// Validate with anti-ban rules
	result := rules.IsAntiBanSafe(msgType, req.Phone)
	if !result.CanSend {
		c.JSON(http.StatusForbidden, gin.H{
			"error":    result.Reason,
			"can_send": false,
		})
		return
	}

	// If account_id is provided, use multi-account manager
	if req.AccountID != "" {
		err := whatsapp.Manager.SendMessage(req.AccountID, req.Phone, req.Message)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": err.Error(),
			})
			return
		}
		c.JSON(http.StatusOK, gin.H{
			"status":  "sent",
			"message": "Message sent successfully",
		})
		return
	}

	// Fallback: try to send via first connected account
	accounts := whatsapp.Manager.ListAccounts()
	for _, acc := range accounts {
		if acc.IsConnected {
			err := whatsapp.Manager.SendMessage(acc.ID, req.Phone, req.Message)
			if err != nil {
				continue
			}
			c.JSON(http.StatusOK, gin.H{
				"status":  "sent",
				"message": "Message sent successfully",
			})
			return
		}
	}

	c.JSON(http.StatusServiceUnavailable, gin.H{
		"error": "No connected account available",
	})
}

// GetStats returns dashboard statistics
func GetStats(c *gin.Context) {
	users, _ := store.GetUsers()
	messages, _ := store.GetMessages(1000, 0)

	// Count incoming and outgoing
	incoming := 0
	outgoing := 0
	for _, msg := range messages {
		if msg.Direction == "incoming" {
			incoming++
		} else {
			outgoing++
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"total_users":       len(users),
		"total_messages":    len(messages),
		"incoming_messages": incoming,
		"outgoing_messages": outgoing,
		"connected":         whatsapp.IsConnected(),
	})
}

// ValidateSend checks if a message can be sent
func ValidateSend(c *gin.Context) {
	phone := c.Query("phone")
	msgType := c.DefaultQuery("type", "system")

	if phone == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "phone is required",
		})
		return
	}

	result := rules.IsAntiBanSafe(msgType, phone)
	c.JSON(http.StatusOK, gin.H{
		"can_send": result.CanSend,
		"reason":   result.Reason,
	})
}

// GetSettings returns current bot settings
func GetSettings(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"auto_reply_enabled": config.Settings.IsAutoReplyEnabled(),
		"keywords":           whatsapp.GetKeywords(),
	})
}

// UpdateSettingsRequest is the request body for updating settings
type UpdateSettingsRequest struct {
	AutoReplyEnabled *bool `json:"auto_reply_enabled"`
}

// UpdateSettings updates bot settings
func UpdateSettings(c *gin.Context) {
	var req UpdateSettingsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	if req.AutoReplyEnabled != nil {
		config.Settings.SetAutoReplyEnabled(*req.AutoReplyEnabled)
	}

	c.JSON(http.StatusOK, gin.H{
		"success":            true,
		"auto_reply_enabled": config.Settings.IsAutoReplyEnabled(),
	})
}

// AddKeywordRequest is the request body for adding a keyword
type AddKeywordRequest struct {
	Keyword  string `json:"keyword" binding:"required"`
	Response string `json:"response" binding:"required"`
}

// AddKeyword adds a new keyword response
func AddKeyword(c *gin.Context) {
	var req AddKeywordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	whatsapp.AddKeyword(req.Keyword, req.Response)

	c.JSON(http.StatusOK, gin.H{
		"success":  true,
		"keywords": whatsapp.GetKeywords(),
	})
}

// DeleteKeyword removes a keyword
func DeleteKeyword(c *gin.Context) {
	keyword := c.Param("keyword")
	if keyword == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "keyword is required",
		})
		return
	}

	whatsapp.RemoveKeyword(keyword)

	c.JSON(http.StatusOK, gin.H{
		"success":  true,
		"keywords": whatsapp.GetKeywords(),
	})
}

// GetTemplates returns all templates
func GetTemplates(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"templates": store.GetTemplates(),
	})
}

// AddTemplateRequest is the request body for adding a template
type AddTemplateRequest struct {
	Name    string `json:"name" binding:"required"`
	Content string `json:"content" binding:"required"`
}

// AddTemplate adds a new template
func AddTemplate(c *gin.Context) {
	var req AddTemplateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	store.AddTemplate(req.Name, req.Content)

	c.JSON(http.StatusOK, gin.H{
		"success":   true,
		"templates": store.GetTemplates(),
	})
}

// DeleteTemplate deletes a template
func DeleteTemplate(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "id is required",
		})
		return
	}

	store.DeleteTemplate(id)

	c.JSON(http.StatusOK, gin.H{
		"success":   true,
		"templates": store.GetTemplates(),
	})
}

// GetScheduled returns all scheduled messages
func GetScheduled(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"scheduled": store.GetScheduled(),
	})
}

// AddScheduledRequest is the request body for scheduling a message
type AddScheduledRequest struct {
	Phone       string `json:"phone" binding:"required"`
	Message     string `json:"message" binding:"required"`
	ScheduledAt string `json:"scheduled_at" binding:"required"`
}

// AddScheduled schedules a new message
func AddScheduled(c *gin.Context) {
	var req AddScheduledRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	store.AddScheduled(req.Phone, req.Message, req.ScheduledAt)

	c.JSON(http.StatusOK, gin.H{
		"success":   true,
		"scheduled": store.GetScheduled(),
	})
}

// DeleteScheduled cancels a scheduled message
func DeleteScheduled(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "id is required",
		})
		return
	}

	store.DeleteScheduled(id)

	c.JSON(http.StatusOK, gin.H{
		"success":   true,
		"scheduled": store.GetScheduled(),
	})
}

// ============= ACCOUNT MANAGEMENT =============

// GetAccounts returns all WhatsApp accounts
func GetAccounts(c *gin.Context) {
	accounts := whatsapp.Manager.ListAccounts()
	c.JSON(http.StatusOK, gin.H{
		"accounts": accounts,
	})
}

// AddAccountRequest is the request body for adding an account
type AddAccountRequest struct {
	Name string `json:"name" binding:"required"`
}

// AddAccount adds a new WhatsApp account
func AddAccount(c *gin.Context) {
	var req AddAccountRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	account, err := whatsapp.Manager.AddAccount(req.Name)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"account": account,
	})
}

// DeleteAccount removes a WhatsApp account
func DeleteAccount(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "id is required",
		})
		return
	}

	err := whatsapp.Manager.RemoveAccount(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":  true,
		"accounts": whatsapp.Manager.ListAccounts(),
	})
}

// GetAccountStatus returns a specific account status
func GetAccountStatus(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "id is required",
		})
		return
	}

	account, exists := whatsapp.Manager.GetAccount(id)
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "account not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"account": account,
	})
}

// ConnectAccount connects a specific account
func ConnectAccount(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "id is required",
		})
		return
	}

	err := whatsapp.Manager.ConnectAccount(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
	})
}

// DisconnectAccount disconnects a specific account
func DisconnectAccount(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "id is required",
		})
		return
	}

	err := whatsapp.Manager.DisconnectAccount(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
	})
}

// ============= BROADCAST =============

// GetBroadcasts returns all broadcasts
func GetBroadcasts(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"broadcasts": store.GetBroadcasts(),
	})
}

// CreateBroadcastRequest is the request body for creating a broadcast
type CreateBroadcastRequest struct {
	Name       string   `json:"name" binding:"required"`
	Message    string   `json:"message" binding:"required"`
	AccountID  string   `json:"account_id" binding:"required"`
	Recipients []string `json:"recipients" binding:"required"`
	DelayMs    int      `json:"delay_ms"`
}

// CreateBroadcast creates a new broadcast
func CreateBroadcast(c *gin.Context) {
	var req CreateBroadcastRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	if req.DelayMs == 0 {
		req.DelayMs = 5000 // Default 5 second delay
	}

	broadcast := store.CreateBroadcast(req.Name, req.Message, req.AccountID, req.Recipients, req.DelayMs)

	c.JSON(http.StatusOK, gin.H{
		"success":   true,
		"broadcast": broadcast,
	})
}

// StartBroadcast starts a broadcast
func StartBroadcast(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "id is required",
		})
		return
	}

	// Import and start broadcast
	go func() {
		broadcast, exists := store.GetBroadcast(id)
		if !exists {
			return
		}
		store.UpdateBroadcast(id, 0, 0, "running")

		// Simple inline runner
		sent := 0
		failed := 0
		for _, phone := range broadcast.Recipients {
			err := whatsapp.Manager.SendMessage(broadcast.AccountID, phone, broadcast.Message)
			if err != nil {
				failed++
			} else {
				sent++
			}
			store.UpdateBroadcast(id, sent, failed, "running")
			// Rate limit
			select {
			case <-c.Request.Context().Done():
				return
			default:
				// Delay between messages (minimum 3 seconds)
				delay := broadcast.DelayMs
				if delay < 3000 {
					delay = 3000
				}
				<-time.After(time.Duration(delay) * time.Millisecond)
			}
		}
		store.UpdateBroadcast(id, sent, failed, "completed")
	}()

	c.JSON(http.StatusOK, gin.H{
		"success": true,
	})
}

// GetBroadcastStatus returns the status of a broadcast
func GetBroadcastStatus(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "id is required",
		})
		return
	}

	broadcast, exists := store.GetBroadcast(id)
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "broadcast not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"broadcast": broadcast,
	})
}

// DeleteBroadcast deletes a broadcast
func DeleteBroadcast(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "id is required",
		})
		return
	}

	store.DeleteBroadcast(id)

	c.JSON(http.StatusOK, gin.H{
		"success":    true,
		"broadcasts": store.GetBroadcasts(),
	})
}

// ============= EXTENDED SETTINGS =============

// GetAllSettings returns all settings including away message
func GetAllSettings(c *gin.Context) {
	c.JSON(http.StatusOK, config.GetAllSettings())
}

// UpdateAllSettingsRequest is the request for updating all settings
type UpdateAllSettingsRequest struct {
	AutoReplyEnabled  *bool   `json:"auto_reply_enabled"`
	AwayEnabled       *bool   `json:"away_enabled"`
	AwayMessage       *string `json:"away_message"`
	OperatingStart    *int    `json:"operating_start"`
	OperatingEnd      *int    `json:"operating_end"`
	MinDelayMs        *int    `json:"min_delay_ms"`
	MaxDelayMs        *int    `json:"max_delay_ms"`
	DailyLimitPerUser *int    `json:"daily_limit_per_user"`
}

// UpdateAllSettings updates all settings
func UpdateAllSettings(c *gin.Context) {
	var req UpdateAllSettingsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	if req.AutoReplyEnabled != nil {
		config.Settings.SetAutoReplyEnabled(*req.AutoReplyEnabled)
	}
	if req.AwayEnabled != nil {
		config.Settings.SetAwayEnabled(*req.AwayEnabled)
	}
	if req.AwayMessage != nil {
		config.Settings.SetAwayMessage(*req.AwayMessage)
	}
	if req.OperatingStart != nil && req.OperatingEnd != nil {
		config.Settings.SetOperatingHours(*req.OperatingStart, *req.OperatingEnd)
	}
	if req.MinDelayMs != nil || req.MaxDelayMs != nil || req.DailyLimitPerUser != nil {
		minDelay, maxDelay, dailyLimit := config.Settings.GetRateLimits()
		if req.MinDelayMs != nil {
			minDelay = *req.MinDelayMs
		}
		if req.MaxDelayMs != nil {
			maxDelay = *req.MaxDelayMs
		}
		if req.DailyLimitPerUser != nil {
			dailyLimit = *req.DailyLimitPerUser
		}
		config.Settings.SetRateLimits(minDelay, maxDelay, dailyLimit)
	}

	c.JSON(http.StatusOK, gin.H{
		"success":  true,
		"settings": config.GetAllSettings(),
	})
}
