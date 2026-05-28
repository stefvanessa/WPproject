import { S3Client } from "@aws-sdk/client-s3";
import { networkInterfaces } from "os";

function getLocalIP(): string {
  for (const iface of Object.values(networkInterfaces()).flat()) {
    if (iface?.family === "IPv4" && !iface.internal) return iface.address;
  }
  return "localhost";
}

const minioEndpoint = process.env.MINIO_ENDPOINT ?? "http://localhost:9000";
const minioPort = new URL(minioEndpoint).port || "9000";

// Used for server-side operations (upload, delete) — always hits internal endpoint
export const s3 = new S3Client({
  region: "us-east-1",
  endpoint: minioEndpoint,
  credentials: {
    accessKeyId: process.env.MINIO_ROOT_USER!,
    secretAccessKey: process.env.MINIO_ROOT_PASSWORD!,
  },
  forcePathStyle: true,
});

// Used only for generating signed URLs — endpoint must be reachable by the client device
// Falls back to auto-detected LAN IP so phones on the same network can fetch images
const publicEndpoint =
  process.env.MINIO_PUBLIC_ENDPOINT ?? `http://${getLocalIP()}:${minioPort}`;

export const s3Public = new S3Client({
  region: "us-east-1",
  endpoint: publicEndpoint,
  credentials: {
    accessKeyId: process.env.MINIO_ROOT_USER!,
    secretAccessKey: process.env.MINIO_ROOT_PASSWORD!,
  },
  forcePathStyle: true,
});

