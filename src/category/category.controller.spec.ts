import { Test, TestingModule } from '@nestjs/testing';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { Category } from './entities/category.entity';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthGuard } from '../../src/auth/auth.guard';
import { JwtService } from '@nestjs/jwt';

describe('CategoryController', () => {
  let controller: CategoryController;
  let repo: Repository<Category>;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoryController],
      providers: [CategoryService,
        {
          provide: getRepositoryToken(Category),
          useClass: Repository,
        },
        {
          provide: AuthGuard,
          useClass: AuthGuard
        },
        {
          provide: JwtService,
          useClass: JwtService
        }
      ],
    }).compile();

    controller = module.get<CategoryController>(CategoryController);
    repo = module.get<Repository<Category>>(getRepositoryToken(Category));
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

});
