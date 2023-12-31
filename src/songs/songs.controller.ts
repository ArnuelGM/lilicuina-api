import { 
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  ParseFilePipeBuilder,
  Res,
  Query
} from '@nestjs/common';
import { SongsService } from './songs.service';
import { CreateSongDto } from './dto/create-song.dto';
import { UpdateSongDto } from './dto/update-song.dto';
import { Response } from 'express'
import { FileInterceptor } from '@nestjs/platform-express';
import { PaginationDto } from './dto/pagination.dto';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';

const songFileValidator = new ParseFilePipeBuilder().addFileTypeValidator({
  fileType: 'audio/*'
}).build()

@Controller('songs')
export class SongsController {
  
  constructor(
    private readonly songsService: SongsService,
    private config: ConfigService,
    private eventEmitter: EventEmitter2,
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('song'))
  create(
    @Body() createSongDto: CreateSongDto,
    @UploadedFile(songFileValidator)  song: Express.Multer.File
  ) {
    return this.songsService.create(createSongDto, song)
  }

  @Post('youtube')
  createYoutube(
    @Body() createSongDto: CreateSongDto,
  ) {
    this.eventEmitter.emitAsync('song.youtube', createSongDto)

    return {data: createSongDto}
  }

  @Get('search')
  searchSong(@Query('q') q: string, @Query() query: PaginationDto) {
    return this.songsService.search(q, query)
  }

  @Get()
  findAll(@Query() query: PaginationDto) {
    return this.songsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.songsService.findOne(id)
  }
  
  @Get(':id/file')
  async getSongFile(@Param('id') id: string, @Res({ passthrough: true }) res: Response) {
    const {file, mimeType} = await this.songsService.getSongFile(id)
    //'Content-Disposition': 'attachment; filename="song"'
    res.set({
      'Content-Type': mimeType,
      'Transfer-Encoding': 'chunked'
    })
    return file
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSongDto: UpdateSongDto) {
    return this.songsService.update(id, updateSongDto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.songsService.remove(id)
  }
}
