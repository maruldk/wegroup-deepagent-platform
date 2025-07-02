
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface ColorPickerProps {
  value?: string;
  onChange?: (color: string) => void;
  className?: string;
}

const predefinedColors = [
  '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
  '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080',
  '#008000', '#800000', '#000080', '#808080', '#C0C0C0'
];

export function ColorPicker({ value = '#000000', onChange, className }: ColorPickerProps) {
  const [color, setColor] = React.useState(value);

  const handleColorChange = (newColor: string) => {
    setColor(newColor);
    onChange?.(newColor);
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-12 h-8 p-0 border"
            style={{ backgroundColor: color }}
          >
            <span className="sr-only">Pick color</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64">
          <div className="space-y-3">
            <Input
              type="color"
              value={color}
              onChange={(e) => handleColorChange(e.target.value)}
              className="w-full h-8"
            />
            <div className="grid grid-cols-5 gap-2">
              {predefinedColors.map((presetColor) => (
                <Button
                  key={presetColor}
                  className="w-8 h-8 p-0"
                  style={{ backgroundColor: presetColor }}
                  onClick={() => handleColorChange(presetColor)}
                  variant="outline"
                />
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>
      <Input
        type="text"
        value={color}
        onChange={(e) => handleColorChange(e.target.value)}
        className="font-mono text-sm"
        placeholder="#000000"
      />
    </div>
  );
}

export default ColorPicker;
