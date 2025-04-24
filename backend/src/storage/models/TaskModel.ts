// src/storage/models/TaskModel.ts
import mongoose, { Schema, Document } from 'mongoose';
import { Task, LighthouseResultPartial } from '../../types';

// Define the schema for a single LighthouseResultPartial
const LighthouseResultPartialSchema: Schema = new Schema({
    config: {
        device: { type: String, required: true },
        browser: { type: String, required: true },
        location: { type: String, required: true },
    },
    status: { type: String, required: true, enum: ['pending', 'running', 'completed', 'error'] },
    score: { type: Number },
    metrics: {
        firstContentfulPaint: { type: Number },
        largestContentfulPaint: { type: Number },
        cumulativeLayoutShift: { type: Number },
        totalBlockingTime: { type: Number },
        speedIndex: { type: Number },
        interactive: { type: Number },
    },
    report: { type: Object }, // Ensure this is type: Object to store the full report JSON
    errorMessage: { type: String },
    timestamp: { type: Date, required: true },
}, { _id: false }); // Don't create default _id for subdocuments

// Define the main Task schema
const TaskSchema: Schema = new Schema({
    taskId: { type: String, required: true, unique: true },
    url: { type: String, required: true },
    createdAt: { type: Date, required: true, default: Date.now },
    status: { type: String, required: true, enum: ['queued', 'running', 'completed', 'error'], default: 'queued' },
    results: { type: [LighthouseResultPartialSchema], default: [] },
    plannedConfigs: { type: Array, default: [] },
});

// Export the Mongoose model
export interface TaskDocument extends Task, Document { }

export const TaskModel = mongoose.model<TaskDocument>('Task', TaskSchema);