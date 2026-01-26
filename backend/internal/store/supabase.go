package store

import (
	"esther-whatsapp/internal/config"

	"github.com/supabase-community/postgrest-go"
)

var Client *postgrest.Client

func InitSupabase() error {
	// Use postgrest-go directly for database operations
	Client = postgrest.NewClient(
		config.AppConfig.SupabaseURL+"/rest/v1",
		"",
		map[string]string{
			"apikey":        config.AppConfig.SupabaseKey,
			"Authorization": "Bearer " + config.AppConfig.SupabaseKey,
		},
	)
	return nil
}

// User represents a WhatsApp user
type User struct {
	ID                string  `json:"id"`
	Phone             string  `json:"phone"`
	Name              *string `json:"name"`
	Notes             *string `json:"notes"`
	AccountID         *string `json:"account_id"`
	OptIn             bool    `json:"opt_in"`
	Blocked           bool    `json:"blocked"`
	LastUserMessageAt *string `json:"last_user_message_at"`
	LastSystemSentAt  *string `json:"last_system_sent_at"`
	CreatedAt         string  `json:"created_at"`
	UpdatedAt         string  `json:"updated_at"`
}

// Message represents a message log
type Message struct {
	ID          string  `json:"id"`
	UserID      string  `json:"user_id"`
	AccountID   *string `json:"account_id"`
	Direction   string  `json:"direction"`    // incoming | outgoing
	MessageType string  `json:"message_type"` // reply | system | manual
	Content     *string `json:"content"`
	Status      string  `json:"status"` // sent | delivered | read | failed
	WAMessageID *string `json:"wa_message_id"`
	CreatedAt   string  `json:"created_at"`
}

// GetUserByPhone retrieves a user by phone number
func GetUserByPhone(phone string) (*User, error) {
	var users []User
	_, err := Client.From("users").Select("*", "", false).Eq("phone", phone).ExecuteTo(&users)
	if err != nil {
		return nil, err
	}
	if len(users) == 0 {
		return nil, nil
	}
	return &users[0], nil
}

// GetUserByPhoneAndAccount retrieves a user by phone and account
func GetUserByPhoneAndAccount(phone, accountID string) (*User, error) {
	var users []User
	_, err := Client.From("users").
		Select("*", "", false).
		Eq("phone", phone).
		Eq("account_id", accountID).
		ExecuteTo(&users)
	if err != nil {
		return nil, err
	}
	if len(users) == 0 {
		return nil, nil
	}
	return &users[0], nil
}

// GetUserByID retrieves a user by ID
func GetUserByID(id string) (*User, error) {
	var users []User
	_, err := Client.From("users").Select("*", "", false).Eq("id", id).ExecuteTo(&users)
	if err != nil {
		return nil, err
	}
	if len(users) == 0 {
		return nil, nil
	}
	return &users[0], nil
}

// CreateUser creates a new user
func CreateUser(phone string, name *string) (*User, error) {
	user := map[string]interface{}{
		"phone": phone,
		"name":  name,
	}
	var result []User
	_, err := Client.From("users").Insert(user, false, "", "", "").ExecuteTo(&result)
	if err != nil {
		return nil, err
	}
	if len(result) > 0 {
		return &result[0], nil
	}
	return nil, nil
}

// CreateUserWithAccount creates a new user linked to an account
func CreateUserWithAccount(phone string, name *string, accountID string) (*User, error) {
	user := map[string]interface{}{
		"phone":      phone,
		"name":       name,
		"account_id": accountID,
	}
	var result []User
	_, err := Client.From("users").Insert(user, false, "", "", "").ExecuteTo(&result)
	if err != nil {
		return nil, err
	}
	if len(result) > 0 {
		return &result[0], nil
	}
	return nil, nil
}

// UpdateUser updates a user
func UpdateUser(id string, updates map[string]interface{}) error {
	var result []User
	_, err := Client.From("users").Update(updates, "", "").Eq("id", id).ExecuteTo(&result)
	return err
}

// LogMessage logs a message to the database
func LogMessage(userID, direction, msgType, content string, waMessageID *string) error {
	msg := map[string]interface{}{
		"user_id":       userID,
		"direction":     direction,
		"message_type":  msgType,
		"content":       content,
		"wa_message_id": waMessageID,
	}
	var result []Message
	_, err := Client.From("messages").Insert(msg, false, "", "", "").ExecuteTo(&result)
	return err
}

// LogMessageWithAccount logs a message with account_id
func LogMessageWithAccount(userID, accountID, direction, msgType, content string, waMessageID *string) error {
	msg := map[string]interface{}{
		"user_id":       userID,
		"account_id":    accountID,
		"direction":     direction,
		"message_type":  msgType,
		"content":       content,
		"wa_message_id": waMessageID,
	}
	var result []Message
	_, err := Client.From("messages").Insert(msg, false, "", "", "").ExecuteTo(&result)
	return err
}

// GetMessages retrieves messages with pagination
func GetMessages(limit, offset int) ([]Message, error) {
	var messages []Message
	_, err := Client.From("messages").
		Select("*", "", false).
		Order("created_at", &postgrest.OrderOpts{Ascending: false}).
		Range(offset, offset+limit-1, "").
		ExecuteTo(&messages)
	return messages, err
}

// GetMessagesByAccount retrieves messages for a specific account
func GetMessagesByAccount(accountID string, limit, offset int) ([]Message, error) {
	var messages []Message
	_, err := Client.From("messages").
		Select("*", "", false).
		Eq("account_id", accountID).
		Order("created_at", &postgrest.OrderOpts{Ascending: false}).
		Range(offset, offset+limit-1, "").
		ExecuteTo(&messages)
	return messages, err
}

// GetMessagesByUser retrieves messages for a specific user
func GetMessagesByUser(userID string, limit, offset int) ([]Message, error) {
	var messages []Message
	_, err := Client.From("messages").
		Select("*", "", false).
		Eq("user_id", userID).
		Order("created_at", &postgrest.OrderOpts{Ascending: true}).
		Range(offset, offset+limit-1, "").
		ExecuteTo(&messages)
	return messages, err
}

// GetUsers retrieves all users
func GetUsers() ([]User, error) {
	var users []User
	_, err := Client.From("users").
		Select("*", "", false).
		Order("created_at", &postgrest.OrderOpts{Ascending: false}).
		ExecuteTo(&users)
	return users, err
}

// GetUsersByAccount retrieves users for a specific account
func GetUsersByAccount(accountID string) ([]User, error) {
	var users []User
	_, err := Client.From("users").
		Select("*", "", false).
		Eq("account_id", accountID).
		Order("created_at", &postgrest.OrderOpts{Ascending: false}).
		ExecuteTo(&users)
	return users, err
}
