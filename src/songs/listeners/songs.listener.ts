import { CreateSongDto } from './../dto/create-song.dto';
import { Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { SongMetadata } from "../entities/song-metadata.entity";
import { Song } from "../entities/song.entity";
import { InjectQueue } from "@nestjs/bull";
import { Queue } from "bull";
import { ConfigService } from '@nestjs/config';
import { StorageService } from 'src/storage/storage.service';

@Injectable()
export class SongsListener {

  private logger: Logger = new Logger()

  constructor(
    @InjectQueue('song-metadata')
    private readonly audioQueue: Queue,
    private config: ConfigService,
    private storage: StorageService
  ) { }

  @OnEvent('song.created')
  handleSongCreated({ song, songMetadata, songFile }: { song: Song, songMetadata: SongMetadata, songFile: Express.Multer.File }) {

    try {
      
      this.audioQueue.add('GetAlbumArt', song)
      
      if (!songMetadata.duration) {
        this.audioQueue.add('GetAudioDuration', {songMetadata, songFile})
      }

      // TODO: Search for a way to make this with a buffer or stream
      //this.audioQueue.add('GenerateLyrics', songMetadata)

      const { fileName: key } = songMetadata

      // TODO: Make this in a queue
      if(this.config.get('ENABLE_REMOTE_STORAGE') && songFile?.buffer) {
        this.storage.putObjectRemote(
          key,
          songFile.buffer,
          'audio/mpeg'
        ).then(() => {
          songMetadata.fileName = key
        })
      }
      else {
        this.storage.putObjectLocal(key, songFile.buffer)
      }
    }
    catch (error) {
      this.logger.error(`Error al procesar una o más queues for song: ${song.id} - ${song.title}`)
    }

  }


  @OnEvent('song.youtube')
  handleSongFromYoutube(createSongDto: CreateSongDto) {

    this.audioQueue.add('DownloadYoutube', createSongDto)

  }
}