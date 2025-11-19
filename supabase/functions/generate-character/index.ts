
import { GoogleGenAI, Modality } from "npm:@google/genai@^1.30.0";

// Fix: Declare Deno global to resolve "Cannot find name 'Deno'" TypeScript error
declare const Deno: any;

// CORS Headers for browser access
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// --- Constants & Asset Registries (Ported from Client) ---

const STYLE_PROMPT = `
Render a high-end collectible vinyl toy figure. Direct front view. Facing the camera straight on. Symmetrical upper body portrait.
Material: Soft matte vinyl with a smooth clay-like finish. NOT glossy, NOT shiny plastic.
Lighting: Soft studio lighting, warm and diffuse.
Background: Solid bright white background (hex code #FFFFFF). 
Aesthetic: Clean, minimalist, rounded shapes, premium designer toy style.
`;

const PROMPT_MAPS: any = {
  SKIN_TONES: {
    'porcelain': 'pale porcelain skin',
    'fair': 'fair warm skin',
    'light': 'light beige skin',
    'medium': 'medium tan skin',
    'olive': 'olive skin',
    'brown': 'warm brown skin',
    'dark': 'dark rich brown skin',
    'deep': 'deep ebony skin',
  },
  HAIR_COLORS: {
    'black': 'soft matte black',
    'dark_brown': 'dark matte brown',
    'brown': 'chestnut brown',
    'auburn': 'auburn red',
    'ginger': 'ginger orange',
    'dark_blonde': 'ash blonde',
    'blonde': 'golden blonde',
    'platinum': 'platinum blonde',
    'grey': 'silver grey',
    'white': 'white',
  },
  CLOTHING_COLORS: {
    'white': 'white',
    'black': 'black',
    'navy': 'navy blue',
    'red': 'red',
    'blue': 'blue',
    'green': 'forest green',
    'yellow': 'yellow',
    'purple': 'purple',
    'pink': 'pink',
    'orange': 'orange',
    'teal': 'teal',
  },
  EYE_COLORS: {
    'dark': 'dark',
    'brown': 'warm brown',
    'blue': 'blue',
    'green': 'green',
    'hazel': 'hazel',
    'grey': 'grey',
  },
  HAIR_STYLES: {
    'bob': 'a sleek bob cut with bangs',
    'ponytail': 'a high ponytail',
    'buns': 'two cute space buns on top of head',
    'long': 'long flowing wavy hair',
    'pixie': 'a short pixie cut',
    'undercut': 'a trendy undercut fade',
    'quiff': 'a voluminous quiff hairstyle',
    'sidepart': 'a neat side part hairstyle',
    'buzz': 'a short buzz cut',
    'messy': 'messy short textured hair',
    'afro': 'a round puffy afro',
    'curly': 'short curly hair',
  },
  CLOTHING_ITEMS: {
    'tshirt': 'a simple crew neck t-shirt',
    'hoodie': 'a cozy hoodie',
    'sweater': 'a chunky knit sweater',
    'jacket': 'a bomber jacket',
    'tank': 'a tank top',
    'dress': 'a simple sundress',
    'blouse': 'a cute blouse',
    'polo': 'a collared polo shirt',
    'buttonup': 'a buttoned dress shirt',
    'henley': 'a henley shirt',
  },
  ACCESSORIES: {
    'none': '',
    'glasses': 'wearing thick black rimmed glasses',
    'sunglasses': 'wearing cool sunglasses',
    'headphones': 'wearing large headphones around the neck',
    'cap': 'wearing a baseball cap',
    'beanie': 'wearing a knit beanie hat',
  }
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { 
      gender, 
      skinToneId, 
      hairStyleId, 
      hairColorId, 
      clothingId, 
      clothingColorId, 
      accessoryId, 
      eyeColorId 
    } = await req.json();

    // Validate API Key
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error("Missing GEMINI_API_KEY environment variable");
    }

    const ai = new GoogleGenAI({ apiKey });

    // --- Step 1: Construct Prompt ---
    
    const skinPrompt = PROMPT_MAPS.SKIN_TONES[skinToneId] || PROMPT_MAPS.SKIN_TONES['medium'];
    const eyePrompt = PROMPT_MAPS.EYE_COLORS[eyeColorId] || 'dark';
    const hairStylePrompt = PROMPT_MAPS.HAIR_STYLES[hairStyleId] || PROMPT_MAPS.HAIR_STYLES['messy'];
    const hairColorPrompt = PROMPT_MAPS.HAIR_COLORS[hairColorId] || 'brown';
    const clothingColorPrompt = PROMPT_MAPS.CLOTHING_COLORS[clothingColorId] || 'white';
    const clothingItemPrompt = PROMPT_MAPS.CLOTHING_ITEMS[clothingId] || 't-shirt';
    const accessoryPrompt = PROMPT_MAPS.ACCESSORIES[accessoryId] || '';
    
    const expressionPrompt = Math.random() > 0.5 ? 'a happy smiling expression' : 'a confident smirk';

    const subjectPrompt = `
      A cute 3D vinyl toy character.
      View: Direct front view. Facing camera.
      Gender: ${gender || 'female'}.
      Skin: ${skinPrompt}.
      Eyes: Large circular ${eyePrompt} eyes.
      Hair: ${hairStylePrompt}, colored ${hairColorPrompt}.
      Clothing: Wearing ${clothingColorPrompt} ${clothingItemPrompt}.
      Expression: ${expressionPrompt}.
      ${accessoryPrompt ? `Accessories: ${accessoryPrompt}.` : ''}
    `;

    const fullPrompt = `${STYLE_PROMPT} ${subjectPrompt}`;

    // --- Step 2: Generate Base Image (Imagen 3) ---

    console.log("Generating base image...");
    const imageResponse = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: fullPrompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/png',
        aspectRatio: '1:1',
      },
    });

    if (!imageResponse.generatedImages?.[0]?.image?.imageBytes) {
      throw new Error("Failed to generate base image");
    }

    const rawBase64 = imageResponse.generatedImages[0].image.imageBytes;

    // --- Step 3: Remove Background (Gemini 2.5 Flash) ---

    console.log("Removing background...");
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
            text: "Precisely segment the vinyl toy character from the white background. Return ONLY the character on a transparent alpha layer. Ensure no white background remains between arms or hair strands. Do not crop."
          }
        ]
      },
      config: {
        responseModalities: [Modality.IMAGE],
      }
    });

    let finalImageBase64 = rawBase64;
    const processedPart = cleanupResponse.candidates?.[0]?.content?.parts?.[0];
    
    if (processedPart && processedPart.inlineData && processedPart.inlineData.data) {
      finalImageBase64 = processedPart.inlineData.data;
    } else {
      console.warn("Background removal failed, returning raw image");
    }

    // --- Step 4: Return Response ---

    return new Response(
      JSON.stringify({ 
        image: `data:image/png;base64,${finalImageBase64}`,
        prompt_used: subjectPrompt 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error("Edge Function Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
