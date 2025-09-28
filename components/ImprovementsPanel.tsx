/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
// FIX: PaperclipIcon was not exported from icons.tsx. It has been added.
import { PaperclipIcon } from './icons';

interface ImprovementsPanelProps {
  onApplyImprovement: (prompt: string, referenceImageUrl?: string | null) => void;
  isLoading: boolean;
  isRegionSelected: boolean;
}

const ImprovementsPanel: React.FC<ImprovementsPanelProps> = ({ onApplyImprovement, isLoading, isRegionSelected }) => {
  const [prompt, setPrompt] = useState('');
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [referenceImageName, setReferenceImageName] = useState<string | null>(null);

  const handleReferenceImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setReferenceImageName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        setReferenceImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeReferenceImage = () => {
    setReferenceImage(null);
    setReferenceImageName(null);
    const input = document.getElementById('reference-image-upload') as HTMLInputElement;
    if (input) {
      input.value = '';
    }
  };
  
  const handleApply = () => {
    if (prompt) {
      onApplyImprovement(prompt, referenceImage);
    }
  };

  return (
    <div className="w-full bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex flex-col gap-4 animate-fade-in backdrop-blur-sm">
      <h3 className="text-lg font-semibold text-center text-gray-300">Ваше улучшение</h3>
      
      {!isRegionSelected && <p className="text-center text-sm text-yellow-400">Пожалуйста, замкните контур на изображении, чтобы применить улучшение.</p>}

      <div className="relative">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={isLoading || !isRegionSelected}
          placeholder="Например: 'добавь клумбу с красными цветами' или 'сделай фасад из красного кирпича'"
          className="w-full bg-white/5 border border-gray-600 rounded-lg p-3 pr-12 text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all resize-none"
          rows={3}
        />
      </div>

      <div className="flex items-center justify-between gap-4">
        <label htmlFor="reference-image-upload" className={`flex items-center gap-2 text-sm font-medium ${isRegionSelected ? 'text-blue-400 hover:text-blue-300 cursor-pointer' : 'text-gray-500 cursor-not-allowed'}`}>
          <PaperclipIcon className="w-5 h-5" />
          <span>Прикрепить референс (опционально)</span>
          <input id="reference-image-upload" type="file" className="hidden" accept="image/*" onChange={handleReferenceImageChange} disabled={!isRegionSelected} />
        </label>

        {referenceImage && (
          <div className="flex items-center gap-2 text-sm bg-gray-700 py-1 px-2 rounded-md">
            <span className="truncate max-w-[150px]">{referenceImageName}</span>
            <button onClick={removeReferenceImage} className="text-gray-400 hover:text-white text-lg leading-none">&times;</button>
          </div>
        )}
      </div>

      <button
        onClick={handleApply}
        disabled={isLoading || !prompt || !isRegionSelected}
        className="w-full mt-2 bg-gradient-to-br from-blue-600 to-blue-500 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:from-blue-800 disabled:to-blue-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none"
      >
        Применить
      </button>
    </div>
  );
};

// FIX: Added default export to resolve module import error in App.tsx.
export default ImprovementsPanel;
