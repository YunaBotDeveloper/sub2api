package service

// SanitizeStoredCredentials strips secrets that must never be persisted on the
// account credentials map after conversion to OAuth tokens (Grok Web SSO / password).
// Call from admin create/update/import/apply-oauth paths.
//
// Cookie is always stripped: bulk paths may pass an empty platform label, and
// session-jar residue must never sit next to OAuth tokens on any platform.
func SanitizeStoredCredentials(platform string, creds map[string]any) map[string]any {
	if creds == nil {
		return nil
	}
	// sso_token is kept for Grok (and unknown platforms, e.g. bulk paths): the
	// Grok web imagine WebSocket authenticates with the sso cookie, so it must
	// survive account updates. It stays in SensitiveCredentialKeys and is never
	// echoed to clients. Other platforms have no use for it.
	if platform != "" && platform != PlatformGrok {
		delete(creds, "sso_token")
	}
	for _, key := range []string{
		"password", "sso", "sso-rw", "clearTextPassword", "cookie",
	} {
		delete(creds, key)
	}
	return creds
}
