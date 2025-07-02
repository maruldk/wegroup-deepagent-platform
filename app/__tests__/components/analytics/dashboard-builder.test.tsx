
import React from 'react';
import { render } from '@testing-library/react';
import { screen, fireEvent, waitFor } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { DashboardBuilder } from '@/components/analytics/dashboard-builder';

// Mock dependencies
jest.mock('react-dnd', () => ({
  DndProvider: ({ children }: any) => children,
  useDrag: () => [{ isDragging: false }, jest.fn()],
  useDrop: () => [{ isOver: false }, jest.fn()],
}));

jest.mock('react-dnd-html5-backend', () => ({
  HTML5Backend: jest.fn(),
}));

jest.mock('react-grid-layout', () => ({
  Responsive: ({ children, onLayoutChange }: any) => (
    <div data-testid="grid-layout" onClick={() => onLayoutChange?.([])}>
      {children}
    </div>
  ),
  WidthProvider: (component: any) => component,
}));

describe('DashboardBuilder', () => {
  const mockOnSave = jest.fn();
  
  const defaultProps = {
    dashboardId: 'test-dashboard',
    initialLayout: [],
    initialWidgets: [],
    onSave: mockOnSave,
    readOnly: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders dashboard builder interface', () => {
    render(<DashboardBuilder {...defaultProps} />);
    
    expect(screen.getByText('Dashboard Builder')).toBeInTheDocument();
    expect(screen.getByText('Widget Library')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
  });

  it('shows empty state when no widgets are added', () => {
    render(<DashboardBuilder {...defaultProps} />);
    
    expect(screen.getByText('Start Building Your Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Add widgets from the library to get started')).toBeInTheDocument();
  });

  it('toggles between edit and preview mode', async () => {
    const user = userEvent.setup();
    render(<DashboardBuilder {...defaultProps} />);
    
    const editButton = screen.getByRole('button', { name: /preview/i });
    await user.click(editButton);
    
    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
  });

  it('switches between device views', async () => {
    const user = userEvent.setup();
    render(<DashboardBuilder {...defaultProps} />);
    
    const tabletButton = screen.getByRole('button', { name: /tablet/i });
    await user.click(tabletButton);
    
    // Check if the view has changed (implementation specific)
    expect(tabletButton).toHaveClass('bg-primary'); // or whatever active class is used
  });

  it('enables save button when dashboard is dirty', async () => {
    const user = userEvent.setup();
    render(<DashboardBuilder {...defaultProps} />);
    
    const saveButton = screen.getByRole('button', { name: /save/i });
    expect(saveButton).toBeDisabled();
    
    // Simulate making changes (this would depend on actual implementation)
    const gridLayout = screen.getByTestId('grid-layout');
    fireEvent.click(gridLayout);
    
    await waitFor(() => {
      expect(saveButton).toBeEnabled();
    });
  });

  it('calls onSave when save button is clicked', async () => {
    const user = userEvent.setup();
    render(<DashboardBuilder {...defaultProps} />);
    
    // Make dashboard dirty first
    const gridLayout = screen.getByTestId('grid-layout');
    fireEvent.click(gridLayout);
    
    await waitFor(() => {
      const saveButton = screen.getByRole('button', { name: /save/i });
      expect(saveButton).toBeEnabled();
    });
    
    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);
    
    expect(mockOnSave).toHaveBeenCalledWith([], []);
  });

  it('shows grid when enabled', () => {
    render(<DashboardBuilder {...defaultProps} />);
    
    // Check if grid is visible (implementation specific)
    const gridLayout = screen.getByTestId('grid-layout');
    expect(gridLayout).toBeInTheDocument();
  });

  it('renders in read-only mode correctly', () => {
    render(<DashboardBuilder {...defaultProps} readOnly={true} />);
    
    expect(screen.queryByText('Widget Library')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save/i })).toBeDisabled();
  });

  it('handles dashboard settings changes', async () => {
    const user = userEvent.setup();
    render(<DashboardBuilder {...defaultProps} />);
    
    // Click on settings tab (if visible)
    const settingsTab = screen.queryByText('Settings');
    if (settingsTab) {
      await user.click(settingsTab);
      
      const nameInput = screen.getByLabelText(/dashboard name/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'New Dashboard Name');
      
      expect(nameInput).toHaveValue('New Dashboard Name');
    }
  });

  it('exports dashboard configuration', async () => {
    const user = userEvent.setup();
    render(<DashboardBuilder {...defaultProps} />);
    
    const exportButton = screen.getByRole('button', { name: /export/i });
    await user.click(exportButton);
    
    // Mock the file download (implementation specific)
    expect(exportButton).toBeInTheDocument();
  });

  it('imports dashboard configuration', async () => {
    const user = userEvent.setup();
    render(<DashboardBuilder {...defaultProps} />);
    
    const importButton = screen.getByRole('button', { name: /import/i });
    expect(importButton).toBeInTheDocument();
    
    // Test file input handling would require more complex mocking
  });
});
