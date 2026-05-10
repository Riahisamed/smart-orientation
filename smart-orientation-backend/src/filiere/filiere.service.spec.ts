import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { FiliereService } from './filiere.service';

describe('FiliereService', () => {
  let service: FiliereService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FiliereService, { provide: PrismaService, useValue: {} }],
    }).compile();

    service = module.get<FiliereService>(FiliereService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
