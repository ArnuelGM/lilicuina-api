import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SongsModule } from './songs/songs.module';
import { DB_MODULE } from './database/database.config';
import { QUEUE_MODULE } from './queues/queue.config';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [
    DB_MODULE,
    EventEmitterModule.forRoot(),
    QUEUE_MODULE,
    SongsModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
