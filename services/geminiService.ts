/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI, Modality } from "@google/genai";

const ai = new GoogleGenAI({apiKey: process.env.API_KEY!});

type Point = { x: number; y: number };

const dataUrlToGeminiPart = (dataUrl: string) => {
  const [header, base64Data] = dataUrl.split(',');
  const mimeType = header.match(/:(.*?);/)?.[1] ?? '';
  return {
    inlineData: {
      data: base64Data,
      mimeType,
    },
  };
};

/**
 * Edits an image using a text prompt and an optional polygonal region with Gemini.
 * @param imageDataUrl The data URL of the image to edit.
 * @param prompt The text prompt for editing.
 * @param polygonPoints Optional array of points defining the region to edit.
 * @param referenceImageUrl Optional data URL for a reference image.
 * @returns The edited image as a data URL.
 */
// FIX: Updated function signature to accept `referenceImageUrl` to resolve the argument count error in App.tsx.
export async function editImageWithGemini(
  imageDataUrl: string,
  prompt: string,
  polygonPoints?: Point[],
  referenceImageUrl?: string | null
): Promise<string> {
  try {
    const model = 'gemini-2.5-flash-image-preview';

    const imagePart = dataUrlToGeminiPart(imageDataUrl);
    // FIX: Explicitly type `parts` as `any[]` to allow different part types (image and text).
    // TypeScript was inferring the array's type from only the first element (imagePart),
    // causing a type error when pushing a text part.
    const parts: any[] = [imagePart];

    let fullPrompt = `You are an expert architect and landscape designer. Realistically apply the following user request to the image: "${prompt}".`;
    
    if (referenceImageUrl) {
      const referenceImagePart = dataUrlToGeminiPart(referenceImageUrl);
      parts.push(referenceImagePart);
      fullPrompt += ` Use the second image as a style reference for the change.`;
    }

    if (polygonPoints && polygonPoints.length > 0) {
      const pointsString = polygonPoints.map(p => `(${p.x}, ${p.y})`).join(', ');
      fullPrompt += ` IMPORTANT: Apply this change *ONLY* within the polygon defined by the following vertices: [${pointsString}]. The rest of the image must remain completely untouched. Do not blend, feather, or alter any pixels outside this precise polygon.`;
    }

    const textPart = {
      text: fullPrompt,
    };
    parts.push(textPart);
    
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: parts,
      },
      config: {
          responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const base64ImageBytes: string = part.inlineData.data;
        const mimeType = part.inlineData.mimeType;
        return `data:${mimeType};base64,${base64ImageBytes}`;
      }
    }

    throw new Error('Модель не сгенерировала изображение.');

  } catch (error) {
    console.error("Error editing image with Gemini:", error);
    throw new Error("Не удалось отредактировать изображение с помощью ИИ. Пожалуйста, попробуйте еще раз.");
  }
}
