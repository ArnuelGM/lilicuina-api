import { Logger } from '@nestjs/common';
import { Process, Processor } from '@nestjs/bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from 'bull';
import { Song } from '../entities/song.entity';
import { SongMetadata } from '../entities/song-metadata.entity';
import { Repository } from 'typeorm';
import * as albumArt from 'album-art'
import * as ffprobe from 'ffprobe'
import * as which from 'which'

@Processor('song-metadata')
export class SongsMetadataProcessor {

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
      this.logguer.log(`End get album art for ${job.data.id}...\n`)
    }
  }
  
  @Process('GetAudioDuration')
  async handleGetAudioDuration(job: Job<SongMetadata>) {
    this.logguer.log(`Starting get get audio duration for ${job.data.id}...\n`)
    try {
      const songMetadata = await this.metadataRepository.findOneBy({ id: job.data.id })
      const fileMetadata = await ffprobe(`./storage/songs/${songMetadata.fileName}`, { path: which.sync('ffprobe') })
      songMetadata.duration = fileMetadata.streams[0].duration
      await this.metadataRepository.save(songMetadata)
    } catch (error) {
      this.logguer.error(`Error when get audio diration for ${job.data.id}`)
      this.logguer.error(error)
    }
    finally {
      this.logguer.log(`End get get audio duration for ${job.data.id}...\n`)
    }
  }

}