import { Injectable } from '@nestjs/common';

@Injectable()
export class RateServiceService {
  getHello(): string {
    return 'Hello World!';
  }
}
