import { Test, TestingModule } from "@nestjs/testing";
import { AdminMetadataController } from "./admin-metadata.controller";
import { AdminMetadataService } from "./admin-metadata.service";

describe("AdminMetadataController", () => {
  let controller: AdminMetadataController;
  let service: jest.Mocked<AdminMetadataService>;

  beforeEach(async () => {
    const mockService = {
      getEnums: jest.fn(),
      findAllCategories: jest.fn(),
      updateCategory: jest.fn(),
      findAllDeviceModels: jest.fn(),
      createDeviceModel: jest.fn(),
      updateDeviceModel: jest.fn(),
      removeDeviceModel: jest.fn(),
      findAllModelVariants: jest.fn(),
      createModelVariant: jest.fn(),
      updateModelVariant: jest.fn(),
      removeModelVariant: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminMetadataController],
      providers: [{ provide: AdminMetadataService, useValue: mockService }],
    }).compile();

    controller = module.get<AdminMetadataController>(AdminMetadataController);
    service = module.get(AdminMetadataService);
  });

  it("컨트롤러가 정의되어 있는지", () => {
    expect(controller).toBeDefined();
  });

  // ---------------------------------------------------------------------------
  // Enums
  // ---------------------------------------------------------------------------
  describe("getEnums", () => {
    it("서비스의 getEnums를 호출한다", () => {
      const mockResult = {
        brands: [{ key: "APPLE", label: "애플" }],
        categories: [{ key: "SMARTPHONE", label: "스마트폰", icon: "phone" }],
        grades: [
          {
            key: "NEW",
            label: "새제품",
            description: "미개봉",
            color: "emerald",
          },
        ],
        storageOptions: ["128GB", "256GB"] as const,
      };
      service.getEnums.mockReturnValue(mockResult as any);

      const result = controller.getEnums();

      expect(result).toEqual(mockResult);
      expect(service.getEnums).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // Category
  // ---------------------------------------------------------------------------
  describe("findAllCategories", () => {
    it("서비스의 findAllCategories를 호출한다", async () => {
      const mockCategories = [
        { id: "cat-1", type: "SMARTPHONE", name: "스마트폰" },
      ];
      service.findAllCategories.mockResolvedValue(mockCategories as any);

      const result = await controller.findAllCategories({});

      expect(result).toEqual(mockCategories);
      expect(service.findAllCategories).toHaveBeenCalledWith({});
    });

    it("쿼리 파라미터를 전달한다", async () => {
      service.findAllCategories.mockResolvedValue([] as any);
      const query = { type: "SMARTPHONE" as any, isActive: true };

      await controller.findAllCategories(query);

      expect(service.findAllCategories).toHaveBeenCalledWith(query);
    });
  });

  describe("updateCategory", () => {
    it("서비스의 updateCategory를 호출한다", async () => {
      const mockUpdated = { id: "cat-1", name: "수정된 이름" };
      service.updateCategory.mockResolvedValue(mockUpdated as any);

      const result = await controller.updateCategory("cat-1", {
        name: "수정된 이름",
      });

      expect(result).toEqual(mockUpdated);
      expect(service.updateCategory).toHaveBeenCalledWith("cat-1", {
        name: "수정된 이름",
      });
    });
  });

  // ---------------------------------------------------------------------------
  // DeviceModel
  // ---------------------------------------------------------------------------
  describe("findAllDeviceModels", () => {
    it("서비스의 findAllDeviceModels를 호출한다", async () => {
      const mockResult = {
        data: [],
        meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
      };
      service.findAllDeviceModels.mockResolvedValue(mockResult);

      const result = await controller.findAllDeviceModels({});

      expect(result).toEqual(mockResult);
      expect(service.findAllDeviceModels).toHaveBeenCalledWith({});
    });

    it("쿼리 파라미터를 전달한다", async () => {
      const mockResult = {
        data: [],
        meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
      };
      service.findAllDeviceModels.mockResolvedValue(mockResult);
      const query = { brand: "APPLE" as any, page: 1, limit: 10 };

      await controller.findAllDeviceModels(query);

      expect(service.findAllDeviceModels).toHaveBeenCalledWith(query);
    });
  });

  describe("createDeviceModel", () => {
    it("서비스의 createDeviceModel을 호출한다", async () => {
      const dto = {
        categoryId: "cat-1",
        brand: "APPLE" as any,
        name: "아이폰 16",
      };
      const mockCreated = { id: "model-new", ...dto };
      service.createDeviceModel.mockResolvedValue(mockCreated as any);

      const result = await controller.createDeviceModel(dto);

      expect(result).toEqual(mockCreated);
      expect(service.createDeviceModel).toHaveBeenCalledWith(dto);
    });
  });

  describe("updateDeviceModel", () => {
    it("서비스의 updateDeviceModel을 호출한다", async () => {
      const mockUpdated = { id: "model-1", name: "수정된 모델" };
      service.updateDeviceModel.mockResolvedValue(mockUpdated as any);

      const result = await controller.updateDeviceModel("model-1", {
        name: "수정된 모델",
      });

      expect(result).toEqual(mockUpdated);
      expect(service.updateDeviceModel).toHaveBeenCalledWith("model-1", {
        name: "수정된 모델",
      });
    });
  });

  describe("removeDeviceModel", () => {
    it("서비스의 removeDeviceModel을 호출한다", async () => {
      const mockResult = { message: "기기모델이 삭제되었습니다." };
      service.removeDeviceModel.mockResolvedValue(mockResult);

      const result = await controller.removeDeviceModel("model-1");

      expect(result).toEqual(mockResult);
      expect(service.removeDeviceModel).toHaveBeenCalledWith("model-1");
    });
  });

  // ---------------------------------------------------------------------------
  // ModelVariant
  // ---------------------------------------------------------------------------
  describe("findAllModelVariants", () => {
    it("서비스의 findAllModelVariants를 호출한다", async () => {
      const mockResult = {
        data: [],
        meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
      };
      service.findAllModelVariants.mockResolvedValue(mockResult);

      const result = await controller.findAllModelVariants({});

      expect(result).toEqual(mockResult);
      expect(service.findAllModelVariants).toHaveBeenCalledWith({});
    });

    it("쿼리 파라미터를 전달한다", async () => {
      const mockResult = {
        data: [],
        meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
      };
      service.findAllModelVariants.mockResolvedValue(mockResult);
      const query = { modelId: "model-1", storage: "256GB" };

      await controller.findAllModelVariants(query);

      expect(service.findAllModelVariants).toHaveBeenCalledWith(query);
    });
  });

  describe("createModelVariant", () => {
    it("서비스의 createModelVariant를 호출한다", async () => {
      const dto = {
        modelId: "model-1",
        storage: "256GB",
        color: "블랙",
      };
      const mockCreated = { id: "var-new", ...dto };
      service.createModelVariant.mockResolvedValue(mockCreated as any);

      const result = await controller.createModelVariant(dto);

      expect(result).toEqual(mockCreated);
      expect(service.createModelVariant).toHaveBeenCalledWith(dto);
    });
  });

  describe("updateModelVariant", () => {
    it("서비스의 updateModelVariant를 호출한다", async () => {
      const mockUpdated = { id: "var-1", color: "블루" };
      service.updateModelVariant.mockResolvedValue(mockUpdated as any);

      const result = await controller.updateModelVariant("var-1", {
        color: "블루",
      });

      expect(result).toEqual(mockUpdated);
      expect(service.updateModelVariant).toHaveBeenCalledWith("var-1", {
        color: "블루",
      });
    });
  });

  describe("removeModelVariant", () => {
    it("서비스의 removeModelVariant를 호출한다", async () => {
      const mockResult = { message: "모델변형이 삭제되었습니다." };
      service.removeModelVariant.mockResolvedValue(mockResult);

      const result = await controller.removeModelVariant("var-1");

      expect(result).toEqual(mockResult);
      expect(service.removeModelVariant).toHaveBeenCalledWith("var-1");
    });
  });
});
