import AuditLog from '../models/AuditLog.model.js';

/**
 * Centrally log an activity in the Kernel Audit Trail.
 * @param {string} action - The action type enum (e.g., 'PROJECT_CREATED').
 * @param {string} actorId - ID of the user performing the action.
 * @param {string} details - Human-readable description of the event.
 * @param {Object} options - Optional fields (targetUser, team, metadata, ipAddress).
 */
export const logActivity = async (action, actorId, details, options = {}) => {
  try {
    const { targetUser, team, metadata, ipAddress } = options;
    
    await AuditLog.create({
      action,
      actor: actorId,
      targetUser,
      team,
      details,
      metadata,
      ipAddress
    });

    // Note: Future expansion could include Socket.io broadcast here 
    // to provide live telemetry updates to the frontend.
    
  } catch (error) {
    console.error('Telemetery Logging Failure:', error);
    // Don't throw the error, we don't want a logging failure 
    // to break the primary operation flow.
  }
};
