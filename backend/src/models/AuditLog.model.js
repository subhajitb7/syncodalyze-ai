import mongoose from 'mongoose';

const auditLogSchema = mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      enum: [
        'DELETE_USER', 'UPDATE_ROLE', 'SUSPEND_USER', 'UNSUSPEND_USER', 
        'UPDATE_SETTINGS', 'SYSTEM_MAINTENANCE', 'INSPECT_CODE', 'PURGE_ANALYSIS', 
        'ACCOUNT_TERMINATED', 'PROJECT_CREATED', 'PROJECT_DELETED', 
        'TEAM_CREATED', 'TEAM_LINK_PROJECT', 'TEAM_UNLINK_PROJECT', 
        'MEMBER_INVITED', 'MEMBER_JOINED', 'MEMBER_REMOVED', 'ROLE_UPDATED',
        'ANALYSIS_STARTED', 'ANALYSIS_COMPLETED', 'LOGIN_SUCCESS', 'CREDENTIALS_ROTATED'
      ]
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    targetUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team'
    },
    details: {
      type: String,
      required: true
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed
    },
    ipAddress: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
