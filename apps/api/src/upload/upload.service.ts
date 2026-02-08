import { Injectable, BadRequestException } from "@nestjs/common";
import { randomUUID } from "crypto";
import * as fs from "fs";
import * as path from "path";

@Injectable()
export class UploadService {
  private readonly uploadDir: string;

  constructor() {
    // 프로젝트 루트 기준 uploads/products/ 디렉토리
    this.uploadDir = path.join(process.cwd(), "uploads", "products");
    this.ensureUploadDir();
  }

  private ensureUploadDir(): void {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async saveFiles(files: Express.Multer.File[]): Promise<string[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException("업로드할 파일이 없습니다.");
    }

    const urls: string[] = [];

    for (const file of files) {
      const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
      const filename = `${randomUUID()}${ext}`;
      const filePath = path.join(this.uploadDir, filename);

      fs.writeFileSync(filePath, file.buffer);
      urls.push(`/uploads/products/${filename}`);
    }

    return urls;
  }
}
