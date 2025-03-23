import { Injectable } from "@nestjs/common";
import * as fs from 'fs/promises';

@Injectable()
export class FileService{
  public async readJsonFile<T>(path: string): Promise<T> {
    try{
      const data = await fs.readFile(path, 'utf-8');
      return JSON.parse(data) as T;
    }
    catch (err){
      if(err.code === 'ENOENT') return {} as T;
      throw err;
    }
  }

  public async writeJsonFile<T>(path: string, data: T): Promise<void> {
    await fs.writeFile(path, JSON.stringify(data, null, 2), 'utf-8');
  }

}