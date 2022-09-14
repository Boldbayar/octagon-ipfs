import { Controller, Get, Param, Query, UseFilters } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { HttpExceptionFilter } from '../filters/http-exception.filter';
import { StorageModel } from './storage.interface';
import { StorageService } from './storage.service';

@Controller('storage')
@ApiTags('storage')
@UseFilters(HttpExceptionFilter)
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Get('find-all-nft')
  async findByFilter(@Query('collectionId') collectionId: String) {
    const allNftData = this.storageService.findAllNft(collectionId);
    this.storageService.storeBulk(await allNftData);

    return true;
  }
}
