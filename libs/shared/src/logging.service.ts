import { Injectable, LoggerService, Scope } from '@nestjs/common';
import { FileService } from './file.service';
import * as path from 'path';

@Injectable({ scope: Scope.TRANSIENT }) // Ensures a new instance per module
export class LoggingService implements LoggerService {
  private readonly logFilePath = path.join(__dirname, '../../logs/app.log');
  private context = 'App'; // Default context

  constructor(private readonly fileService: FileService) {}

  setContext(context: string) {
    this.context = context;
  }

  private writeToFile(message: string) {
    try {
      this.fileService.writeToLogFileSync(this.logFilePath, message);
    } catch (error) {
      console.error('Failed to write log to file:', error);
    }
  }

  log(message: string) {
    const logMessage = `[INFO] ${new Date().toISOString()} [${this.context}] ${message}`;
    console.log(logMessage);
    this.writeToFile(logMessage);
  }

  warn(message: string) {
    const logMessage = `[WARN] ${new Date().toISOString()} [${this.context}] ${message}`;
    console.warn(logMessage);
    this.writeToFile(logMessage);
  }

  error(message: string, trace?: string) {
    const logMessage = `[ERROR] ${new Date().toISOString()} [${this.context}] ${message} ${trace ? `\nTrace: ${trace}` : ''}`;
    console.error(logMessage);
    this.writeToFile(logMessage);
  }

  debug(message: string) {
    const logMessage = `[DEBUG] ${new Date().toISOString()} [${this.context}] ${message}`;
    console.debug(logMessage);
    this.writeToFile(logMessage);
  }
}
