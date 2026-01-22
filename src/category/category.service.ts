import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { EntityNotFoundError, Repository } from 'typeorm';
import { PaginationDTO, PaginatedResult } from 'src/common/dto/pagination.dto';

@Injectable() 
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto) {
    const exists = await this.categoryRepo.findOne({
      where: { name: createCategoryDto.name },
    });
    console.log(createCategoryDto);
    if (exists?.id) {
      throw new ConflictException('Category exists');
    }

    return await this.categoryRepo.save(createCategoryDto);
  }

  async findAll(paginationDto: PaginationDTO): Promise<PaginatedResult<Category>> {
    return {
      data: await this.categoryRepo.find(),
      meta: {
        total: await this.categoryRepo.count(),
        page: paginationDto.page,
        limit: paginationDto.limit,
        totalPages: Math.ceil(await this.categoryRepo.count() / paginationDto.limit),
      },
    };
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto) {
    try {
    const category = await this.categoryRepo.findOneOrFail({ where: { id: id } });
    this.categoryRepo.merge(category, updateCategoryDto);
    return await this.categoryRepo.save(category);
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        throw new NotFoundException();
      }
      throw error;
    }
  }

  async remove(id: number) {
    await this.categoryRepo.delete(id);
  }
}
