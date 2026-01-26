package config

import (
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	// Supabase
	SupabaseURL string
	SupabaseKey string

	// Server
	Port string
	Env  string

	// Rate Limits
	MaxSystemMsgPerDay int
	OperatingHourStart int
	OperatingHourEnd   int
	MinDelaySeconds    int
	MaxDelaySeconds    int
}

var AppConfig *Config

func Load() error {
	godotenv.Load()

	AppConfig = &Config{
		SupabaseURL: getEnv("SUPABASE_URL", ""),
		SupabaseKey: getEnv("SUPABASE_KEY", ""),
		Port:        getEnv("PORT", "8080"),
		Env:         getEnv("ENV", "development"),

		MaxSystemMsgPerDay: getEnvInt("MAX_SYSTEM_MSG_PER_DAY", 1),
		OperatingHourStart: getEnvInt("OPERATING_HOUR_START", 8),
		OperatingHourEnd:   getEnvInt("OPERATING_HOUR_END", 20),
		MinDelaySeconds:    getEnvInt("MIN_DELAY_SECONDS", 3),
		MaxDelaySeconds:    getEnvInt("MAX_DELAY_SECONDS", 10),
	}

	return nil
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intVal, err := strconv.Atoi(value); err == nil {
			return intVal
		}
	}
	return defaultValue
}
