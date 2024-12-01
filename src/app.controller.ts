import { Controller, Get, Post, Query, Param } from '@nestjs/common';
import { S3Service } from './s3.service';

@Controller()
export class AppController {
  constructor(private readonly s3Service: S3Service) {}

  @Get()
  getHello(): string {
    return this.s3Service.getHello();
  }

  @Get('list')
  async listFiles() {
    const files = await this.s3Service.listFiles();
    return files;
  }

  @Get('upload/:filename')
  async uploadFile(@Param('filename') filename: string) {
    const fileNameLocal = `./downloads/${filename}`;
    return await this.s3Service.uploadFile(fileNameLocal);
  }

  @Get('download/:filename')
  async downloadFile(@Param('filename') filename: string) {
    const saveAs = `./downloads/${filename}`;
    return await this.s3Service.getFile(filename, saveAs);
  }
}
