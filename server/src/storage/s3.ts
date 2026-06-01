import {
  S3Client,
  PutObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
} from "@aws-sdk/client-s3";
import crypto from "node:crypto";
import { config } from "../config.js";

let client: S3Client | null = null;
let bucketReady = false;

function getClient(): S3Client {
  if (!client) {
    client = new S3Client({
      endpoint: config.s3.endpoint,
      region: config.s3.region,
      credentials: {
        accessKeyId: config.s3.accessKey,
        secretAccessKey: config.s3.secretKey,
      },
      forcePathStyle: true,
    });
  }
  return client;
}

async function ensureBucket(): Promise<void> {
  if (bucketReady || !config.s3.enabled) return;
  const s3 = getClient();
  try {
    await s3.send(new HeadBucketCommand({ Bucket: config.s3.bucket }));
  } catch {
    await s3.send(new CreateBucketCommand({ Bucket: config.s3.bucket }));
  }
  bucketReady = true;
}

function parseBase64Image(input: string): { buffer: Buffer; contentType: string } {
  const match = /^data:(image\/\w+);base64,(.+)$/.exec(input);
  if (match) {
    return {
      contentType: match[1]!,
      buffer: Buffer.from(match[2]!, "base64"),
    };
  }
  return {
    contentType: "image/jpeg",
    buffer: Buffer.from(input, "base64"),
  };
}

export async function uploadMealPhoto(
  userId: number,
  imageBase64: string,
): Promise<{ key: string; url: string } | null> {
  if (!config.s3.enabled) return null;

  await ensureBucket();

  const { buffer, contentType } = parseBase64Image(imageBase64);
  const key = `meals/${userId}/${crypto.randomUUID()}.jpg`;

  await getClient().send(
    new PutObjectCommand({
      Bucket: config.s3.bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }),
  );

  const base = config.s3.publicUrl.replace(/\/$/, "");
  const url = `${base}/${key}`;

  return { key, url };
}
