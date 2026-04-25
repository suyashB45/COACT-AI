package database

import (
	"time"

	"github.com/jellydator/ttlcache/v3"
	"github.com/suyashB45/inter-ai-backend-go/internal/models"
)

var SessionCache *ttlcache.Cache[string, *models.Session]

func InitCache() {
	SessionCache = ttlcache.New[string, *models.Session](
		ttlcache.WithTTL[string, *models.Session](time.Hour),
		ttlcache.WithCapacity[string, *models.Session](500),
	)
	go SessionCache.Start()
}

func GetSession(sessionID string, forceDbRefresh bool) *models.Session {
	if !forceDbRefresh {
		item := SessionCache.Get(sessionID)
		if item != nil {
			return item.Value()
		}
	}

	// Try database fallback
	dbSession, err := GetSessionFromDB(sessionID)
	if err == nil && dbSession != nil {
		SessionCache.Set(sessionID, dbSession, ttlcache.DefaultTTL)
		return dbSession
	}

	return nil
}
