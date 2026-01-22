import { Test, TestingModule } from '@nestjs/testing';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { DashboardQueryService } from './query.service';
import { ConfigService } from '@nestjs/config';

describe('DashboardController', () => {
  let controller: DashboardController;
  let queryService: DashboardQueryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [
        DashboardService,
        {
          provide: DashboardQueryService,
          useValue: queryService
        },
      ],
    }).compile();

    controller = module.get<DashboardController>(DashboardController);
    queryService = module.get<DashboardQueryService>(DashboardQueryService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
