/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useCallback } from 'react';
import Header from './components/Header';
import StartScreen from './components/StartScreen';
import EditorCanvas from './components/EditorCanvas';
import Toolbar from './components/Toolbar';
import ImprovementsPanel from './components/ImprovementsPanel';
import CropPanel from './components/CropPanel';
import { editImageWithGemini } from './services/geminiService';
import { Tool } from './types';
import Spinner from './components/Spinner';
import { CheckIcon, TrashIcon } from './components/icons';

type Point = { x: number; y: number; };

const App: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<Tool | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isCropping, setIsCropping] = useState<boolean>(false);
  const [cropAspect, setCropAspect] = useState<number | undefined>(undefined);
  const [cropTrigger, setCropTrigger] = useState(0);
  const [polygonPoints, setPolygonPoints] = useState<Point[]>([]);
  const [isPolygonClosed, setIsPolygonClosed] = useState<boolean>(false);

  const handleFileSelect = (files: FileList | null) => {
    if (files && files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageDataUrl = e.target?.result as string;
        setOriginalImage(imageDataUrl);
        setCurrentImage(imageDataUrl);
        setActiveTool('improvements');
      };
      reader.readAsDataURL(files[0]);
    }
  };
  
  const resetPolygon = () => {
    setPolygonPoints([]);
    setIsPolygonClosed(false);
  };

  const handleApplyImprovement = useCallback(async (prompt: string, referenceImageUrl?: string | null) => {
    if (!currentImage) return;

    if (activeTool === 'improvements' && !isPolygonClosed) {
        setError('Пожалуйста, выделите область и замкните контур.');
        return;
    }

    setIsLoading(true);
    setError(null);
    try {
      // FIX: The function call to `editImageWithGemini` was passing a `referenceImageUrl` which was not in the function signature. The signature in `geminiService.ts` has been updated.
      const editedImage = await editImageWithGemini(currentImage, prompt, polygonPoints, referenceImageUrl);
      setCurrentImage(editedImage);
      resetPolygon();
    } catch (e: any) {
      setError(e.message || 'Произошла неизвестная ошибка.');
    } finally {
      setIsLoading(false);
    }
  }, [currentImage, polygonPoints, isPolygonClosed, activeTool]);

  const handleApplyCrop = (croppedImageUrl: string) => {
      setCurrentImage(croppedImageUrl);
      setActiveTool(null);
  };
  
  const handleReset = () => {
    setCurrentImage(originalImage);
    setActiveTool(null);
    resetPolygon();
    setError(null);
  };

  const handleToolSelect = (tool: Tool) => {
    resetPolygon();
    if (activeTool === tool) {
      setActiveTool(null);
    } else {
      setActiveTool(tool);
    }
  };
  
  const handleAddPoint = (point: Point) => {
    if (!isPolygonClosed) {
      setPolygonPoints([...polygonPoints, point]);
    }
  };

  const handleClosePolygon = () => {
    if (polygonPoints.length > 2) {
      setIsPolygonClosed(true);
    } else {
      setError("Для замыкания контура нужно как минимум 3 точки.");
    }
  };

  const renderToolPanel = () => {
    switch (activeTool) {
      case 'improvements':
        return <ImprovementsPanel onApplyImprovement={handleApplyImprovement} isLoading={isLoading} isRegionSelected={isPolygonClosed} />;
      case 'crop':
        return <CropPanel 
          onApplyCrop={() => setCropTrigger(t => t + 1)}
          onSetAspect={setCropAspect} 
          isLoading={isLoading} 
          isCropping={isCropping}
        />;
      default:
        return null;
    }
  }

  return (
    <div className="bg-gray-900 text-white min-h-screen flex flex-col items-center antialiased font-sans">
      <Header />
      <main className="w-full flex-grow flex flex-col items-center justify-center p-4 md:p-8">
        {!currentImage ? (
          <StartScreen onFileSelect={handleFileSelect} />
        ) : (
          <div className="w-full max-w-7xl mx-auto flex flex-col items-center gap-6 animate-fade-in">
            {error && (
              <div className="bg-red-500/20 border border-red-500 text-red-300 p-3 rounded-lg w-full text-center">
                <strong>Ошибка:</strong> {error}
              </div>
            )}
            <div className="relative w-full flex justify-center items-center">
                {isLoading && (
                    <div className="absolute inset-0 bg-black/70 flex flex-col justify-center items-center z-20 rounded-lg backdrop-blur-sm">
                        <Spinner />
                        <p className="text-lg mt-4 font-semibold text-gray-300">ИИ творит магию...</p>
                    </div>
                )}
                <EditorCanvas 
                    imageUrl={currentImage} 
                    isCropping={activeTool === 'crop'}
                    isSelectingRegion={activeTool === 'improvements'}
                    onCropComplete={handleApplyCrop}
                    onCroppingChange={setIsCropping}
                    cropAspect={cropAspect}
                    cropTrigger={cropTrigger}
                    polygonPoints={polygonPoints}
                    isPolygonClosed={isPolygonClosed}
                    onPointAdd={handleAddPoint}
                />
            </div>

            <div className="w-full flex flex-col items-center gap-4">
               {activeTool === 'improvements' && (
                <div className="w-full max-w-md bg-gray-800/50 border border-gray-700 rounded-lg p-3 flex flex-col items-center gap-3 animate-fade-in backdrop-blur-sm">
                  <p className="text-sm text-gray-400">
                    {isPolygonClosed ? 'Область выделена. Теперь опишите ваше изменение.' : 'Нажмите на изображение, чтобы расставить точки и выделить область.'}
                  </p>
                  {!isPolygonClosed && (
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={handleClosePolygon}
                        disabled={isLoading || polygonPoints.length < 3}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-semibold py-2 px-4 rounded-md transition-all duration-200 active:scale-95 disabled:bg-gray-600 disabled:cursor-not-allowed"
                      >
                        <CheckIcon className="w-5 h-5" />
                        Замкнуть контур
                      </button>
                      <button
                        onClick={resetPolygon}
                        disabled={isLoading || polygonPoints.length === 0}
                        className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-semibold py-2 px-4 rounded-md transition-all duration-200 active:scale-95 disabled:bg-gray-600 disabled:cursor-not-allowed"
                      >
                        <TrashIcon className="w-5 h-5" />
                        Очистить
                      </button>
                    </div>
                  )}
                </div>
              )}
              <Toolbar 
                activeTool={activeTool} 
                onToolSelect={handleToolSelect} 
                onReset={handleReset}
                isImageLoaded={!!currentImage}
              />
              <div className="w-full max-w-3xl">
                {renderToolPanel()}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;