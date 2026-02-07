import { BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { UploadService } from './upload.service';

jest.mock('fs');
jest.mock('crypto', () => ({
  randomUUID: jest.fn().mockReturnValue('test-uuid-1234'),
}));

const mockedFs = fs as jest.Mocked<typeof fs>;

describe('UploadService', () => {
  let service: UploadService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockedFs.existsSync.mockReturnValue(true);
    service = new UploadService();
  });

  describe('constructor', () => {
    it('업로드 디렉토리가 없으면 생성한다', () => {
      mockedFs.existsSync.mockReturnValue(false);
      mockedFs.mkdirSync.mockReturnValue(undefined as any);

      new UploadService();

      expect(mockedFs.mkdirSync).toHaveBeenCalledWith(
        expect.stringContaining(path.join('uploads', 'products')),
        { recursive: true },
      );
    });

    it('업로드 디렉토리가 이미 존재하면 생성하지 않는다', () => {
      mockedFs.existsSync.mockReturnValue(true);

      new UploadService();

      expect(mockedFs.mkdirSync).not.toHaveBeenCalled();
    });
  });

  describe('saveFiles', () => {
    const createMockFile = (
      originalname: string,
      mimetype: string,
      buffer?: Buffer,
    ): Express.Multer.File => ({
      fieldname: 'files',
      originalname,
      encoding: '7bit',
      mimetype,
      size: 1024,
      buffer: buffer || Buffer.from('fake-image-data'),
      destination: '',
      filename: '',
      path: '',
      stream: null as any,
    });

    it('파일을 성공적으로 저장하고 URL을 반환한다', async () => {
      const files = [createMockFile('photo.jpg', 'image/jpeg')];
      mockedFs.writeFileSync.mockReturnValue(undefined);

      const result = await service.saveFiles(files);

      expect(result).toHaveLength(1);
      expect(result[0]).toBe('/uploads/products/test-uuid-1234.jpg');
      expect(mockedFs.writeFileSync).toHaveBeenCalledTimes(1);
    });

    it('여러 파일을 저장하고 URL 배열을 반환한다', async () => {
      const files = [
        createMockFile('photo1.jpg', 'image/jpeg'),
        createMockFile('photo2.png', 'image/png'),
        createMockFile('photo3.webp', 'image/webp'),
      ];
      mockedFs.writeFileSync.mockReturnValue(undefined);

      const result = await service.saveFiles(files);

      expect(result).toHaveLength(3);
      expect(mockedFs.writeFileSync).toHaveBeenCalledTimes(3);
    });

    it('원본 파일의 확장자를 유지한다', async () => {
      const files = [createMockFile('image.png', 'image/png')];
      mockedFs.writeFileSync.mockReturnValue(undefined);

      const result = await service.saveFiles(files);

      expect(result[0]).toMatch(/\.png$/);
    });

    it('확장자가 없는 파일은 .jpg를 기본으로 사용한다', async () => {
      const files = [createMockFile('noext', 'image/jpeg')];
      mockedFs.writeFileSync.mockReturnValue(undefined);

      const result = await service.saveFiles(files);

      expect(result[0]).toMatch(/\.jpg$/);
    });

    it('빈 배열을 전달하면 BadRequestException을 발생시킨다', async () => {
      await expect(service.saveFiles([])).rejects.toThrow(BadRequestException);
    });

    it('null/undefined를 전달하면 BadRequestException을 발생시킨다', async () => {
      await expect(service.saveFiles(null as any)).rejects.toThrow(BadRequestException);
    });

    it('파일 버퍼를 디스크에 기록한다', async () => {
      const buffer = Buffer.from('actual-image-data');
      const files = [createMockFile('photo.jpg', 'image/jpeg', buffer)];
      mockedFs.writeFileSync.mockReturnValue(undefined);

      await service.saveFiles(files);

      expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('test-uuid-1234.jpg'),
        buffer,
      );
    });
  });
});
