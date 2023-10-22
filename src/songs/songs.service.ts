import { Injectable } from '@nestjs/common';
import { CreateSongDto } from './dto/create-song.dto';
import { UpdateSongDto } from './dto/update-song.dto';
import { Express } from 'express'
import { InjectRepository } from '@nestjs/typeorm';
import { Song } from './entities/song.entity';
import { Repository } from 'typeorm';

@Injectable()
export class SongsService {

  constructor(
    @InjectRepository(Song)
    private songRespository: Repository<Song>
  ){}

  async create(createSongDto: CreateSongDto, songFile: Express.Multer.File) {
  
    const song = await this.songRespository.save(createSongDto)
    console.log({ song })
    return song

  }

  findAll() {
    return `This action returns all songs`;
  }

  findOne(id: number) {
    return `This action returns a #${id} song`;
  }

  update(id: number, updateSongDto: UpdateSongDto) {
    return `This action updates a #${id} song`;
  }

  remove(id: number) {
    return `This action removes a #${id} song`;
  }
}
