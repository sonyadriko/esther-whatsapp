package whatsapp

import (
	"context"
	"fmt"
	"log"
	"sync"

	"github.com/google/uuid"
	_ "github.com/mattn/go-sqlite3"
	"go.mau.fi/whatsmeow"
	"go.mau.fi/whatsmeow/store/sqlstore"
	waLog "go.mau.fi/whatsmeow/util/log"
)

// Account represents a WhatsApp account
type Account struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Phone       string `json:"phone"`
	IsConnected bool   `json:"is_connected"`
	IsLoggedIn  bool   `json:"is_logged_in"`
	CreatedAt   string `json:"created_at"`

	client    *whatsmeow.Client
	qrChannel <-chan whatsmeow.QRChannelItem
}

// AccountManager manages multiple WhatsApp accounts
type AccountManager struct {
	accounts map[string]*Account
	mu       sync.RWMutex
}

var Manager = &AccountManager{
	accounts: make(map[string]*Account),
}

// AddAccount creates a new WhatsApp account
func (m *AccountManager) AddAccount(name string) (*Account, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	id := uuid.New().String()[:8] // Short ID for readability

	account := &Account{
		ID:          id,
		Name:        name,
		IsConnected: false,
		IsLoggedIn:  false,
	}

	// Create WhatsApp client for this account
	client, err := m.createClient(id)
	if err != nil {
		return nil, fmt.Errorf("failed to create client: %w", err)
	}
	account.client = client

	// Register event handler for this account
	m.registerHandler(account)

	m.accounts[id] = account
	log.Printf("✅ Account added: %s (%s)", name, id)

	return account, nil
}

// createClient creates a WhatsApp client for an account
func (m *AccountManager) createClient(accountID string) (*whatsmeow.Client, error) {
	ctx := context.Background()

	dbLog := waLog.Stdout("Database", "ERROR", true)
	sessionFile := fmt.Sprintf("file:wa_session_%s.db?_foreign_keys=on", accountID)

	container, err := sqlstore.New(ctx, "sqlite3", sessionFile, dbLog)
	if err != nil {
		return nil, fmt.Errorf("failed to create session store: %w", err)
	}

	deviceStore, err := container.GetFirstDevice(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get device: %w", err)
	}

	clientLog := waLog.Stdout("Client", "DEBUG", true)
	client := whatsmeow.NewClient(deviceStore, clientLog)

	return client, nil
}

// registerHandler registers event handler for an account
func (m *AccountManager) registerHandler(account *Account) {
	if account.client == nil {
		return
	}

	account.client.AddEventHandler(func(evt interface{}) {
		handleAccountEvent(account, evt)
	})
}

// RemoveAccount removes a WhatsApp account
func (m *AccountManager) RemoveAccount(id string) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	account, exists := m.accounts[id]
	if !exists {
		return fmt.Errorf("account not found")
	}

	// Disconnect if connected
	if account.client != nil && account.client.IsConnected() {
		account.client.Disconnect()
	}

	delete(m.accounts, id)
	log.Printf("🗑️ Account removed: %s", id)

	return nil
}

// GetAccount returns an account by ID
func (m *AccountManager) GetAccount(id string) (*Account, bool) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	account, exists := m.accounts[id]
	return account, exists
}

// ListAccounts returns all accounts
func (m *AccountManager) ListAccounts() []*Account {
	m.mu.RLock()
	defer m.mu.RUnlock()

	accounts := make([]*Account, 0, len(m.accounts))
	for _, account := range m.accounts {
		// Update status
		if account.client != nil {
			account.IsConnected = account.client.IsConnected()
			account.IsLoggedIn = account.client.IsLoggedIn()
			if account.client.Store != nil && account.client.Store.ID != nil {
				account.Phone = account.client.Store.ID.User
			}
		}
		accounts = append(accounts, account)
	}

	return accounts
}

// ConnectAccount connects a specific account
func (m *AccountManager) ConnectAccount(id string) error {
	account, exists := m.GetAccount(id)
	if !exists {
		return fmt.Errorf("account not found")
	}

	if account.client == nil {
		return fmt.Errorf("client not initialized")
	}

	if account.client.IsConnected() {
		return nil
	}

	return account.client.Connect()
}

// DisconnectAccount disconnects a specific account
func (m *AccountManager) DisconnectAccount(id string) error {
	account, exists := m.GetAccount(id)
	if !exists {
		return fmt.Errorf("account not found")
	}

	if account.client != nil {
		account.client.Disconnect()
	}

	return nil
}

// GetQRChannel returns QR channel for an account
func (m *AccountManager) GetQRChannel(id string) (<-chan whatsmeow.QRChannelItem, error) {
	account, exists := m.GetAccount(id)
	if !exists {
		return nil, fmt.Errorf("account not found")
	}

	if account.client == nil {
		return nil, fmt.Errorf("client not initialized")
	}

	if account.client.IsLoggedIn() {
		return nil, fmt.Errorf("already logged in")
	}

	// Disconnect first if connected
	if account.client.IsConnected() {
		account.client.Disconnect()
	}

	qrChan, err := account.client.GetQRChannel(context.Background())
	if err != nil {
		return nil, fmt.Errorf("failed to get QR channel: %w", err)
	}

	account.qrChannel = qrChan

	err = account.client.Connect()
	if err != nil {
		return nil, fmt.Errorf("failed to connect: %w", err)
	}

	return qrChan, nil
}

// SendMessage sends a message from a specific account
func (m *AccountManager) SendMessage(accountID, phone, message string) error {
	account, exists := m.GetAccount(accountID)
	if !exists {
		return fmt.Errorf("account not found")
	}

	if account.client == nil || !account.client.IsConnected() {
		return fmt.Errorf("account not connected")
	}

	jid := ParseJID(phone)
	return sendTextMessage(account.client, jid, message)
}

// ConnectAllAccounts connects all accounts that are logged in
func (m *AccountManager) ConnectAllAccounts() {
	m.mu.RLock()
	defer m.mu.RUnlock()

	for _, account := range m.accounts {
		if account.client != nil && account.client.Store.ID != nil {
			if err := account.client.Connect(); err != nil {
				log.Printf("❌ Failed to connect account %s: %v", account.ID, err)
			} else {
				log.Printf("✅ Account %s connected", account.ID)
			}
		}
	}
}

// DisconnectAllAccounts disconnects all accounts
func (m *AccountManager) DisconnectAllAccounts() {
	m.mu.RLock()
	defer m.mu.RUnlock()

	for _, account := range m.accounts {
		if account.client != nil && account.client.IsConnected() {
			account.client.Disconnect()
		}
	}
}
