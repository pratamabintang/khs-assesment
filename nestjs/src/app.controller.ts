import { Controller, Get } from '@nestjs/common';
import { Public } from 'src/decorator/public.decorator';

@Controller('health')
export class AppController {
  @Public()
  @Get()
  health() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      env: process.env.NODE_ENV,
    };
  }

  @Public()
  @Get('ready')
  readiness() {
    return {
      ready: true,
      timestamp: new Date().toISOString(),
    };
  }
}
