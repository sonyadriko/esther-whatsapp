package whatsapp

import (
	"context"
	"fmt"
	"sync"

	_ "github.com/mattn/go-sqlite3"
	"go.mau.fi/whatsmeow"
	"go.mau.fi/whatsmeow/proto/waE2E"
	"go.mau.fi/whatsmeow/store/sqlstore"
	"go.mau.fi/whatsmeow/types"
	waLog "go.mau.fi/whatsmeow/util/log"
	"google.golang.org/protobuf/proto"
)

var Client *whatsmeow.Client
var QRChannel <-chan whatsmeow.QRChannelItem
var qrMutex sync.Mutex

// NewClient creates a new WhatsApp client (legacy for single-account mode)
func NewClient() (*whatsmeow.Client, error) {
	ctx := context.Background()

	dbLog := waLog.Stdout("Database", "ERROR", true)
	container, err := sqlstore.New(ctx, "sqlite3", "file:wa_session.db?_foreign_keys=on", dbLog)
	if err != nil {
		return nil, fmt.Errorf("failed to create session store: %w", err)
	}

	deviceStore, err := container.GetFirstDevice(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get device: %w", err)
	}

	clientLog := waLog.Stdout("Client", "DEBUG", true)
	client := whatsmeow.NewClient(deviceStore, clientLog)

	Client = client
	return client, nil
}

// GetNewQRChannel gets a new QR channel (legacy for single-account mode)
func GetNewQRChannel() (<-chan whatsmeow.QRChannelItem, error) {
	qrMutex.Lock()
	defer qrMutex.Unlock()

	if Client == nil {
		return nil, fmt.Errorf("client not initialized")
	}

	if Client.IsLoggedIn() {
		return nil, fmt.Errorf("already logged in")
	}

	if Client.IsConnected() {
		Client.Disconnect()
	}

	qrChan, err := Client.GetQRChannel(context.Background())
	if err != nil {
		return nil, fmt.Errorf("failed to get QR channel: %w", err)
	}
	QRChannel = qrChan

	err = Client.Connect()
	if err != nil {
		return nil, fmt.Errorf("failed to connect: %w", err)
	}

	return qrChan, nil
}

// sendTextMessage sends a text message using a specific client
func sendTextMessage(client *whatsmeow.Client, to types.JID, text string) error {
	if client == nil {
		return fmt.Errorf("client is nil")
	}

	msg := &waE2E.Message{
		Conversation: proto.String(text),
	}

	_, err := client.SendMessage(context.Background(), to, msg)
	return err
}
