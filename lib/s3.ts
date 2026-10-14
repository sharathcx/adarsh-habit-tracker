import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

export const NOTES_PREFIX = "habit-tracker/notes/";

function getClient() {
  const region = process.env.S3_REGION;
  const endpoint = process.env.S3_ENDPOINT;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  if (!region || !endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error("S3 storage is not configured (missing S3_REGION/S3_ENDPOINT/AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY)");
  }
  return new S3Client({
    region,
    endpoint,
    forcePathStyle: true,
    credentials: { accessKeyId, secretAccessKey },
  });
}

function getBucket() {
  const bucket = process.env.S3_BUCKET;
  if (!bucket) throw new Error("S3_BUCKET is not set");
  return bucket;
}

export type UploadResult = { key: string };

export async function uploadFile(
  key: string,
  content: ArrayBuffer | Buffer,
  contentType: string,
): Promise<UploadResult> {
  const client = getClient();
  const body = Buffer.from(content as ArrayBuffer);
  await client.send(
    new PutObjectCommand({
      Bucket: getBucket(),
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
  return { key };
}

export async function getFile(key: string): Promise<Buffer | null> {
  const client = getClient();
  try {
    const res = await client.send(
      new GetObjectCommand({ Bucket: getBucket(), Key: key }),
    );
    const bytes = await res.Body!.transformToByteArray();
    return Buffer.from(bytes);
  } catch (err) {
    if ((err as { name?: string }).name === "NoSuchKey") return null;
    throw err;
  }
}

export async function deleteFile(key: string): Promise<void> {
  const client = getClient();
  await client.send(new DeleteObjectCommand({ Bucket: getBucket(), Key: key }));
}
