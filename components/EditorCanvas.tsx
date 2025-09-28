/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef, useEffect, useCallback } from 'react';

interface Point {
  x: number;
  y: number;
}

interface Crop extends Point {
  width: number;
  height: number;
}

interface EditorCanvasProps {
  imageUrl: string | null;
  isCropping: boolean;
  isSelectingRegion?: boolean;
  onCropComplete: (croppedImageUrl: string) => void;
  onCroppingChange: (isCropping: boolean) => void;
  cropAspect: number | undefined;
  cropTrigger?: number;
  polygonPoints?: Point[];
  isPolygonClosed?: boolean;
  onPointAdd?: (point: Point) => void;
}


const EditorCanvas: React.FC<EditorCanvasProps> = ({
  imageUrl,
  isCropping,
  isSelectingRegion = false,
  onCropComplete,
  onCroppingChange,
  cropAspect,
  cropTrigger = 0,
  polygonPoints = [],
  isPolygonClosed = false,
  onPointAdd,
}) => {
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [crop, setCrop] = useState<Crop | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Point | null>(null);

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isCropping) return;
    const { x, y } = getCanvasCoordinates(e);
    setIsDragging(true);
    setDragStart({ x, y });
    setCrop({ x, y, width: 0, height: 0 });
    onCroppingChange(true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isCropping || !isDragging || !dragStart) return;
    const { x, y } = getCanvasCoordinates(e);
    let width = x - dragStart.x;
    let height = y - dragStart.y;
    
    if (cropAspect) {
        if (Math.abs(width) > Math.abs(height * cropAspect)) {
            height = width / cropAspect;
        } else {
            width = height * cropAspect;
        }
    }

    setCrop({
      x: dragStart.x,
      y: dragStart.y,
      width: width,
      height: height,
    });
  };

  const handleMouseUp = () => {
    if (isCropping) {
        setIsDragging(false);
        setDragStart(null);
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isSelectingRegion || !onPointAdd || !imageRef.current || !canvasRef.current) return;
    
    const { x, y } = getCanvasCoordinates(e);
    const image = imageRef.current;
    const canvas = canvasRef.current;

    const scaleX = image.naturalWidth / canvas.width;
    const scaleY = image.naturalHeight / canvas.height;

    onPointAdd({
        x: Math.round(x * scaleX),
        y: Math.round(y * scaleY),
    });
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const image = imageRef.current;
    if (!canvas || !ctx || !image) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    if (isCropping && crop) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const finalRect = {
          x: crop.width > 0 ? crop.x : crop.x + crop.width,
          y: crop.height > 0 ? crop.y : crop.y + crop.height,
          width: Math.abs(crop.width),
          height: Math.abs(crop.height),
      }

      ctx.clearRect(finalRect.x, finalRect.y, finalRect.width, finalRect.height);
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.strokeRect(finalRect.x, finalRect.y, finalRect.width, finalRect.height);
    } else if (isSelectingRegion && polygonPoints.length > 0) {
        const scaleX = canvas.width / image.naturalWidth;
        const scaleY = canvas.height / image.naturalHeight;

        ctx.strokeStyle = '#3b82f6'; // blue-500
        ctx.fillStyle = '#3b82f6';
        ctx.lineWidth = 2;
        
        // Draw lines
        ctx.beginPath();
        ctx.setLineDash([5, 5]);
        const firstPoint = polygonPoints[0];
        ctx.moveTo(firstPoint.x * scaleX, firstPoint.y * scaleY);
        for (let i = 1; i < polygonPoints.length; i++) {
            const point = polygonPoints[i];
            ctx.lineTo(point.x * scaleX, point.y * scaleY);
        }
        if (isPolygonClosed) {
            ctx.lineTo(firstPoint.x * scaleX, firstPoint.y * scaleY);
            ctx.fillStyle = 'rgba(59, 130, 246, 0.2)'; // blue-500 with alpha
            ctx.fill();
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw points
        polygonPoints.forEach(point => {
            ctx.beginPath();
            ctx.arc(point.x * scaleX, point.y * scaleY, 5, 0, 2 * Math.PI);
            ctx.fillStyle = 'white';
            ctx.fill();
            ctx.stroke();
        });
    }
  }, [crop, isCropping, isSelectingRegion, polygonPoints, isPolygonClosed]);


  useEffect(() => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const maxWidth = 896;
        const scale = Math.min(1, maxWidth / image.width);
        canvas.width = image.width * scale;
        canvas.height = image.height * scale;
        imageRef.current = image;
        draw();
      }
    };
    if (imageUrl) {
      image.src = imageUrl;
    }
    
    if (!isCropping) {
        setCrop(null);
        onCroppingChange(false);
    }

  }, [imageUrl, isCropping, draw, onCroppingChange]);

  useEffect(() => {
    draw();
  }, [draw]);

  useEffect(() => {
    if (cropTrigger > 0 && crop && canvasRef.current && imageRef.current) {
      const canvas = canvasRef.current;
      const image = imageRef.current;
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) return;

      const scaleX = image.naturalWidth / canvas.width;
      const scaleY = image.naturalHeight / canvas.height;

      const finalCrop = {
          x: crop.width > 0 ? crop.x : crop.x + crop.width,
          y: crop.height > 0 ? crop.y : crop.y + crop.height,
          width: Math.abs(crop.width),
          height: Math.abs(crop.height),
      }

      tempCanvas.width = finalCrop.width * scaleX;
      tempCanvas.height = finalCrop.height * scaleY;

      tempCtx.drawImage(
        image,
        finalCrop.x * scaleX,
        finalCrop.y * scaleY,
        finalCrop.width * scaleX,
        finalCrop.height * scaleY,
        0,
        0,
        tempCanvas.width,
        tempCanvas.height
      );

      onCropComplete(tempCanvas.toDataURL());
    }
  }, [cropTrigger, crop, onCropComplete]);


  return (
    <div
      className="relative max-w-full max-h-[80vh] flex items-center justify-center touch-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleClick}
    >
      <canvas ref={canvasRef} className="rounded-lg shadow-2xl shadow-black/50" />
    </div>
  );
};

export default EditorCanvas;
