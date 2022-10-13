import { Module } from '@nestjs/common';
import { StorageModule } from './posts/storage.module';

@Module({
  imports: [StorageModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
