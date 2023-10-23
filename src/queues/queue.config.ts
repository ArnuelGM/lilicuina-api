import { BullModule } from "@nestjs/bull";

export const QUEUE_MODULE = BullModule.forRoot({
  redis: {
    host: 'localhost',
    port: 6379,
  },
})