import { Module } from '@nestjs/common';
import { SongsService } from './songs.service';
import { SongsController } from './songs.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Song } from './entities/song.entity';
import { SongMetadata } from './entities/song-metadata.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Song,
      SongMetadata
    ])
  ],
  controllers: [SongsController],
  providers: [SongsService],
})
export class SongsModule {}
