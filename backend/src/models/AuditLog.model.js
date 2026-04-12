import mongoose from 'mongoose';

const auditLogSchema = mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      enum: ['DELETE_USER', 'UPDATE_ROLE', 'SUSPEND_USER', 'UNSUSPEND_USER', 'UPDATE_SETTINGS', 'SYSTEM_MAINTENANCE', 'INSPECT_CODE', 'PURGE_ANALYSIS', 'ACCOUNT_TERMINATED']
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
