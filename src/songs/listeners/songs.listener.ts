import { Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { SongMetadata } from "../entities/song-metadata.entity";
import { Song } from "../entities/song.entity";
import { InjectQueue } from "@nestjs/bull";
import { Queue } from "bull";

@Injectable()
export class SongsListener {

  private logger: Logger = new Logger()

  constructor(
    @InjectQueue('song-metadata')
    private readonly audioQueue: Queue,
  ) { }

  @OnEvent('song.created')
  handleSongCreated({ song, songMetadata }: { song: Song, songMetadata: SongMetadata }) {

    try {
      this.audioQueue.add('GetAlbumArt', song)
      this.audioQueue.add('GetAudioDuration', songMetadata)
      this.audioQueue.add('GenerateLyrics', songMetadata)
    }
    catch (error) {
      this.logger.error(`Error al procesar una o más queues for song: ${song.id} - ${song.title}`)
    }

  }

}