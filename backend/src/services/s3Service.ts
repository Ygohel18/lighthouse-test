// src/services/s3Service.ts
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import config from '../config';

const s3Client = new S3Client({
    endpoint: config.s3.endpoint, // Used for MinIO
    region: config.s3.region,
    credentials: {
        accessKeyId: config.s3.accessKeyId,
        secretAccessKey: config.s3.secretAccessKey,
    },
    forcePathStyle: !!config.s3.endpoint, // Required for MinIO
});

/**
 * Uploads a buffer to S3/MinIO.
 * @param objectKey The key (path) for the object in the bucket.
 * @param body The buffer to upload.
 * @param contentType The content type of the object (e.g., 'image/png').
 * @returns The object key on success.
 */
export const uploadFileToS3 = async (objectKey: string, body: Buffer, contentType: string): Promise<string> => {
    const bucketName = config.s3.bucketName;
    const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: objectKey,
        Body: body,
        ContentType: contentType,
    });

    try {
        await s3Client.send(command);
        console.log(`Successfully uploaded ${objectKey} to bucket ${bucketName}`);
        return objectKey;
    } catch (error) {
        console.error(`Error uploading ${objectKey} to S3 bucket ${bucketName}:`, error);
        throw error; // Re-throw to be handled by the caller
    }
};

/**
 * Generates a temporary signed URL for an object in S3/MinIO.
 * @param objectKey The key (path) of the object.
 * @returns A promise resolving to the signed URL string.
 */
export const getSignedS3Url = async (objectKey: string): Promise<string> => {
    const bucketName = config.s3.bucketName;
    const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: objectKey,
    });

    try {
        const signedUrl = await getSignedUrl(s3Client, command, {
            expiresIn: config.s3.signedUrlExpiresSeconds,
        });
        return signedUrl;
    } catch (error) {
        console.error(`Error generating signed URL for ${objectKey} in bucket ${bucketName}:`, error);
        throw error; // Re-throw to be handled by the caller
    }
};

/**
 * Deletes a single object from S3/MinIO.
 * @param objectKey The key (path) of the object to delete.
 * @returns A promise that resolves when the object is deleted.
 */
export const deleteFileFromS3 = async (objectKey: string): Promise<void> => {
    const bucketName = config.s3.bucketName;
    const command = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: objectKey,
    });

    try {
        await s3Client.send(command);
        console.log(`Successfully deleted ${objectKey} from bucket ${bucketName}`);
    } catch (error) {
        console.error(`Error deleting ${objectKey} from S3 bucket ${bucketName}:`, error);
        throw error;
    }
};

/**
 * Deletes multiple objects from S3/MinIO.
 * @param objectKeys Array of object keys to delete.
 * @returns A promise that resolves when all objects are deleted.
 */
export const deleteMultipleFilesFromS3 = async (objectKeys: string[]): Promise<void> => {
    if (objectKeys.length === 0) {
        return;
    }

    const bucketName = config.s3.bucketName;
    
    // S3 DeleteObjects can handle up to 1000 objects at once
    const batchSize = 1000;
    
    for (let i = 0; i < objectKeys.length; i += batchSize) {
        const batch = objectKeys.slice(i, i + batchSize);
        
        const command = new DeleteObjectsCommand({
            Bucket: bucketName,
            Delete: {
                Objects: batch.map(key => ({ Key: key })),
                Quiet: true,
            },
        });

        try {
            await s3Client.send(command);
            console.log(`Successfully deleted ${batch.length} objects from bucket ${bucketName}`);
        } catch (error) {
            console.error(`Error deleting batch of objects from S3 bucket ${bucketName}:`, error);
            throw error;
        }
    }
};