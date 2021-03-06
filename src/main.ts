import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
// process.env['NODE_TLS_REJECT_UNAUTHORIZED']='0';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  await app.listen(5000);
}
bootstrap();
