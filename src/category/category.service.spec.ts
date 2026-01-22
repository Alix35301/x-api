import { Test, TestingModule } from '@nestjs/testing';
import { CategoryService } from './category.service';
import { Category } from './entities/category.entity';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException } from '@nestjs/common';

describe('CategoryService', () => {
  let service: CategoryService;
  let repo: Repository<Category>;

  const mockRepository = {
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CategoryService,
        {
          provide: getRepositoryToken(Category),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<CategoryService>(CategoryService);
    repo = module.get<Repository<Category>>(getRepositoryToken(Category));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a category',  async () => {
    const categoryData = { name: 'test'};
    const savedCategory = { id: 1, ...categoryData };

    mockRepository.save.mockResolvedValue(savedCategory);

    const result = await service.create(categoryData);

    expect(mockRepository.save).toHaveBeenCalledWith(categoryData);
    expect(result).toEqual(savedCategory);
  })

  it('should handle database error when creating a category', async () => {
    mockRepository.save.mockRejectedValue(new Error('Database Error'));

    await expect(service.create({
      name: 'test'
    })).rejects.toThrow('Database Error');
  });

  it('should throw conflict exception if category exists', async () => {
    mockRepository.findOne.mockResolvedValue({id: 1, name: 'test'});

    await expect(service.create({
      name:'test'
    })).rejects.toThrow(ConflictException)
  });

});
