import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsCommand, CreateBucketCommand, HeadBucketCommand, PutBucketPolicyCommand } from '@aws-sdk/client-s3';

import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class S3Service {

  private readonly s3Client: S3Client;
  public bucketName = 'wepgcomp-bucket';

  constructor() {
    this.s3Client = new S3Client({
      region: process.env.S3_AWS_REGION,
      credentials: {
        accessKeyId: process.env.S3_AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.S3_AWS_SECRET_ACCESS_KEY,
      },
    })
  }

  async createBucket(bucket: string = this.bucketName): Promise<boolean> {
    try {
      await this.s3Client.send(
        new CreateBucketCommand({
          Bucket: bucket,
        }),
      );
      console.log(`Bucket ${bucket} created successfully`);

      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  }

  async bucketExists(bucket: string = this.bucketName): Promise<boolean> {
    try {
      await this.s3Client.send(
        new HeadBucketCommand({
          Bucket: bucket,
        }),
      );
      return true;
    } catch (err) {
      if (err.name === 'NotFound' || err.$metada?.httpStatusCode === 404) {
        return false;
      }
      throw err;
    }
  }

  async uploadFile(fileName: string, bucket: string = this.bucketName): Promise<boolean> {
    if (!fs.existsSync(fileName)) {
      console.error(`File ${fileName} does not exist`);
      return false;
    }
    // Create the bucket if it doesn't exist
    if (!(await this.bucketExists(bucket))) {
      await this.createBucket(bucket);
    }
    const fileStream = fs.createReadStream(fileName);
    const key = path.basename(fileName);

    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: fileStream,
        }),
      );
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  }

  async getFile(key: string, saveAs: string, bucket: string = this.bucketName): Promise<void> {
    // Create the bucket if it doesn't exist
    if (!(await this.bucketExists(bucket))) {
      await this.createBucket(bucket);
    }
    try {
      const response = await this.s3Client.send(
        new GetObjectCommand({
          Bucket: bucket,
          Key: key,
        }),
      );
      // Create the directory if it doesn't exist
      const dirName = path.dirname(saveAs);
      if (!fs.existsSync(dirName)) {
        fs.mkdirSync(dirName, { recursive: true });
      }
      // Save the file to the specified path
      const fileStream = fs.createWriteStream(saveAs);
      (response.Body as NodeJS.ReadableStream).pipe(fileStream);

      fileStream.on('finish', () => {
        console.log('File downloaded successfully');
      });
    } catch (err) {
      console.error(err);
      throw new Error(`Failed to download file: ${err.message}`);
    }
  }

  async listFiles(bucket: string = this.bucketName): Promise<string[]> {
    // Create the bucket if it doesn't exist
    if (!(await this.bucketExists(bucket))) {
      await this.createBucket(bucket);
    }
    try {
      const response = await this.s3Client.send(
        new ListObjectsCommand({
          Bucket: bucket,
        }),
      );
      const contentsList = response.Contents.map(obj => obj.Key).join('\n');
      console.log("\nHere's a list of files in the bucket:");
      console.log(`${contentsList}\n`);
      return response.Contents.map(obj => obj.Key);
    } catch (err) {
      console.error(err);
      throw new Error(`Failed to list files: ${err.message}`);
    }
  }

  getHello(): string {
    return 'Hello AWS S3!';
  }
}
