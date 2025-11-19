# Delete Task with S3 Storage Cleanup

## Overview
When a task is deleted, the system now automatically removes all associated files from S3/MinIO storage, including screenshots and thumbnails.

## Implementation

### S3 Service (`src/services/s3Service.ts`)

#### New Functions Added:

1. **`deleteFileFromS3(objectKey: string)`**
   - Deletes a single file from S3/MinIO
   - Logs success/failure
   - Throws error if deletion fails

2. **`deleteMultipleFilesFromS3(objectKeys: string[])`**
   - Deletes multiple files in batches
   - Handles up to 1000 objects per batch (S3 limit)
   - Efficient for bulk deletions
   - Logs progress

### Task Service (`src/services/taskService.ts`)

#### Enhanced `deleteTask(taskId: string)` Method:

**Process Flow:**
1. Fetch the task from database
2. Extract all S3 object keys from task results:
   - Screenshot thumbnails (filmstrip items)
   - Final screenshots (single thumbnails)
3. Delete all S3 objects in batch
4. Delete the task from database
5. Return success/failure status

**Error Handling:**
- If S3 deletion fails, logs error but continues with task deletion
- Prevents orphaned database records
- Ensures task is always removed from database

## What Gets Deleted

### From Database:
- Task document with all metadata
- All test results
- All configurations
- Timestamps and status

### From S3/MinIO Storage:
- Screenshot thumbnails (filmstrip)
- Final screenshots
- Any other stored images

## S3 Object Key Pattern

Objects are stored with keys like:
```
screenshots/{taskId}/{config}/{timestamp}-{type}.png
```

Example:
```
screenshots/abc-123-def/mobile-chrome-us-east/1234567890-thumbnail.png
screenshots/abc-123-def/desktop-chrome-eu-west/1234567890-final.png
```

## Benefits

✅ **No Orphaned Files** - Storage is cleaned up automatically
✅ **Cost Savings** - Reduces storage costs over time
✅ **Privacy** - Removes all traces of deleted tests
✅ **Efficient** - Batch deletion for better performance
✅ **Resilient** - Continues even if S3 deletion fails

## API Endpoint

**DELETE** `/tasks/:taskId`

**Response:**
```json
{
  "message": "Task deleted successfully",
  "taskId": "abc-123-def"
}
```

**Status Codes:**
- `200` - Task and files deleted successfully
- `404` - Task not found
- `500` - Server error

## Logging

The system logs:
- Number of S3 objects being deleted
- Success/failure of S3 deletions
- Individual object deletion status
- Any errors encountered

## Future Enhancements

Potential improvements:
- [ ] Soft delete with retention period
- [ ] Restore deleted tasks
- [ ] Bulk delete multiple tasks
- [ ] Delete by date range
- [ ] Archive before delete
- [ ] Async deletion for large tasks
- [ ] Delete confirmation via email

## Testing

To test the deletion:
1. Create a task and wait for completion
2. Verify screenshots are in S3/MinIO
3. Delete the task via API or UI
4. Verify task is removed from database
5. Verify screenshots are removed from S3/MinIO

## Notes

- S3 deletion is attempted before database deletion
- If S3 deletion fails, task is still deleted from database
- This prevents orphaned database records
- S3 objects can be manually cleaned up later if needed
- Batch size is 1000 objects (S3 API limit)
