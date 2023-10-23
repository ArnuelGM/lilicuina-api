import { Module } from '@nestjs/common';
import { SongsService } from './songs.service';
import { SongsController } from './songs.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Song } from './entities/song.entity';
import { SongMetadata } from './entities/song-metadata.entity';
import { BullModule } from '@nestjs/bull';
import { SongsMetadataProcessor } from './job/songs.processor';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Song,
      SongMetadata
    ]),
    BullModule.registerQueue({
      name: 'song-metadata'
    })
  ],
  controllers: [SongsController],
  providers: [SongsService,SongsMetadataProcessor],
})
export class SongsModule {}
