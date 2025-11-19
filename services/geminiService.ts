
import { GoogleGenAI, Modality } from "@google/genai";
import { CharacterConfig } from "../types";
import { 
  STYLE_PROMPT,
  SKIN_TONES,
  HAIR_STYLES,
  HAIR_COLORS,
  CLOTHING_COLORS,
  CLOTHING_ITEMS,
  ACCESSORIES,
  EYE_COLORS
} from "../constants";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Virtual Asset System ---
// Simulates a file system storage for the user's workflow request
class VirtualAssetManager {
  private assets = new Map<string, string>();

  save(path: string, dataUrl: string) {
    console.log(`[AssetManager] Saving file to: ${path}`);
    this.assets.set(path, dataUrl);
  }

  get(path: string): string | undefined {
    return this.assets.get(path);
  }
}

export const assetManager = new VirtualAssetManager();

// --- Helper Functions ---

const getPrompt = (id: string, list: any[]) => list.find(i => i.id === id)?.promptValue || '';

// --- Main Pipeline ---

export const generateCharacterPipeline = async (
  config: CharacterConfig, 
  onStatusUpdate: (status: string) => void
): Promise<string> => {
  
  const timestamp = Date.now();
  const rawFilename = `assets/raw/${timestamp}_render.png`;
  const finalFilename = `assets/nobg/${timestamp}_character.png`;

  try {
    // Step 1: Generate Raw Asset (White Background)
    onStatusUpdate("Sculpting 3D Model...");
    
    const expressionPrompt = Math.random() > 0.5 
      ? 'a happy smiling expression' 
      : 'a confident smirk';

    const subjectPrompt = `
      A cute 3D vinyl toy character.
      View: Direct front view. Facing camera.
      Gender: ${config.gender}.
      Skin: ${getPrompt(config.skinToneId, SKIN_TONES)}.
      Eyes: Large circular ${getPrompt(config.eyeColorId, EYE_COLORS)} eyes.
      Hair: ${getPrompt(config.hairStyleId, HAIR_STYLES)}, colored ${getPrompt(config.hairColorId, HAIR_COLORS)}.
      Clothing: Wearing ${getPrompt(config.clothingColorId, CLOTHING_COLORS)} ${getPrompt(config.clothingId, CLOTHING_ITEMS)}.
      Expression: ${expressionPrompt}.
      ${config.accessoryId !== 'none' ? `Accessories: ${getPrompt(config.accessoryId, ACCESSORIES)}.` : ''}
    `;

    const fullPrompt = `${STYLE_PROMPT} ${subjectPrompt}`;
    console.log("Generating raw asset with prompt:", fullPrompt);

    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: fullPrompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/png', 
        aspectRatio: '1:1',
      },
    });

    if (!response.generatedImages || response.generatedImages.length === 0) {
      throw new Error("No image generated");
    }

    const rawBase64 = response.generatedImages[0].image.imageBytes;
    const rawDataUrl = `data:image/png;base64,${rawBase64}`;
    
    // Store Raw Asset
    assetManager.save(rawFilename, rawDataUrl);


    // Step 2: AI Extraction
    onStatusUpdate("Removing Background...");
    
    // We use Gemini 2.5 Flash Image to segment the character from the white background
    const cleanupResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/png',
              data: rawBase64
            }
          },
          {
            text: "Precisely segment the character from the white background. Return the character on a transparent alpha layer. Do not crop."
          }
        ]
      },
      config: {
        responseModalities: [Modality.IMAGE],
      }
    });

    let processedDataUrl = rawDataUrl; // Default to raw if AI fails
    const processedPart = cleanupResponse.candidates?.[0]?.content?.parts?.[0];
    
    if (processedPart && processedPart.inlineData && processedPart.inlineData.data) {
       processedDataUrl = `data:image/png;base64,${processedPart.inlineData.data}`;
    } else {
      console.warn("AI background removal returned no image data, falling back to raw.");
    }

    // Step 3: Failsafe Verification (Flood Fill)
    // If AI failed and returned a white background, we use a flood fill from corners to remove it.
    // This is better than color replacement because it preserves internal whites (eyes, shirts).
    onStatusUpdate("Finalizing Assets...");
    const finalDataUrl = await failsafeKeyer(processedDataUrl);

    // Store Final Asset
    assetManager.save(finalFilename, finalDataUrl);

    return finalDataUrl;

  } catch (error) {
    console.error("Pipeline Error:", error);
    throw error;
  }
};

// --- Failsafe Keyer (Flood Fill) ---
// Checks corners for solid background. If found, flood fills transparency from outside in.
async function failsafeKeyer(dataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const width = canvas.width;
      const height = canvas.height;
      
      // Check top-left pixel
      const bgR = data[0];
      const bgG = data[1];
      const bgB = data[2];
      const bgA = data[3];

      // If already transparent, we are good!
      if (bgA < 50) {
        resolve(dataUrl);
        return;
      }

      // Check if it is a light background (indicating AI failure to remove white)
      // If it's dark, maybe it's part of the hair/art, so we skip.
      if (bgR < 200 || bgG < 200 || bgB < 200) {
        // Not a white background, so the AI probably generated a full frame art or something else.
        // We leave it alone to avoid destroying the image.
        resolve(dataUrl);
        return;
      }

      console.log("Failsafe triggered: Solid white background detected. Initiating Flood Fill.");

      // Flood Fill Algorithm
      // We use a stack to traverse pixels starting from (0,0)
      const tolerance = 30;
      const stack = [[0, 0], [width-1, 0], [0, height-1], [width-1, height-1]]; // Start from all corners
      const visited = new Set<string>();

      while (stack.length > 0) {
        const [x, y] = stack.pop()!;
        const key = `${x},${y}`;
        
        if (visited.has(key)) continue;
        if (x < 0 || x >= width || y < 0 || y >= height) continue;
        
        visited.add(key);

        const idx = (y * width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];

        // Check if pixel matches background color within tolerance
        const dist = Math.sqrt(Math.pow(r - bgR, 2) + Math.pow(g - bgG, 2) + Math.pow(b - bgB, 2));

        if (dist < tolerance) {
          // Set to transparent
          data[idx + 3] = 0;

          // Add neighbors
          stack.push([x + 1, y]);
          stack.push([x - 1, y]);
          stack.push([x, y + 1]);
          stack.push([x, y - 1]);
        }
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}
