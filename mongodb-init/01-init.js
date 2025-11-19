// MongoDB initialization script
// This runs when the container is first created

// Switch to lighthouse database
db = db.getSiblingDB('lighthouse');

// Create collections with validation
db.createCollection('tasks', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['taskId', 'url', 'status', 'createdAt'],
      properties: {
        taskId: {
          bsonType: 'string',
          description: 'Unique task identifier'
        },
        url: {
          bsonType: 'string',
          description: 'URL to test'
        },
        status: {
          enum: ['queued', 'running', 'completed', 'error'],
          description: 'Task status'
        },
        createdAt: {
          bsonType: 'date',
          description: 'Task creation timestamp'
        }
      }
    }
  }
});

// Create indexes for better performance
db.tasks.createIndex({ taskId: 1 }, { unique: true });
db.tasks.createIndex({ createdAt: -1 });
db.tasks.createIndex({ status: 1 });
db.tasks.createIndex({ url: 1 });

print('MongoDB initialization completed successfully');
