import { HttpStatus, Injectable } from '@nestjs/common';
import { genSalt, hash, compare } from 'bcryptjs';
import { FileService } from './file.service';
import * as path from 'path';
import { AppError } from '@shared/AppError'; // Assuming you have a custom AppError class
import { ErrorHandlingService } from './error-handling.service';

@Injectable()
export class AuthService {
  private readonly passwordFilePath = path.join(
    __dirname,
    '../../data/passwords.json',
  );
  private adminPassword = 'admin123'; // Admin password

  constructor(
    private readonly fileService: FileService,
    private readonly errorHandler: ErrorHandlingService,
  ) {}

  changeAdminPassword(oldPassword: string, newPassword: string): void {
    if (oldPassword !== this.adminPassword) {
      throw new AppError('Invalid old password', HttpStatus.UNAUTHORIZED);
    }
    this.adminPassword = newPassword;
  }

  async addPassword(userId: string, password: string): Promise<void> {
    try {
      const hashedPassword = await this.hashPassword(password);
      await this.storePasswordHash(userId, hashedPassword);
    } catch {
      throw new AppError(
        'Error adding password',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Hash the password using bcrypt
  async hashPassword(password: string): Promise<string> {
    try {
      const salt = await genSalt();
      return await hash(password, salt);
    } catch {
      throw new AppError(
        'Error hashing password',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Store the hashed password in a file
  async storePasswordHash(
    userId: string,
    hashedPassword: string,
  ): Promise<void> {
    try {
      const passwords = await this.fileService.readJsonFile<
        Record<string, string>
      >(this.passwordFilePath);
      passwords[userId] = hashedPassword;
      await this.fileService.writeJsonFile(this.passwordFilePath, passwords);
    } catch {
      throw new AppError(
        'Error storing password hash',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  validateAdminPassword(password: string): boolean {
    return password === this.adminPassword;
  }

  // Validate the password by comparing the provided password with the stored hash
  async validatePassword(userId: string, password: string): Promise<boolean> {
    try {
      const isAdmin = this.validateAdminPassword(password);
      if (isAdmin) {
        return true;
      } else {
        if (userId === 'admin') {
          throw new AppError('Invalid admin password', HttpStatus.UNAUTHORIZED);
        }
      }

      // Validate user password if not admin
      const passwords = await this.fileService.readJsonFile<
        Record<string, string>
      >(this.passwordFilePath);
      const storedHash = passwords[userId];
      if (!storedHash)
        throw new AppError(`User ${userId} not found`, HttpStatus.NOT_FOUND);

      const isValid = await compare(password, storedHash);
      if (!isValid)
        throw new AppError('Invalid password', HttpStatus.UNAUTHORIZED);

      return isValid;
    } catch (error) {
      this.errorHandler.handleError(error);
    }
  }
}
