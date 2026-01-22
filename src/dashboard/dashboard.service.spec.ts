import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { DashboardQueryService } from './query.service';

describe('DashboardService', () => {
  let dashboardService: DashboardService;
  let queryService: DashboardQueryService = {} as DashboardQueryService;


  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: DashboardService,
          useClass: DashboardService
        },
        {
          provide: DashboardQueryService,
          useValue: queryService,
        }
      ],
    }).compile();

    queryService = module.get<DashboardQueryService>(DashboardQueryService);
    dashboardService = module.get<DashboardService>(DashboardService);
  });

  it('should be defined', () => {
    expect(queryService).toBeDefined();
  });

  it('should return todays correct total', async () => {
    (queryService.getTotalForDay as jest.Mock).mockResolvedValueOnce(100).mockResolvedValueOnce(200);
    const todays = await dashboardService.getTodaysMetrics('id');
    expect(todays).toEqual({
      today: 100,
      yesterday: 200,
      percent: 10,
      trend: 'decrease'
    });
  });


});
