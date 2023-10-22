import { TypeOrmModule } from "@nestjs/typeorm";


export const DB_MODULE = TypeOrmModule.forRoot({
  type: 'sqlite',
  database: './database.db',
  autoLoadEntities: true,
  synchronize: true,
  entities: []
})

