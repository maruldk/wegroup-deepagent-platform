
import { GET, POST } from '@/app/api/analytics/dashboards/route';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/lib/db', () => ({
  prisma: {
    dashboard: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  },
}));

jest.mock('@/lib/auth', () => ({
  authOptions: {},
}));

const { getServerSession } = require('next-auth');
const { prisma } = require('@/lib/db');

describe('/api/analytics/dashboards', () => {
  const mockSession = {
    user: {
      id: 'user-1',
      tenantId: 'tenant-1',
      email: 'test@example.com',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    getServerSession.mockResolvedValue(mockSession);
  });

  describe('GET /api/analytics/dashboards', () => {
    it('returns dashboards for authenticated user', async () => {
      const mockDashboards = [
        {
          id: 'dashboard-1',
          name: 'Test Dashboard',
          description: 'Test Description',
          tenantId: 'tenant-1',
          userId: 'user-1',
          widgets: [],
        },
      ];

      prisma.dashboard.findMany.mockResolvedValue(mockDashboards);
      prisma.dashboard.count.mockResolvedValue(1);

      const request = new NextRequest('http://localhost:3000/api/analytics/dashboards');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.dashboards).toEqual(mockDashboards);
      expect(data.pagination).toEqual({
        total: 1,
        page: 1,
        limit: 10,
        pages: 1,
      });
    });

    it('returns 401 for unauthenticated user', async () => {
      getServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/analytics/dashboards');
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it('handles pagination parameters', async () => {
      prisma.dashboard.findMany.mockResolvedValue([]);
      prisma.dashboard.count.mockResolvedValue(0);

      const request = new NextRequest('http://localhost:3000/api/analytics/dashboards?page=2&limit=5');
      const response = await GET(request);
      const data = await response.json();

      expect(prisma.dashboard.findMany).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1' },
        orderBy: { createdAt: 'desc' },
        skip: 5, // (page 2 - 1) * limit 5
        take: 5,
        include: {
          user: { select: { name: true, email: true } },
          widgets: { orderBy: { createdAt: 'asc' } },
        },
      });

      expect(data.pagination).toEqual({
        total: 0,
        page: 2,
        limit: 5,
        pages: 0,
      });
    });

    it('handles database errors', async () => {
      prisma.dashboard.findMany.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/analytics/dashboards');
      const response = await GET(request);

      expect(response.status).toBe(500);
    });
  });

  describe('POST /api/analytics/dashboards', () => {
    it('creates new dashboard successfully', async () => {
      const mockDashboard = {
        id: 'dashboard-1',
        name: 'New Dashboard',
        description: 'New Description',
        layout: null,
        isDefault: false,
        tenantId: 'tenant-1',
        userId: 'user-1',
        user: { name: 'Test User', email: 'test@example.com' },
        widgets: [],
      };

      prisma.dashboard.create.mockResolvedValue(mockDashboard);
      prisma.auditLog.create.mockResolvedValue({});

      const requestBody = {
        name: 'New Dashboard',
        description: 'New Description',
        layout: null,
        isDefault: false,
      };

      const request = new NextRequest('http://localhost:3000/api/analytics/dashboards', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toEqual(mockDashboard);
      expect(prisma.dashboard.create).toHaveBeenCalledWith({
        data: {
          name: 'New Dashboard',
          description: 'New Description',
          layout: null,
          isDefault: false,
          tenantId: 'tenant-1',
          userId: 'user-1',
        },
        include: {
          user: { select: { name: true, email: true } },
          widgets: true,
        },
      });
      expect(prisma.auditLog.create).toHaveBeenCalled();
    });

    it('returns 400 for missing dashboard name', async () => {
      const requestBody = {
        description: 'Dashboard without name',
      };

      const request = new NextRequest('http://localhost:3000/api/analytics/dashboards', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('returns 401 for unauthenticated user', async () => {
      getServerSession.mockResolvedValue(null);

      const requestBody = {
        name: 'Test Dashboard',
      };

      const request = new NextRequest('http://localhost:3000/api/analytics/dashboards', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);

      expect(response.status).toBe(401);
    });

    it('handles database errors during creation', async () => {
      prisma.dashboard.create.mockRejectedValue(new Error('Database error'));

      const requestBody = {
        name: 'Test Dashboard',
      };

      const request = new NextRequest('http://localhost:3000/api/analytics/dashboards', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);

      expect(response.status).toBe(500);
    });
  });
});
