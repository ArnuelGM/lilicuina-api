import { BullModule } from "@nestjs/bull";

export const QUEUE_MODULE = BullModule.forRoot({
  redis: {
    host: 'localhost',
    port: 6379,
    enableOfflineQueue: true,
    offlineQueue: true,
    reconnectOnError: (error) => {
      console.log('Error al conectar al servidor de redis', error)
      console.log('Intentando reconectarse...')
      return true
    }
  },
})