import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// S3 Configuration (is3.cloudhost.id)
const S3_ENDPOINT = process.env.S3_ENDPOINT || 'https://is3.cloudhost.id';
const S3_REGION = process.env.S3_REGION || 'jakarta';
const S3_BUCKET = process.env.S3_BUCKET || 'ngirimwa';
const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY || 'YVJ0DH7JOABV38WPY07J';
const S3_SECRET_KEY = process.env.S3_SECRET_KEY || 'pH2kA2bdLSlmGCZHfIyejyTLR0AnaUwbbyyjBwXx';

// Create S3 client
const s3Client = new S3Client({
  endpoint: S3_ENDPOINT,
  region: S3_REGION,
  credentials: {
    accessKeyId: S3_ACCESS_KEY,
    secretAccessKey: S3_SECRET_KEY,
  },
  forcePathStyle: true, // Required for custom S3 endpoints
});

interface UploadParams {
  key: string;
  body: Buffer | string;
  contentType?: string;
  metadata?: Record<string, string>;
}

/**
 * Upload file to S3
 */
export async function uploadToS3(params: UploadParams): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: params.key,
      Body: params.body,
      ContentType: params.contentType || 'application/octet-stream',
      Metadata: params.metadata,
      ACL: 'public-read', // Make file publicly accessible
    });

    await s3Client.send(command);

    // Generate public URL
    const publicUrl = `${S3_ENDPOINT}/${S3_BUCKET}/${params.key}`;

    console.log('✅ File uploaded to S3:', publicUrl);

    return {
      success: true,
      url: publicUrl,
    };
  } catch (error: any) {
    console.error('❌ S3 upload error:', error);
    return {
      success: false,
      error: error.message || 'Failed to upload to S3',
    };
  }
}

/**
 * Generate signed URL for private file access
 */
export async function getSignedS3Url(key: string, expiresIn: number = 3600): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
    return signedUrl;
  } catch (error: any) {
    console.error('❌ S3 signed URL error:', error);
    throw new Error('Failed to generate signed URL');
  }
}

/**
 * Upload invoice PDF to S3
 */
export async function uploadInvoice(
  invoiceNumber: string,
  pdfBuffer: Buffer
): Promise<{ success: boolean; url?: string; error?: string }> {
  const key = `invoices/${new Date().getFullYear()}/${invoiceNumber}.pdf`;

  return uploadToS3({
    key,
    body: pdfBuffer,
    contentType: 'application/pdf',
    metadata: {
      'invoice-number': invoiceNumber,
      'generated-at': new Date().toISOString(),
    },
  });
}

/**
 * Upload media file to S3
 */
export async function uploadMedia(
  fileName: string,
  fileBuffer: Buffer,
  contentType: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  const timestamp = Date.now();
  const key = `media/${new Date().getFullYear()}/${timestamp}-${fileName}`;

  return uploadToS3({
    key,
    body: fileBuffer,
    contentType,
    metadata: {
      'original-name': fileName,
      'uploaded-at': new Date().toISOString(),
    },
  });
}

export default {
  uploadToS3,
  getSignedS3Url,
  uploadInvoice,
  uploadMedia,
  s3Client,
};
