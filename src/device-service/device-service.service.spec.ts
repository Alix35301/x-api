import { Test, TestingModule } from '@nestjs/testing';
import { DeviceServiceService } from './device-service.service';

describe('DeviceServiceService', () => {
  let service: DeviceServiceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DeviceServiceService],
    }).compile();

    service = module.get<DeviceServiceService>(DeviceServiceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
