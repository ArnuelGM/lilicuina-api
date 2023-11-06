import { IsNotEmpty, IsOptional, IsString, IsUrl } from "class-validator"

export class CreateSongDto {

  @IsString()
  @IsNotEmpty()
  title: string

  @IsString()
  @IsOptional()
  artist: string

  @IsString()
  @IsOptional()
  album: string

  @IsString()
  @IsUrl()
  @IsOptional()
  youtubeLink: string
}
