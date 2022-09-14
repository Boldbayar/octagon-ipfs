import {
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { StorageModel } from './storage.interface';
import { ApiModel } from './models/api-model.interface';
import fireAndForgetter from 'fire-and-forgetter';
import { NFTStorage, Blob } from 'nft.storage';

const AUTH_URL = 'http://localhost:8080/auth-api';
const MANAGE_URL = 'https://manage-api.octagon.mn/manage';
const API_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweDE5N0UzYzQxNkI1MDM5N2QyNDlmYjQwNzA3M2U0MTViNDlkOTBiYjIiLCJpc3MiOiJuZnQtc3RvcmFnZSIsImlhdCI6MTY2MzA1OTkzNDM2NSwibmFtZSI6Im9jdGFnb24tbnVtIn0.sr6uCoO7hy-5bJSt-qRJiTUd5gdiKrCLXtTNrezAZ5s';

@Injectable()
export class StorageService {
  private nftStorage = new NFTStorage({ token: API_KEY });
  private fireAndForget = fireAndForgetter();
  private readonly logger = new Logger(StorageService.name);

  private storedCount: number = 0;
  private async uploadNftMetadata(nft: any): Promise<void> {
    let entries = Object.entries(nft.attributes);
    let polygonAttribute = entries.map(([key, val]) => {
      return { trait_type: key, value: val };
    });

    const nftImage = await this.getImageFromUrl(nft.imgOriginalUrl);
    const metadata = await this.nftStorage.store({
      name: nft.name,
      description: nft.description,
      image: nftImage,
      attributes: polygonAttribute,
    });
    await this.addMetadata(nft.id, metadata.url);

    this.storedCount++;
    this.logger.log('NFT ID: ' + nft.id + ' = ' + JSON.stringify(metadata));
    this.logger.log('storedCount: ' + this.storedCount);

    return await Promise.resolve();
  }

  public async storeBulk(nftData: Array<any>): Promise<Array<StorageModel>> {
    var splitArrays = await this.chunk(nftData, 20);
    await Promise.all([
      this.prepareAssetBulk(splitArrays[0]),
      this.prepareAssetBulk(splitArrays[1]),
      this.prepareAssetBulk(splitArrays[2]),
      this.prepareAssetBulk(splitArrays[3]),
    ]);

    return null;
  }

  private async prepareAssetBulk(nftsToStore: Array<any>) {
    this.storedCount = 0;
    if (nftsToStore) {
      for (let i = 0; i < nftsToStore.length; i++) {
        this.fireAndForget(async () => {
          this.uploadNftMetadata(nftsToStore[i]);
        });
      }
    }
  }

  public async findAllNft(collectionId: String): Promise<Array<StorageModel>> {
    let page = 1;
    let allData = [];
    let lastResult: ApiModel = new ApiModel();

    do {
      try {
        const resp = await this.getCollectionNfts(collectionId, page, false);
        const data = resp;
        lastResult = data;

        data.list.forEach((nft) => {
          allData.push(nft);
        });

        page++;
      } catch (err) {
        console.error(`Oops, something is wrong ${err}`);
      }
    } while (lastResult.list.length !== 0);
    return allData;
  }

  private async chunk(items: Array<any>, size: number) {
    const chunks = [];
    items = [].concat(...items);

    while (items.length) {
      chunks.push(items.splice(0, size));
    }
    return chunks;
  }

  private async getCollectionNfts(
    collectionId: String,
    currentPage = 0,
    containsSearch: boolean,
  ) {
    var apiURL = `${MANAGE_URL}/v1/nft/mint-info?collectionId=${collectionId}&currentPage=${currentPage}&pageSize=100&sortParam=createdDate&search=ipfs&containsSearch=${containsSearch}`;
    return fetch(apiURL, {
      method: 'GET',
      headers: {
        accept: 'application/json',
        'Content-Type': 'application/json',
      },
    })
      .then((res) => res.json())
      .catch((err) => console.log(err));
  }

  private async getImageFromUrl(url: any): Promise<Blob> {
    return fetch(url)
      .then((res) => {
        return res.arrayBuffer();
      })
      .then((stream) => Buffer.from(stream))
      .then((arrayBuffer) => {
        var imageBlob = new Blob([arrayBuffer]);
        imageBlob = imageBlob.slice(0, imageBlob.size, 'image/png');
        return imageBlob;
      });
  }

  private async addMetadata(nftId: String, metaUrl: String) {
    var body = { nftId: nftId, metaDataUrl: metaUrl };
    return fetch(MANAGE_URL + '/v1/nft/mint/add-metadata', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        accept: 'application/json',
        'Content-Type': 'application/json',
      },
    })
      .then((res) => res.json())
      .catch((err) => console.log(err));
  }
}
