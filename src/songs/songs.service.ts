import { SongMetadata } from './entities/song-metadata.entity';
import { Injectable } from '@nestjs/common';
import { CreateSongDto } from './dto/create-song.dto';
import { UpdateSongDto } from './dto/update-song.dto';
import { Express } from 'express'
import { InjectRepository } from '@nestjs/typeorm';
import { Song } from './entities/song.entity';
import { Repository } from 'typeorm';

import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class SongsService {

  constructor( 
    @InjectRepository(Song)
    private songRespository: Repository<Song>,

    @InjectQueue('song-metadata')
    private readonly audioQueue: Queue
  ){}

  async create(createSongDto: CreateSongDto, songFile: Express.Multer.File) {
  
    const songMetadata = new SongMetadata()
    songMetadata.fileName = songFile.filename
    songMetadata.mimeType = songFile.mimetype
    songMetadata.originalName = songFile.originalname

    const song = new Song()
    Object.assign(song, createSongDto)
    song.metadata = songMetadata

    const data = await this.songRespository.save(song)

    this.audioQueue.add('GetAlbumArt', song, {delay: 1000})
    this.audioQueue.add('GetAudioDuration', songMetadata, {delay: 1000})
    
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
