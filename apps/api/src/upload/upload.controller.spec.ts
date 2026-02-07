import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';

describe('UploadController', () => {
  let controller: UploadController;
  let uploadService: { saveFiles: jest.Mock };

  beforeEach(async () => {
    uploadService = {
      saveFiles: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UploadController],
      providers: [
        { provide: UploadService, useValue: uploadService },
        Reflector,
      ],
    }).compile();

    controller = module.get<UploadController>(UploadController);
  });

  const createMockFile = (
    originalname: string,
    mimetype: string,
  ): Express.Multer.File => ({
    fieldname: 'files',
    originalname,
    encoding: '7bit',
    mimetype,
    size: 1024,
    buffer: Buffer.from('fake-image-data'),
    destination: '',
    filename: '',
    path: '',
    stream: null as any,
  });

  describe('uploadImages', () => {
    it('유효한 이미지 파일을 업로드하면 URL을 반환한다', async () => {
      const files = [createMockFile('photo.jpg', 'image/jpeg')];
      const expectedUrls = ['/uploads/products/uuid.jpg'];
      uploadService.saveFiles.mockResolvedValue(expectedUrls);

      const result = await controller.uploadImages(files);

      expect(result).toEqual({ urls: expectedUrls });
      expect(uploadService.saveFiles).toHaveBeenCalledWith(files);
    });

    it('여러 이미지를 동시에 업로드할 수 있다', async () => {
      const files = [
        createMockFile('photo1.jpg', 'image/jpeg'),
        createMockFile('photo2.png', 'image/png'),
        createMockFile('photo3.webp', 'image/webp'),
      ];
      const expectedUrls = [
        '/uploads/products/uuid1.jpg',
        '/uploads/products/uuid2.png',
        '/uploads/products/uuid3.webp',
      ];
      uploadService.saveFiles.mockResolvedValue(expectedUrls);

      const result = await controller.uploadImages(files);

      expect(result.urls).toHaveLength(3);
    });

    it('허용되지 않는 MIME 타입이면 BadRequestException을 발생시킨다', async () => {
      const files = [createMockFile('doc.pdf', 'application/pdf')];

      await expect(controller.uploadImages(files)).rejects.toThrow(BadRequestException);
      expect(uploadService.saveFiles).not.toHaveBeenCalled();
    });

    it('image/jpeg를 허용한다', async () => {
      const files = [createMockFile('photo.jpg', 'image/jpeg')];
      uploadService.saveFiles.mockResolvedValue(['/uploads/products/uuid.jpg']);

      await expect(controller.uploadImages(files)).resolves.not.toThrow();
    });

    it('image/png를 허용한다', async () => {
      const files = [createMockFile('photo.png', 'image/png')];
      uploadService.saveFiles.mockResolvedValue(['/uploads/products/uuid.png']);

      await expect(controller.uploadImages(files)).resolves.not.toThrow();
    });

    it('image/webp를 허용한다', async () => {
      const files = [createMockFile('photo.webp', 'image/webp')];
      uploadService.saveFiles.mockResolvedValue(['/uploads/products/uuid.webp']);

      await expect(controller.uploadImages(files)).resolves.not.toThrow();
    });

    it('image/gif를 허용한다', async () => {
      const files = [createMockFile('photo.gif', 'image/gif')];
      uploadService.saveFiles.mockResolvedValue(['/uploads/products/uuid.gif']);

      await expect(controller.uploadImages(files)).resolves.not.toThrow();
    });

    it('허용되지 않는 파일이 섞여있으면 전체를 거부한다', async () => {
      const files = [
        createMockFile('photo.jpg', 'image/jpeg'),
        createMockFile('doc.txt', 'text/plain'),
      ];

      await expect(controller.uploadImages(files)).rejects.toThrow(BadRequestException);
      expect(uploadService.saveFiles).not.toHaveBeenCalled();
    });

    it('에러 메시지에 파일 이름을 포함한다', async () => {
      const files = [createMockFile('malicious.exe', 'application/x-msdownload')];

      await expect(controller.uploadImages(files)).rejects.toThrow(
        /malicious\.exe/,
      );
    });
  });
});
