import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3 } from 'aws-sdk';
import { readFile, writeFile } from 'fs/promises';

@Injectable()
export class StorageService {

  private remote: S3;
  @Inject(ConfigService) private config: ConfigService

  getRemoteClient(): S3 {
    if(this.remote) return this.remote;
    return this.remote = new S3({
      endpoint: this.config.get('REMOTE_STORAGE_ENDPPOINT'),
      accessKeyId: this.config.get('REMOTE_STORAGE_ACCESS_KEY'),
      secretAccessKey: this.config.get('REMOTE_STORAGE_SECRET_KEY'),
      signatureVersion: 'v4',
    })
  }

  async getObjectFromLocal(filename: string, path?: string) {
    path = path ?? this.config.get('LOCAL_STORAGE_PATH')
    return await readFile(`${path}/${filename}`)
  }

  getObjectFromRemote(key: string, bucket?: string) {
    return new Promise<S3.GetObjectOutput>((resolve, reject) => {

      this.getRemoteClient().getObject({
        Bucket: bucket ?? this.config.get('REMOTE_STORAGE_BUCKET_NAME'),
        Key: key
      }, (error, data) => {
        if(error) reject(error)
        else resolve(data)
      })

    })
  }

  getObject(filename: string, path?: string, bucket?: string) {
    return this.config.get<boolean>('ENABLE_REMOTE_STORAGE') 
      ? this.getObjectFromRemote(filename, bucket)
      : this.getObjectFromLocal(filename, path)
  }

  putObjectRemote(key: string, body: any, mimeType: string, bucket?: string) {
    return new Promise<S3.PutObjectOutput>((resolve, reject) => {
      this.getRemoteClient().putObject({
        Bucket: bucket ?? this.config.get('REMOTE_STORAGE_BUCKET_NAME'),
        Key: key,
        ContentType: mimeType,
        Body: body
      }, (error, data) => {
        if(error) reject(error)
        else resolve(data)
      })
    })
  }

  putObjectLocal(filename: string, body: Buffer, path?: string) {
    path = path ?? this.config.get('LOCAL_STORAGE_PATH')
    return writeFile(`${path}/${filename}`, body)
  }

}
