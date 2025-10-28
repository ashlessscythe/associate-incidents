# Backup & Restore Functionality

## Overview

The Associate Management System now includes comprehensive backup and restore functionality that allows administrators to create encrypted backups of all company data and restore from those backups when needed.

## Features

### 🔒 **Encrypted Backups**

- All backup data is encrypted using AES-256-CBC encryption
- Encryption key can be configured via `BACKUP_ENCRYPTION_KEY` environment variable
- Backup files contain sensitive data and should be stored securely

### 📊 **Complete Data Export**

Backups include all system data:

- **Users & Authentication**: All user accounts, roles, and permissions
- **Associates**: Employee records, designations, and current points
- **Locations & Departments**: Organizational structure
- **Occurrences**: All attendance incidents and their details
- **Corrective Actions**: Disciplinary actions and documentation
- **Notifications**: System notifications and alerts
- **Files**: All uploaded documents and attachments
- **Export Records**: Historical export tracking
- **System Configuration**: Rules, occurrence types, and notification levels

### ⚠️ **Destructive Restore Operations**

- Restore operations completely replace all existing data
- Multiple confirmation steps required to prevent accidental data loss
- Users must type "RESTORE" to confirm the operation
- Clear warnings about data destruction

## API Endpoints

### Create Backup

```http
POST /zapi/admin/backup
Authorization: Bearer <admin-token>
```

**Response:**

```json
{
  "success": true,
  "message": "Backup created successfully",
  "filename": "company-backup-2024-01-15T10-30-00-000Z.json",
  "metadata": {
    "version": "1.0",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "createdBy": "admin@company.com",
    "recordCounts": {
      "users": 5,
      "associates": 150,
      "occurrences": 45
      // ... other counts
    }
  },
  "encryptedData": {
    "encrypted": "...",
    "iv": "..."
  }
}
```

### Restore Data

```http
POST /zapi/admin/restore
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "encryptedData": { ... },
  "confirmRestore": true
}
```

### Get Backup Information

```http
POST /zapi/admin/backup/info
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "encryptedData": { ... }
}
```

## Admin Interface

### Backup Section

- **Create Backup**: Generates encrypted backup of all data
- **Download**: Saves backup file to local machine
- **Progress Indicators**: Shows backup creation progress
- **Record Counts**: Displays summary of backed up data

### Restore Section

- **File Selection**: Choose backup file to restore
- **Confirmation Required**: Must type "RESTORE" to proceed
- **Multiple Warnings**: Clear alerts about data destruction
- **Progress Indicators**: Shows restore operation progress

## Security Considerations

### 🔐 **Encryption**

- Backup data is encrypted using AES-256-CBC
- Encryption key should be stored securely in production
- Default key is generated if not provided (not recommended for production)

### 🛡️ **Access Control**

- Only admin users can create backups or restore data
- All operations require valid authentication tokens
- Admin privileges are verified on each request

### ⚠️ **Data Protection**

- Backup files contain sensitive personal and business data
- Files should be stored in secure locations
- Access should be restricted to authorized personnel only
- Consider additional encryption for long-term storage

## Usage Instructions

### Creating a Backup

1. **Navigate to Admin Page**: Go to `/admin` (requires admin privileges)
2. **Access Backup Section**: Find "Data Backup & Restore" section
3. **Create Backup**: Click "Create Backup" button
4. **Review Details**: Check backup summary in modal
5. **Download File**: Click "Download Backup" to save locally

### Restoring from Backup

1. **Prepare Backup File**: Ensure you have a valid backup file
2. **Navigate to Admin Page**: Go to `/admin` (requires admin privileges)
3. **Access Restore Section**: Find "Data Backup & Restore" section
4. **Select File**: Click "Select Backup File" and choose your backup
5. **Review Warnings**: Read all warning messages carefully
6. **Confirm Operation**: Type "RESTORE" in the confirmation field
7. **Execute Restore**: Click "Restore Data" button
8. **Wait for Completion**: Monitor progress and wait for success message

## Best Practices

### 📅 **Regular Backups**

- Create backups before major system changes
- Schedule regular automated backups
- Test restore procedures periodically
- Keep multiple backup versions

### 🔒 **Secure Storage**

- Store backup files in encrypted storage
- Use secure file transfer methods
- Implement access controls on backup storage
- Consider off-site backup storage

### ⚠️ **Restore Safety**

- Always create a backup before restoring
- Test restore procedures in non-production environments
- Verify backup file integrity before restoring
- Have a rollback plan ready

### 📋 **Documentation**

- Document backup and restore procedures
- Maintain records of backup creation dates
- Track who performed restore operations
- Keep backup file inventory

## Troubleshooting

### Common Issues

**Backup Creation Fails**

- Check admin privileges
- Verify database connectivity
- Review server logs for errors
- Ensure sufficient disk space

**Restore Operation Fails**

- Verify backup file format
- Check encryption key consistency
- Ensure database is accessible
- Review transaction logs

**File Upload Issues**

- Check file size limits
- Verify file format (.json)
- Ensure proper file permissions
- Check browser compatibility

### Error Messages

- **"Invalid backup format"**: Backup file is corrupted or invalid
- **"Restore confirmation required"**: Must type "RESTORE" to proceed
- **"Failed to decrypt data"**: Encryption key mismatch or corrupted data
- **"Admin access required"**: User lacks admin privileges

## Environment Configuration

### Required Environment Variables

```bash
# Backup encryption key (required for production)
BACKUP_ENCRYPTION_KEY=your-secure-encryption-key-here

# Database connection
DATABASE_URL=postgresql://user:password@localhost:5432/database

# JWT secret for authentication
JWT_SECRET=your-jwt-secret-key
```

### Production Recommendations

1. **Set Strong Encryption Key**: Use a secure, randomly generated key
2. **Enable HTTPS**: Use SSL/TLS for all communications
3. **Restrict Admin Access**: Limit admin account creation
4. **Monitor Operations**: Log all backup/restore activities
5. **Regular Testing**: Test backup/restore procedures regularly

## Technical Details

### Database Transaction Handling

- Restore operations use database transactions for atomicity
- All existing data is cleared before restore begins
- Data is restored in dependency order to maintain referential integrity
- Transaction is rolled back if any step fails

### File Handling

- Binary file content is preserved in backups
- File metadata (names, types, sizes) is included
- File associations with other entities are maintained
- Large files may impact backup size and performance

### Performance Considerations

- Backup creation time depends on data volume
- Large datasets may require significant processing time
- Restore operations may take longer than backups
- Consider system load during backup/restore operations

## Support

For technical support or questions about the backup/restore functionality:

1. Check the troubleshooting section above
2. Review server logs for detailed error information
3. Verify environment configuration
4. Test with smaller datasets to isolate issues
5. Contact system administrator for production issues
