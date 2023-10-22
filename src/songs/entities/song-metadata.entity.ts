import {
  Column, 
  Entity, 
  Generated, 
  JoinColumn, 
  OneToOne, 
  PrimaryColumn, 
  Relation
} from "typeorm";
import { Song } from "./song.entity";

@Entity()
export class SongMetadata {

  @PrimaryColumn()
  @Generated('uuid')
  id: string

  @OneToOne(type => Song)
  @JoinColumn()
  song: Relation<Song>

  @Column({ nullable: true })
  year: number

  @Column({ nullable: true })
  duration: number

  @Column({ nullable: true })
  lirycs: string

  @Column({ nullable: true })
  fileName: string
  
  @Column({ nullable: true })
  mimeType: string

  @Column({ nullable: true })
  originalName: string

}