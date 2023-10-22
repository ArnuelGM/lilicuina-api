import { SongMetadata } from './entities/song-metadata.entity';
import { Injectable } from '@nestjs/common';
import { CreateSongDto } from './dto/create-song.dto';
import { UpdateSongDto } from './dto/update-song.dto';
import { Express } from 'express'
import { InjectRepository } from '@nestjs/typeorm';
import { Song } from './entities/song.entity';
import { Repository } from 'typeorm';
import * as ffprobe from 'ffprobe'
import * as which from 'which'
import * as albumArt from 'album-art'

@Injectable()
export class SongsService {

  constructor( 
    @InjectRepository(Song)
    private songRespository: Repository<Song>,
    
    @InjectRepository(SongMetadata)
    private metadataRepository: Repository<SongMetadata>
  ){}

  async updateMetadata(songMetadata: SongMetadata) {
    const fileMetadata = await ffprobe(`./storage/songs/${songMetadata.fileName}`, { path: which.sync('ffprobe') })
    songMetadata.duration = fileMetadata.streams[0].duration
    return await this.metadataRepository.save(songMetadata)
  }

  async getAlbubArt(song: Song) {
    const cover = await albumArt(song.artist, { album: song.album, size: 'large' })
    song.cover = cover
    return await this.songRespository.save(song)
  }

  async create(createSongDto: CreateSongDto, songFile: Express.Multer.File) {
  
    const songMetadata = new SongMetadata()
    songMetadata.fileName = songFile.filename
    songMetadata.mimeType = songFile.mimetype
    songMetadata.originalName = songFile.originalname

    const song = new Song()
    Object.assign(song, createSongDto)
    song.metadata = songMetadata

    const data = await this.songRespository.save(song)

    // TODO: make this in queues
    try {
      this.getAlbubArt(song)
      this.updateMetadata(songMetadata)
    }
    catch (error) {
      console.log({error})
    }
    
    return { data }
  }

  async findAll() {
    const data = await this.songRespository.find()
    return { data } 
  }

  async findOne(id: string) {
    const data = await this.songRespository.findOne({
      where: { id },
      relations: { metadata: true }
    })
    return { data } 
  }

  update(id: string, updateSongDto: UpdateSongDto) {
    return `This action updates a #${id} song`
  }

  remove(id: string) {
    return `This action removes a #${id} song`
  }
}
