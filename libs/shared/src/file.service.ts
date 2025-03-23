import { Injectable } from "@nestjs/common";
import * as fs from 'fs';
import * as path from 'path';


@Injectable()
export class FileService{
  // public async readJsonFile2<T>(filePath: string): Promise<T> {
  //   try{
  //     if(!fs.existsSync(filePath)){
  //       console.warn(`File ${filePath} not found. Creating new file...`);
  //       await this.writeJsonFile(filePath, []);
  //       return [] as T;
  //     }
  //     const content = await fs.promises.readFile(filePath, 'utf8');
  //     const data = JSON.parse(content);
      
  //     return (Array.isArray(data) ? data : []) as T;
  //   }
  //   catch (err){
  //     throw err;
  //   }
  // }

  public async readJsonFile<T>(filePath: string): Promise<T> {
    try{
      const data = await fs.promises.readFile(filePath, 'utf-8');
      return JSON.parse(data) as T;
    }
    catch (err){
      if(err.code === 'ENOENT'){
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
      await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
    } 
    catch (error) {
      console.error(`Error writing to ${filePath}:`, error);
    }  
  }
}