import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FileService {
  public async readJsonFile<T>(filePath: string): Promise<T> {
    try {
      const data = await fs.promises.readFile(filePath, 'utf-8');
      return JSON.parse(data) as T;
    } catch (err) {
      const error = err as { code?: string };
      if (error.code && error.code === 'ENOENT') {
        await this.writeJsonFile(filePath, []);
        return [] as T;
      }
      throw err;
    }
  }

  public async writeJsonFile<T>(filePath: string, data: T): Promise<void> {
    try {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      await fs.promises.writeFile(
        filePath,
        JSON.stringify(data, null, 2),
        'utf8',
      );
    } catch (error) {
      console.error(`Error writing to ${filePath}:`, error);
    }
  }

  public writeToLogFileSync(filePath: string, message: string) {
    try {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.appendFile(filePath, message + '\n', (err) => {
        if (err) console.error('Failed to write to log file:', err);
      });
    } catch (error) {
      console.error('Error ensuring directory or writing to log file:', error);
    }
  }
}
