import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFile, ParseFilePipe, FileTypeValidator, ParseFilePipeBuilder, Header } from '@nestjs/common';
import { SongsService } from './songs.service';
import { CreateSongDto } from './dto/create-song.dto';
import { UpdateSongDto } from './dto/update-song.dto';
import { Express } from 'express'
import { FileInterceptor } from '@nestjs/platform-express';

const fileInterceptor = FileInterceptor('song', { dest: './storage/songs/' })

const songFileValidator = new ParseFilePipeBuilder().addFileTypeValidator({
  fileType: 'audio/*'
}).build()

@Controller('songs')
export class SongsController {
  constructor(private readonly songsService: SongsService) {}

  @Post()
  @UseInterceptors(fileInterceptor)
  create(
    @Body() createSongDto: CreateSongDto,
    @UploadedFile(songFileValidator)  song: Express.Multer.File
  ) {
    return this.songsService.create(createSongDto, song)
  }

  @Get()
  findAll() {
    return this.songsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.songsService.findOne(id)
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
