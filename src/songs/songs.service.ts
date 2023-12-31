import { SongMetadata } from './entities/song-metadata.entity';
import { Injectable, StreamableFile } from '@nestjs/common';
import { CreateSongDto } from './dto/create-song.dto';
import { UpdateSongDto } from './dto/update-song.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Song } from './entities/song.entity';
import { Repository } from 'typeorm';
import { PaginationDto } from './dto/pagination.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { StorageService } from 'src/storage/storage.service';
import { createHash } from './song.utils';

@Injectable()
export class SongsService {

  constructor( 
    @InjectRepository(Song)
    private songRespository: Repository<Song>,
    private eventEmitter: EventEmitter2,
    private storage: StorageService
  ){}

  async create(createSongDto: CreateSongDto, songFile: Express.Multer.File, songMetadataOptions?: any) {

    const songMetadata = new SongMetadata()
    songMetadata.fileName = `${createHash()}.mp3`
    songMetadata.mimeType = songFile.mimetype
    songMetadata.originalName = songFile.originalname
    if (songMetadataOptions?.duration) {
      songMetadata.duration = songMetadataOptions.duration
    }

    const song = new Song()
    Object.assign(song, createSongDto)
    song.cover = songMetadataOptions?.thumbnail ?? ''
    if (!createSongDto?.artist && songMetadataOptions.artist) {
      song.artist = songMetadataOptions.artist
    }
    if (!createSongDto?.album && songMetadataOptions?.album) {
      song.album = songMetadataOptions.album
    }
    song.metadata = songMetadata

    const data = await this.songRespository.save(song)

    this.eventEmitter.emitAsync('song.created', { song, songMetadata, songFile })
    
    return { data }
  }

  async findAll({ page, perPage }: PaginationDto) {

    const skip = perPage * (page - 1)
    const take = perPage
    
    const [data, total] = await this.songRespository.findAndCount({
      order: {
        createdAt: 'DESC'
      },
      /* skip,
      take */
    })

    return {
      data,
      meta: {
        page: page,
        perPage: perPage,
        total,
        count: data.length,
        totalPages: Math.ceil(total / perPage)
      }
    } 
  }

  async findOne(id: string) {
    const data = await this.songRespository.findOne({
      where: { id },
      relations: { metadata: true }
    })
    return { data } 
  }

  async search(search: string, { page, perPage }) {
    
    const [data, total] = await this.songRespository
      .createQueryBuilder('song')
      .where("song.title LIKE :title", { title: `%${search}%` })
      .orWhere("song.artist LIKE :artist", { artist: `%${search}%` })
      .orderBy('song.title', 'ASC')
      .skip((page -1) * perPage)
      .take(perPage)
      .getManyAndCount()
    
    return {
      data,
      meta: {
        page: page,
        perPage: perPage,
        total,
        count: data.length,
        totalPages: Math.ceil(total / perPage)
      }
    }
  }

  async getSongFile(id: string) {
    const { data: { metadata: { fileName, mimeType } } } = await this.findOne(id)
    return await new Promise<{file: StreamableFile, mimeType: string}>(async (resolve, reject) => {
      try {
        const data: any = await this.storage.getObject(fileName)
        const file = new StreamableFile(data?.Body ? data.Body : data)
        const result = {
          mimeType,
          file
        }
        resolve(result)
      }
      catch(error) {
        reject(error)
      }
    })
  }

  update(id: string, updateSongDto: UpdateSongDto) {
    return `This action updates a #${id} song, but not yet!!`
  }

  remove(id: string) {
    return `This action removes a #${id} song, but not yet!!`
  }
}
