import { Injectable, LoggerService } from '@nestjs/common';
import { FileService } from './file.service';
import * as path from 'path';

@Injectable()
export class LoggingService implements LoggerService {
  private readonly logFilePath = path.join(__dirname, '../../logs/app.log');
  private serviceName: string;

  constructor(
    serviceName: string,
    private readonly fileService: FileService,
  ) {
    this.serviceName = serviceName;
  }

  private writeToFile(message: string) {
    try {
      this.fileService.writeToLogFileSync(this.logFilePath, message);
    } catch (error) {
      console.error('Failed to write log to file:', error);
    }
  }

  log(message: string, context?: string) {
    const logMessage = `[${this.serviceName}] [INFO] ${new Date().toISOString()} ${context ? `[${context}]` : ''} ${message}`;
    console.log(logMessage);
    this.writeToFile(logMessage);
  }

  warn(message: string, context?: string) {
    const logMessage = `[${this.serviceName}] [WARN] ${new Date().toISOString()} ${context ? `[${context}]` : ''} ${message}`;
    console.warn(logMessage);
    this.writeToFile(logMessage);
  }

  error(message: string, trace?: string, context?: string) {
    const logMessage = `[${this.serviceName}] [ERROR] ${new Date().toISOString()} ${context ? `[${context}]` : ''} ${message}`;
    console.error(logMessage);
    this.writeToFile(logMessage);
  }

  debug(message: string, context?: string) {
    const logMessage = `[${this.serviceName}] [DEBUG] ${new Date().toISOString()} ${context ? `[${context}]` : ''} ${message}`;
    console.debug(logMessage);
    this.writeToFile(logMessage);
  }
}
