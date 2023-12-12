import { BullModule } from "@nestjs/bull";
import { ConfigModule, ConfigService } from "@nestjs/config";

export const QUEUE_MODULE = BullModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => ({
    redis: {
      host: configService.get('QUEUE_REDIS_HOST'),
      port: configService.get('QUEUE_REDIS_PORT'),
      enableOfflineQueue: true,
      offlineQueue: true,
      reconnectOnError: (error) => {
        console.log('Error al conectar al servidor de redis', error)
        console.log('Intentando reconectarse...')
        return true
      }
    }
  }),
  inject: [ConfigService]
})