import { IsNotEmpty, IsOptional, IsString } from "class-validator"

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

}
