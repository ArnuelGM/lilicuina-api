import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Generated,
  OneToOne,
  PrimaryColumn,
  Relation,
  UpdateDateColumn
} from "typeorm";
import { SongMetadata } from "./song-metadata.entity";

@Entity()
export class Song { 

  @PrimaryColumn()
  @Generated('uuid')
  id: string

  @Column()
  title: string

  @Column({ nullable: true })
  artist: string

  @Column({ nullable: true })
  album: string

  @Column({ nullable: true })
  cover: string

  @OneToOne(() => SongMetadata, (songMetadata) => songMetadata.song, { cascade: true })
  metadata: Relation<SongMetadata>

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @DeleteDateColumn()
  deletedAt: Date

}
