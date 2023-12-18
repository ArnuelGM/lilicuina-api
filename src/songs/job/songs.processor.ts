import { Inject, Logger } from '@nestjs/common';
import { Process, Processor } from '@nestjs/bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from 'bull';
import { Song } from '../entities/song.entity';
import { SongMetadata } from '../entities/song-metadata.entity';
import { Repository } from 'typeorm';
import * as albumArt from 'album-art'
import * as which from 'which'
import * as spawn from 'await-spawn'
import { readFileSync, rmSync } from 'node:fs'
import { CreateSongDto } from '../dto/create-song.dto';
import { SongsService } from '../songs.service';
import { ConfigService } from '@nestjs/config';
import { 
  bufferToStream, 
  createHash, 
  downloadFromYoutube, 
  getDurationInSeconds, 
  getVideoInfo, 
  toMp3 
} from '../song.utils';

@Processor('song-metadata')
export class SongsMetadataProcessor {

  @Inject(SongsService)
  private songService: SongsService

  @InjectRepository(Song)
  private songRespository: Repository<Song>

  @InjectRepository(SongMetadata)
  private metadataRepository: Repository<SongMetadata>

  @Inject(ConfigService)
  private config: ConfigService

  private readonly logguer = new Logger(SongsMetadataProcessor.name)

  @Process('GetAlbumArt')
  async handleGetAlbumArt(job: Job<Song>) {
    this.logguer.log(`Starting get album art for ${job.data.id}...\n`)
    try {
      const song = await this.songRespository.findOneBy({ id: job.data.id })
      const cover = await albumArt(song.artist, { album: song.album, size: 'large' })
      song.cover = cover
      await this.songRespository.save(song)
    }
    catch (error) {
      this.logguer.error(`Error when get album art for ${job.data.id}`)
      this.logguer.error(error)
    }
    finally {
      this.logguer.log(`End get album art for ${job.data.id}\n`)
    }
  }
  
  /**
   * Get audio duration in seconds
   * NOTE: install ffmpeg 
   */
  @Process('GetAudioDuration')
  async handleGetAudioDuration(job: Job<{songMetadata: SongMetadata, songFile: any}>) {
    
    const {songMetadata, songFile} = job.data
    const songBuffer = Buffer.from(songFile?.buffer?.data) ?? songFile?.buffer

    this.logguer.log(`Starting get get audio duration for ${songMetadata.id}...\n`)
    
    try {

      songMetadata.duration = getDurationInSeconds( await toMp3( bufferToStream(songBuffer) ))
      this.metadataRepository.save(songMetadata)

    } catch (error) {
      this.logguer.error(`Error when get audio duration for ${songMetadata.id}`)
      this.logguer.error(error)
    }
    finally {
      this.logguer.log(`End get audio duration for ${songMetadata.id}\n`)
    }
  }

  /**
   * Generate Lyrics with openai whisper
   * Repository: https://github.com/openai/whisper
   */
  @Process('GenerateLyrics')
  async handleGenerateLyrics(job: Job<SongMetadata>) {
    const localStoragePath = this.config.get('LOCAL_STORAGE_PATH') ?? './storage/songs'
    const filePath = `${localStoragePath}/${job.data.fileName}`
    this.logguer.log(`Starting generate lyrics for ${filePath}`)
    try {
      const whisperCommand = which.sync('whisper')
      const commandParams = [
        filePath,
        '--model', 'base',
        '-o', './storage/lyrics',
        '--verbose', 'False',
        '-f', 'srt',
        '--device', 'cpu',
      ]
      this.logguer.debug(`${whisperCommand} ${commandParams.toString().replaceAll(',', ' ')}`)
      await spawn(whisperCommand, commandParams)
      const songMetadata = await this.metadataRepository.findOneBy({ id: job.data.id })
      songMetadata.lyrics = readFileSync(`./storage/lyrics/${job.data.fileName}.srt`).toString()
      rmSync(`./storage/lyrics/${job.data.fileName}.srt`)
      await this.metadataRepository.save(songMetadata)
    } catch (error) {
      this.logguer.error(`Error when generate lyrics for ${filePath}`)
      this.logguer.error(error)
    }
    finally {
      this.logguer.log(`End generate lyrics for ${filePath}`)
    }
  }


  @Process('DownloadYoutube')
  async handleDownloadYoutube(job: Job<CreateSongDto>) {
    
    try {
      
      const url = job.data.youtubeLink
      
      const metadata = await getVideoInfo(url)

      const data = await downloadFromYoutube(url)
  
      this.logguer.debug(`YouTube data downloaded from: ${url}`)

      const buffer = await toMp3( bufferToStream(data) )
      
      /* if(!this.config.get<boolean>('ENABLE_REMOTE_STORAGE')) {
        const filenamePath = `${path}/${filename}`
        await this.storage.putObjectLocal(filename, buffer, path)
      } */

      this.songService.create(
        job.data,
        { 
          filename: `${createHash()}.mp3`, 
          mimetype: 'audio/mpeg', 
          originalname: metadata.title, 
          buffer 
        } as Express.Multer.File,
        metadata
      )

    } catch (error) {
      this.logguer.error(`Error when get video from YoutTube ${job.data.youtubeLink}`)
      this.logguer.error(error)
    }

  }
}