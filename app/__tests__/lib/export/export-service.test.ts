
import { ExportService, ExportConfig } from '@/lib/export/export-service';

// Mock dependencies
jest.mock('jspdf', () => {
  return jest.fn().mockImplementation(() => ({
    setProperties: jest.fn(),
    internal: {
      pageSize: {
        getWidth: () => 210,
        getHeight: () => 297,
      },
    },
    setFontSize: jest.fn(),
    text: jest.fn(),
    addImage: jest.fn(),
    output: jest.fn(() => new Blob(['mock-pdf'], { type: 'application/pdf' })),
  }));
});

jest.mock('html2canvas', () => {
  return jest.fn().mockResolvedValue({
    toDataURL: () => 'data:image/png;base64,mock-image-data',
    width: 800,
    height: 600,
    toBlob: (callback: (blob: Blob) => void) => {
      callback(new Blob(['mock-image'], { type: 'image/png' }));
    },
  });
});

jest.mock('xlsx', () => ({
  utils: {
    book_new: () => ({}),
    json_to_sheet: () => ({}),
    book_append_sheet: jest.fn(),
    sheet_to_csv: () => 'col1,col2\nvalue1,value2',
  },
  write: () => new ArrayBuffer(100),
}));

jest.mock('file-saver', () => ({
  saveAs: jest.fn(),
}));

describe('ExportService', () => {
  const mockElement = document.createElement('div');
  mockElement.style.width = '800px';
  mockElement.style.height = '600px';
  
  const mockData = [
    { name: 'Item 1', value: 100 },
    { name: 'Item 2', value: 200 },
  ];
  
  const defaultConfig: ExportConfig = {
    format: 'pdf',
    quality: 'medium',
    orientation: 'portrait',
    paperSize: 'a4',
    includeCharts: true,
    includeData: true,
    compression: true,
    metadata: {
      title: 'Test Export',
      author: 'Test Author',
      subject: 'Test Subject',
      creator: 'Test Creator',
      keywords: ['test'],
      createdAt: new Date(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('exportDashboardToPDF', () => {
    it('exports dashboard to PDF successfully', async () => {
      const result = await ExportService.exportDashboardToPDF(mockElement, defaultConfig);
      
      expect(result.success).toBe(true);
      expect(result.filename).toMatch(/\.pdf$/);
      expect(result.size).toBeGreaterThan(0);
    });

    it('handles PDF export errors', async () => {
      const html2canvas = require('html2canvas');
      html2canvas.mockRejectedValueOnce(new Error('Canvas error'));
      
      const result = await ExportService.exportDashboardToPDF(mockElement, defaultConfig);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Canvas error');
    });
  });

  describe('exportDataToExcel', () => {
    it('exports data to Excel successfully', async () => {
      const config = { ...defaultConfig, format: 'excel' as const };
      const result = await ExportService.exportDataToExcel(mockData, config);
      
      expect(result.success).toBe(true);
      expect(result.filename).toMatch(/\.xlsx$/);
    });

    it('exports multiple sheets to Excel', async () => {
      const config = { ...defaultConfig, format: 'excel' as const };
      const sheets = [
        { name: 'Sheet1', data: mockData },
        { name: 'Sheet2', data: mockData },
      ];
      
      const result = await ExportService.exportDataToExcel([], config, sheets);
      
      expect(result.success).toBe(true);
    });
  });

  describe('exportDataToCSV', () => {
    it('exports data to CSV successfully', async () => {
      const config = { ...defaultConfig, format: 'csv' as const };
      const result = await ExportService.exportDataToCSV(mockData, config);
      
      expect(result.success).toBe(true);
      expect(result.filename).toMatch(/\.csv$/);
    });
  });

  describe('exportElementToPNG', () => {
    it('exports element to PNG successfully', async () => {
      const config = { ...defaultConfig, format: 'png' as const };
      const result = await ExportService.exportElementToPNG(mockElement, config);
      
      expect(result.success).toBe(true);
      expect(result.filename).toMatch(/\.png$/);
    });
  });

  describe('exportConfigToJSON', () => {
    it('exports configuration to JSON successfully', async () => {
      const config = { ...defaultConfig, format: 'json' as const };
      const result = await ExportService.exportConfigToJSON(mockData, config);
      
      expect(result.success).toBe(true);
      expect(result.filename).toMatch(/\.json$/);
    });
  });

  describe('exportMultipleFormats', () => {
    it('exports to multiple formats successfully', async () => {
      const formats: ExportConfig['format'][] = ['pdf', 'excel', 'csv'];
      const results = await ExportService.exportMultipleFormats(
        mockElement,
        mockData,
        defaultConfig,
        formats
      );
      
      expect(results).toHaveLength(3);
      expect(results.every(r => r.success)).toBe(true);
    });
  });

  describe('estimateExportSize', () => {
    it('estimates PDF export size correctly', () => {
      const size = ExportService.estimateExportSize(mockElement, mockData, 'pdf', 'medium');
      expect(size).toBeGreaterThan(0);
    });

    it('estimates Excel export size correctly', () => {
      const size = ExportService.estimateExportSize(mockElement, mockData, 'excel', 'medium');
      expect(size).toBeGreaterThan(0);
    });

    it('estimates CSV export size correctly', () => {
      const size = ExportService.estimateExportSize(mockElement, mockData, 'csv', 'medium');
      expect(size).toBeGreaterThan(0);
    });

    it('returns 0 for unknown format', () => {
      const size = ExportService.estimateExportSize(mockElement, mockData, 'unknown' as any, 'medium');
      expect(size).toBe(0);
    });
  });

  describe('getFormatCapabilities', () => {
    it('returns format capabilities', () => {
      const capabilities = ExportService.getFormatCapabilities();
      
      expect(capabilities).toHaveProperty('pdf');
      expect(capabilities).toHaveProperty('excel');
      expect(capabilities).toHaveProperty('csv');
      expect(capabilities).toHaveProperty('png');
      expect(capabilities).toHaveProperty('json');
      
      expect(capabilities.pdf.supports).toContain('visual');
      expect(capabilities.excel.supports).toContain('data');
    });
  });
});
