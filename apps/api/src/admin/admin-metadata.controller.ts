import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { UserRole } from "@prisma/client";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { AdminMetadataService } from "./admin-metadata.service";
import {
  AdminCategoryQueryDto,
  AdminUpdateCategoryDto,
  AdminDeviceModelQueryDto,
  AdminCreateDeviceModelDto,
  AdminUpdateDeviceModelDto,
  AdminModelVariantQueryDto,
  AdminCreateModelVariantDto,
  AdminUpdateModelVariantDto,
} from "./dto";

@ApiTags("admin-metadata")
@Controller("admin/metadata")
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@ApiBearerAuth()
export class AdminMetadataController {
  constructor(private readonly metadataService: AdminMetadataService) {}

  // ---------------------------------------------------------------------------
  // Enums
  // ---------------------------------------------------------------------------

  @Get("enums")
  @ApiOperation({
    summary: "읽기전용 enum 목록 (Brand, Category, Grade, Storage)",
  })
  getEnums() {
    return this.metadataService.getEnums();
  }

  // ---------------------------------------------------------------------------
  // Category
  // ---------------------------------------------------------------------------

  @Get("categories")
  @ApiOperation({ summary: "카테고리 목록" })
  findAllCategories(@Query() query: AdminCategoryQueryDto) {
    return this.metadataService.findAllCategories(query);
  }

  @Patch("categories/:id")
  @ApiOperation({ summary: "카테고리 수정" })
  updateCategory(@Param("id") id: string, @Body() dto: AdminUpdateCategoryDto) {
    return this.metadataService.updateCategory(id, dto);
  }

  // ---------------------------------------------------------------------------
  // DeviceModel
  // ---------------------------------------------------------------------------

  @Get("device-models")
  @ApiOperation({ summary: "기기모델 목록 (페이지네이션)" })
  findAllDeviceModels(@Query() query: AdminDeviceModelQueryDto) {
    return this.metadataService.findAllDeviceModels(query);
  }

  @Post("device-models")
  @ApiOperation({ summary: "기기모델 생성" })
  createDeviceModel(@Body() dto: AdminCreateDeviceModelDto) {
    return this.metadataService.createDeviceModel(dto);
  }

  @Patch("device-models/:id")
  @ApiOperation({ summary: "기기모델 수정" })
  updateDeviceModel(
    @Param("id") id: string,
    @Body() dto: AdminUpdateDeviceModelDto,
  ) {
    return this.metadataService.updateDeviceModel(id, dto);
  }

  @Delete("device-models/:id")
  @ApiOperation({ summary: "기기모델 삭제/비활성화" })
  removeDeviceModel(@Param("id") id: string) {
    return this.metadataService.removeDeviceModel(id);
  }

  // ---------------------------------------------------------------------------
  // ModelVariant
  // ---------------------------------------------------------------------------

  @Get("model-variants")
  @ApiOperation({ summary: "모델변형 목록 (페이지네이션)" })
  findAllModelVariants(@Query() query: AdminModelVariantQueryDto) {
    return this.metadataService.findAllModelVariants(query);
  }

  @Post("model-variants")
  @ApiOperation({ summary: "모델변형 생성" })
  createModelVariant(@Body() dto: AdminCreateModelVariantDto) {
    return this.metadataService.createModelVariant(dto);
  }

  @Patch("model-variants/:id")
  @ApiOperation({ summary: "모델변형 수정" })
  updateModelVariant(
    @Param("id") id: string,
    @Body() dto: AdminUpdateModelVariantDto,
  ) {
    return this.metadataService.updateModelVariant(id, dto);
  }

  @Delete("model-variants/:id")
  @ApiOperation({ summary: "모델변형 삭제" })
  removeModelVariant(@Param("id") id: string) {
    return this.metadataService.removeModelVariant(id);
  }
}
