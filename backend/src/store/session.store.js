// In-memory session storage using Map
const sessions = new Map();

/**
 * Store a session by sessionId
 * @param {string} sessionId
 * @param {object} sessionData
 */
function setSession(sessionId, sessionData) {
  sessions.set(sessionId, sessionData);
}

/**
 * Retrieve a session by sessionId
 * @param {string} sessionId
 * @returns {object|null} Session data or null if not found
 */
function getSession(sessionId) {
  return sessions.get(sessionId) || null;
}

/**
 * Check if a session exists
 * @param {string} sessionId
 * @returns {boolean}
 */
function hasSession(sessionId) {
  return sessions.has(sessionId);
}

/**
 * Delete a session (for cleanup if needed)
 * @param {string} sessionId
 */
function deleteSession(sessionId) {
  sessions.delete(sessionId);
}

module.exports = {
  setSession,
  getSession,
  hasSession,
  deleteSession,
};
