import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { S3Service } from './s3.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [S3Service],
})
export class AppModule {}
