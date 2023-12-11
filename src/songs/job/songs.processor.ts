import { Inject, Logger } from '@nestjs/common';
import { Process, Processor } from '@nestjs/bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from 'bull';
import { Song } from '../entities/song.entity';
import { SongMetadata } from '../entities/song-metadata.entity';
import { Repository } from 'typeorm';
import * as albumArt from 'album-art'
import * as ffprobe from 'ffprobe'
import * as which from 'which'
import * as spawn from 'await-spawn'
import { readFileSync, rmSync } from 'node:fs'
import YTDlpWrap from 'yt-dlp-wrap';
import { CreateSongDto } from '../dto/create-song.dto';
import * as crypto from 'node:crypto'
import { SongsService } from '../songs.service';

export function createHash(seed = null) {
  seed = seed ?? crypto.randomUUID()
  return crypto.randomUUID()
  //return crypto.createHash('md5').update(seed).digest('hex')
}

@Processor('song-metadata')
export class SongsMetadataProcessor {

  @Inject(SongsService)
  private songService: SongsService

  @InjectRepository(Song)
  private songRespository: Repository<Song>

  @InjectRepository(SongMetadata)
  private metadataRepository: Repository<SongMetadata>

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
  async handleGetAudioDuration(job: Job<SongMetadata>) {
    this.logguer.log(`Starting get get audio duration for ${job.data.id}...\n`)
    try {
      const songMetadata = await this.metadataRepository.findOneBy({ id: job.data.id })
      const fileMetadata = await ffprobe(`./storage/songs/${songMetadata.fileName}`, { path: which.sync('ffprobe') })
      songMetadata.duration = fileMetadata.streams[0].duration
      await this.metadataRepository.save(songMetadata)
    } catch (error) {
      this.logguer.error(`Error when get audio duration for ${job.data.id}`)
      this.logguer.error(error)
    }
    finally {
      this.logguer.log(`End get get audio duration for ${job.data.id}\n`)
    }
  }

  /**
   * Generate Lyrics with openai whisper
   * Repository: https://github.com/openai/whisper
   */
  @Process('GenerateLyrics')
  async handleGenerateLyrics(job: Job<SongMetadata>) {
    const filePath = `./storage/songs/${job.data.fileName}`
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

  /**
   * Download audio from youtube
   * Get binary from: https://github.com/yt-dlp/yt-dlp/releases
   */
  @Process('DownloadYoutube')
  async handleDownloadYoutube(job: Job<CreateSongDto>) {

    const ytDlpWrap = new YTDlpWrap('./yt-dlp')
    const filename = createHash()
    const metadata = await ytDlpWrap.getVideoInfo(job.data.youtubeLink)

    ytDlpWrap.exec([
      job.data.youtubeLink,
      '-f',
      'bestaudio/best',
      '--audio-multistreams',
      '-o',
      `./storage/songs/${filename}`
    ])
    .on('error', () => {
      this.logguer.error(`Error when get video from YoutTube ${job.data.youtubeLink}`)
    })
    .on('close', async () => {
      await this.convertToMp3(`./storage/songs/${filename}`)
      rmSync(`./storage/songs/${filename}`)
      this.songService.create(
        job.data,
        ({ filename: `${filename}.mp3`, mimetype: 'audio/mpeg', originalname: metadata.title } as Express.Multer.File),
        metadata
      )
    })

  }

  /**
   * Convert audio file to .mp3 format
   */
  async convertToMp3(filePath: string) {
    // ffmpeg -i <filePath> -vn -ar 44100 -ac 2 -b:a 192k <output>.mp3
    const ffmpegCommand = which.sync('ffmpeg')
    const output = `${filePath}.mp3`
    const commandParams = [
      '-i', filePath,
      '-vn', '-ar', '44100',
      '-ac', '2', 
      '-b:a', '192k',
      output
    ]
    await spawn(ffmpegCommand, commandParams)
    return output
  }
}