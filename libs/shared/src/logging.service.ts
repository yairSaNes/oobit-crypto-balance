import { Injectable, LoggerService } from '@nestjs/common';
import { FileService } from './file.service';
import * as path from 'path';

@Injectable()
export class LoggingService implements LoggerService {
  private readonly logFilePath = path.join(__dirname, '../../logs/app.log');

  constructor(private readonly fileService: FileService) {}

  private writeToFile(message: string) {
    try {
      this.fileService.writeToLogFileSync(this.logFilePath, message);
    } catch (error) {
      console.error('Failed to write log to file:', error);
    }
  }

  log(message: string, context?: string) {
    const logMessage = `[INFO] ${new Date().toISOString()} ${context ? `[${context}]` : ''} ${message}`;
    console.log(logMessage);
    this.writeToFile(logMessage);
  }

  warn(message: string, context?: string) {
    const logMessage = `[WARN] ${new Date().toISOString()} ${context ? `[${context}]` : ''} ${message}`;
    console.warn(logMessage);
    this.writeToFile(logMessage);
  }

  error(message: string, trace?: string, context?: string) {
    const logMessage = `[ERROR] ${new Date().toISOString()} ${context ? `[${context}]` : ''} ${message}`;
    console.error(logMessage);
    this.writeToFile(logMessage);
  }

  debug(message: string, context?: string) {
    const logMessage = `[DEBUG] ${new Date().toISOString()} ${context ? `[${context}]` : ''} ${message}`;
    console.debug(logMessage);
    this.writeToFile(logMessage);
  }
}
