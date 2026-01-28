import { Controller, Get } from '@nestjs/common';
import { Public } from 'src/decorator/public.decorator';

@Controller('health')
export class HealthController {
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
    // Add database connection checks here if needed
    return {
      ready: true,
      timestamp: new Date().toISOString(),
    };
  }
}
