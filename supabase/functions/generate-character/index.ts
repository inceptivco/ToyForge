
import { GoogleGenAI, Modality } from "npm:@google/genai@^1.30.0";
import { createClient } from "npm:@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.200.0/crypto/mod.ts";

import { Buffer } from "node:buffer";

// Fix: Declare Deno global
declare const Deno: any;
// Polyfill Buffer for pngjs
globalThis.Buffer = Buffer;

// CORS Headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

// --- Constants ---
const COST_PER_GENERATION = 1;

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

// --- Helper Functions ---

async function hashConfig(config: any): Promise<string> {
  // Sort keys to ensure deterministic hash
  const sortedConfig = Object.keys(config).sort().reduce((obj: any, key) => {
    obj[key] = config[key];
    return obj;
  }, {});
  const str = JSON.stringify(sortedConfig);
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// --- Main Handler ---

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

    if (!supabaseUrl || !supabaseServiceKey || !geminiApiKey) {
      const missing = [];
      if (!supabaseUrl) missing.push('SUPABASE_URL');
      if (!supabaseServiceKey) missing.push('SUPABASE_SERVICE_ROLE_KEY');
      if (!geminiApiKey) missing.push('GEMINI_API_KEY');

      console.error("Missing environment variables:", missing.join(', '));
      throw new Error(`Missing environment variables: ${missing.join(', ')}`);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const ai = new GoogleGenAI({ apiKey: geminiApiKey });

    // 1. Parse Request
    const config = await req.json();
    const {
      gender, skinToneId, hairStyleId, hairColorId,
      clothingId, clothingColorId, accessoryId, eyeColorId
    } = config;

    // 2. Authenticate User
    let userId: string | null = null;
    const authHeader = req.headers.get('Authorization');
    const apiKeyHeader = req.headers.get('x-api-key');

    if (apiKeyHeader) {
      // Validate API Key
      // For MVP, we assume raw key is stored or we hash it. 
      // In migration we said 'key_hash'. Let's assume client sends raw key and we hash it to compare.
      // But for simplicity in this step, let's assume we can look it up.
      // Actually, let's stick to the plan: User Session is primary for now.
      // If we implement API keys later, we add logic here.
      // For now, let's throw if no Auth.
    }

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (user) userId = user.id;
    }

    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    // 3. Check Cache
    const configHash = await hashConfig(config);
    const { data: cachedGen } = await supabase
      .from('generations')
      .select('image_url')
      .eq('config_hash', configHash)
      .single();

    if (cachedGen) {
      console.log("Cache Hit!");
      return new Response(JSON.stringify({ image: cachedGen.image_url, cached: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 4. Deduct Credits
    // We use the RPC function we created
    const { data: success, error: creditError } = await supabase
      .rpc('deduct_credits', {
        p_user_id: userId,
        p_amount: COST_PER_GENERATION,
        p_ref_id: 'pending_gen_' + Date.now()
      });

    if (creditError || !success) {
      return new Response(JSON.stringify({ error: "Insufficient Credits" }), { status: 402, headers: corsHeaders });
    }

    // 5. Generate Image
    try {
      // Construct Prompt
      const skinPrompt = PROMPT_MAPS.SKIN_TONES[skinToneId] || PROMPT_MAPS.SKIN_TONES['medium'];
      const eyePrompt = PROMPT_MAPS.EYE_COLORS[eyeColorId] || 'dark';
      const hairStylePrompt = PROMPT_MAPS.HAIR_STYLES[hairStyleId] || PROMPT_MAPS.HAIR_STYLES['messy'];
      const hairColorPrompt = PROMPT_MAPS.HAIR_COLORS[hairColorId] || 'brown';
      const clothingColorPrompt = PROMPT_MAPS.CLOTHING_COLORS[clothingColorId] || 'white';
      const clothingItemPrompt = PROMPT_MAPS.CLOTHING_ITEMS[clothingId] || 't-shirt';
      const accessoryPrompt = PROMPT_MAPS.ACCESSORIES[accessoryId] || '';
      const expressionPrompt = Math.random() > 0.5 ? 'a happy smiling expression' : 'a confident smirk';

      // Explicit negative prompt for accessories if none
      const negativePrompt = accessoryId === 'none' ? 'No glasses. No sunglasses. No hats. No accessories.' : '';

      const subjectPrompt = `
        A cute 3D vinyl toy character.
        View: Direct front view. Facing camera.
        Gender: ${gender || 'female'}.
        Skin: ${skinPrompt}.
        Eyes: Large circular ${eyePrompt} eyes.
        Hair: ${hairStylePrompt}, colored ${hairColorPrompt}.
        Clothing: Wearing ${clothingColorPrompt} ${clothingItemPrompt}.
        Expression: ${expressionPrompt}.
        ${accessoryPrompt ? `Accessories: ${accessoryPrompt}.` : negativePrompt}
      `;
      const fullPrompt = `${STYLE_PROMPT} ${subjectPrompt}`;

      // AI Generation (Imagen 3)
      console.log("Generating base image...");
      const imageResponse = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: fullPrompt,
        config: { numberOfImages: 1, outputMimeType: 'image/png', aspectRatio: '1:1' },
      });

      if (!imageResponse.generatedImages?.[0]?.image?.imageBytes) throw new Error("Failed to generate base image");
      const rawBase64 = imageResponse.generatedImages[0].image.imageBytes;

      // 6. Upload Original to Storage (Backup)
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(7);
      const originalFileName = `${userId}/${timestamp}_${randomId}_original.png`;
      const finalFileName = `${userId}/${timestamp}_${randomId}.png`;

      const originalImageBuffer = Uint8Array.from(atob(rawBase64), c => c.charCodeAt(0));
      await supabase.storage
        .from('generations')
        .upload(originalFileName, originalImageBuffer, { contentType: 'image/png' });

      // --- Figma-Style Background Removal (Green Screen) ---
      console.log("Generating Green Screen Mask (Gemini 2.5)...");

      let finalImageBase64 = rawBase64;
      let isTransparent = false;

      try {
        // 1. Generate "Green Screen" version
        const maskResponse = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [
              { inlineData: { mimeType: 'image/png', data: rawBase64 } },
              { text: "Replace the white background with a solid bright green background (hex #00FF00). Keep the character EXACTLY the same. Do not change the character's pose, lighting, or details. High contrast." }
            ]
          },
          config: { responseModalities: [Modality.IMAGE] }
        });

        const maskPart = maskResponse.candidates?.[0]?.content?.parts?.[0];

        if (maskPart?.inlineData?.data) {
          console.log("Green screen generation successful. Extracting mask...");

          const { PNG } = await import("npm:pngjs@^7.0.0");

          const rawBuffer = Uint8Array.from(atob(rawBase64), c => c.charCodeAt(0));
          const maskBuffer = Uint8Array.from(atob(maskPart.inlineData.data), c => c.charCodeAt(0));

          const rawPng = PNG.sync.read(Buffer.from(rawBuffer));
          const maskPng = PNG.sync.read(Buffer.from(maskBuffer));

          const width = rawPng.width;
          const height = rawPng.height;

          // Resize check
          if (maskPng.width !== width || maskPng.height !== height) {
            console.warn("Mask dimensions mismatch. Skipping background removal.");
            throw new Error("Dimension mismatch");
          }

          let greenPixelCount = 0;

          for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
              const idx = (width * y + x) * 4;

              // Check Mask Pixel (Green Screen)
              const mr = maskPng.data[idx];
              const mg = maskPng.data[idx + 1];
              const mb = maskPng.data[idx + 2];

              // Robust Green Keyer: Green must be significantly dominant
              // G > R + threshold AND G > B + threshold
              const dominance = 40;
              const isGreen = (mg > mr + dominance) && (mg > mb + dominance);

              if (isGreen) {
                rawPng.data[idx + 3] = 0; // Transparent
                greenPixelCount++;
              } else {
                rawPng.data[idx + 3] = 255; // Opaque
              }
            }
          }

          if (greenPixelCount > 0) {
            const finalBuffer = PNG.sync.write(rawPng);
            finalImageBase64 = finalBuffer.toString('base64');
            isTransparent = true;
            console.log(`Mask applied. ${greenPixelCount} pixels removed.`);
          } else {
            console.warn("No green pixels found in mask. Background removal failed.");
          }

        } else {
          console.warn("Failed to generate green screen mask. Using original.");
        }

      } catch (maskError) {
        console.error("Background removal failed:", maskError);
        // Fallback to original (white BG)
      }

      // 7. Upload Final Image to Storage
      const finalImageBuffer = Uint8Array.from(atob(finalImageBase64), c => c.charCodeAt(0));

      const { error: uploadError } = await supabase.storage
        .from('generations')
        .upload(finalFileName, finalImageBuffer, { contentType: 'image/png' });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('generations').getPublicUrl(finalFileName);

      // 8. Save to DB (Cache)
      await supabase.from('generations').insert({
        user_id: userId,
        config_hash: configHash,
        image_url: publicUrl,
        prompt_used: subjectPrompt,
        cost_in_credits: COST_PER_GENERATION
      });

      return new Response(JSON.stringify({ image: publicUrl, cached: false, transparent: isTransparent }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (genError: any) {
      // Refund Credits on Failure
      console.error("Generation Failed, Refunding:", genError);
      await supabase.rpc('deduct_credits', {
        p_user_id: userId,
        p_amount: -COST_PER_GENERATION, // Negative amount adds credits
        p_ref_id: 'refund_' + Date.now()
      });

      // Handle Specific Google AI Errors
      if (genError.message?.includes('billed users') || genError.status === 400) {
        return new Response(JSON.stringify({
          error: "System Error: The AI provider requires a billed account. Please contact the developer."
        }), { status: 424, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      throw genError;
    }

  } catch (error: any) {
    console.error("Edge Function Error:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal Server Error" }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
