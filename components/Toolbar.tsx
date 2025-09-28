/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { Tool } from '../types';
import { SparklesIcon, CropIcon, ResetIcon } from './icons';

interface ToolbarProps {
  activeTool: Tool | null;
  onToolSelect: (tool: Tool) => void;
  onReset: () => void;
  isImageLoaded: boolean;
}

const tools: { id: Tool; name: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'improvements', name: 'Улучшения', icon: SparklesIcon },
  { id: 'crop', name: 'Обрезать', icon: CropIcon },
];

const Toolbar: React.FC<ToolbarProps> = ({ activeTool, onToolSelect, onReset, isImageLoaded }) => {
  if (!isImageLoaded) return null;

  return (
    <div className="w-full max-w-md bg-gray-800/50 border border-gray-700 rounded-full p-2 flex items-center justify-center gap-2 animate-fade-in backdrop-blur-sm">
      {tools.map(tool => (
        <button
          key={tool.id}
          onClick={() => onToolSelect(tool.id)}
          className={`flex-1 flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 active:scale-95 disabled:opacity-50 ${
            activeTool === tool.id
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'bg-transparent hover:bg-white/10 text-gray-300 hover:text-white'
          }`}
          title={tool.name}
        >
          <tool.icon className="w-6 h-6" />
          <span>{tool.name}</span>
        </button>
      ))}
       <div className="h-10 border-l border-gray-600 mx-2"></div>
      <button
        onClick={onReset}
        className="flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 active:scale-95 bg-transparent hover:bg-white/10 text-gray-300 hover:text-white"
        title="Сбросить изменения"
      >
        <ResetIcon className="w-6 h-6" />
        <span>Сброс</span>
      </button>
    </div>
  );
};

export default Toolbar;
