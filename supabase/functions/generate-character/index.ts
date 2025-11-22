import { GoogleGenAI, Modality } from "npm:@google/genai@^1.30.0";
import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.200.0/crypto/mod.ts";
import { Buffer } from "node:buffer";

// Fix: Declare Deno global
declare const Deno: any;
// Polyfill Buffer for pngjs
globalThis.Buffer = Buffer;

// ============================================================================
// Types
// ============================================================================

interface CharacterConfig {
  gender?: string;
  skinTone: string;
  hairStyle: string;
  hairColor: string;
  clothing: string;
  clothingColor: string;
  eyeColor: string;
  accessories?: string | string[];
  transparent?: boolean;
  cache?: boolean;
}

interface AuthResult {
  userId: string;
  apiKeyId: string | null;
  isApiRequest: boolean;
}

type CreditType = 'api' | 'app';

interface StoragePaths {
  original: string;
  final: string;
  timestamp: number;
  randomId: string;
}

interface BackgroundRemovalResult {
  imageBase64: string;
  isTransparent: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const CONFIG = {
  COST_PER_GENERATION: 1,
  GREEN_DOMINANCE_THRESHOLD: 40,
  IMAGE_FORMAT: 'image/png' as const,
  ASPECT_RATIO: '1:1' as const,
  MODEL_IMAGE_GEN: 'imagen-4.0-generate-001' as const,
  MODEL_MASK_GEN: 'gemini-2.5-flash-image' as const,
  GREEN_SCREEN_COLOR: '#00FF00' as const,
} as const;

const HTTP_STATUS = {
  OK: 200,
  UNAUTHORIZED: 401,
  PAYMENT_REQUIRED: 402,
  FAILED_DEPENDENCY: 424,
  INTERNAL_ERROR: 500,
} as const;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
} as const;

const STYLE_PROMPT = `
Render a high-end collectible vinyl toy figure. Direct front view. Facing the camera straight on. Symmetrical upper body portrait.
Material: Soft matte vinyl with a smooth clay-like finish. NOT glossy, NOT shiny plastic.
Lighting: Soft studio lighting, warm and diffuse.
Background: Solid bright white background (hex code #FFFFFF). 
Aesthetic: Clean, minimalist, rounded shapes, premium designer toy style.
`;

const PROMPT_MAPS = {
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
    'sunglasses': 'wearing exactly one pair of sunglasses placed in only one position: either on the face OR on top of the head. They must not appear in both positions at the same time, and no second pair is allowed under any circumstance.',
    'headphones': 'wearing large headphones around the neck',
    'cap': 'wearing a baseball cap; forward orientation = visible visor; backward orientation = absolutely no visor visible; never mix backward orientation with any visible brim, peak, or visor-like shape',
    'beanie': 'wearing a knit beanie hat',
  }
} as const;

const ACCESSORY_CONFLICTS = new Map<string, string>([
  ['glasses', 'sunglasses'],
  ['sunglasses', 'glasses'],
  ['cap', 'beanie'],
  ['beanie', 'cap'],
]);

// ============================================================================
// Logger
// ============================================================================

const logger = {
  info: (msg: string, ...args: any[]) => console.log(`[generate-character] ${msg}`, ...args),
  warn: (msg: string, ...args: any[]) => console.warn(`[generate-character] ${msg}`, ...args),
  error: (msg: string, ...args: any[]) => console.error(`[generate-character] ${msg}`, ...args),
};

// ============================================================================
// Utility Functions
// ============================================================================

function base64ToBuffer(base64: string): Uint8Array {
  return Uint8Array.from(atob(base64), c => c.charCodeAt(0));
}

async function sha256Hash(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function hashConfig(config: CharacterConfig): Promise<string> {
  // Sort keys to ensure deterministic hash, excluding cache
  const sortedConfig = Object.keys(config)
    .filter(key => key !== 'cache')
    .sort()
    .reduce((obj: Record<string, any>, key) => {
      obj[key] = config[key as keyof CharacterConfig];
      return obj;
    }, {});
  
  return sha256Hash(JSON.stringify(sortedConfig));
}

function validateEnv(): {
  supabaseUrl: string;
  supabaseServiceKey: string;
  geminiApiKey: string;
} {
  const env = {
    supabaseUrl: Deno.env.get('SUPABASE_URL'),
    supabaseServiceKey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
    geminiApiKey: Deno.env.get('GEMINI_API_KEY'),
  };
  
  const missing = Object.entries(env)
    .filter(([_, value]) => !value)
    .map(([key]) => key);
  
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }
  
  return env as Required<typeof env>;
}

function generateStoragePaths(userId: string): StoragePaths {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(7);
  
  return {
    timestamp,
    randomId,
    original: `${userId}/${timestamp}_${randomId}_original.png`,
    final: `${userId}/${timestamp}_${randomId}.png`,
  };
}

function generateRefId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// ============================================================================
// Authentication
// ============================================================================

function extractApiKey(req: Request): string | null {
  const apiKeyHeader = req.headers.get('x-api-key');
  const authHeader = req.headers.get('Authorization');
  
  if (apiKeyHeader) {
    return apiKeyHeader.replace(/^Bearer\s+/i, '').trim();
  }
  
  if (authHeader) {
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (token.startsWith('sk_')) {
      logger.warn('API key in Authorization header. Use x-api-key instead.');
      return token;
    }
  }
  
  return null;
}

async function authenticateWithApiKey(
  apiKey: string,
  supabase: SupabaseClient
): Promise<AuthResult> {
  logger.info('Authenticating with API key:', apiKey.substring(0, 10) + '...');
  
  const keyHash = await sha256Hash(apiKey);
  
  const { data: apiKeyData, error: apiKeyError } = await supabase
    .from('api_keys')
    .select('id, user_id, deleted_at')
    .eq('key_hash', keyHash)
    .single();
  
  if (apiKeyError || !apiKeyData) {
    throw new Error('Invalid or inactive API key');
  }
  
  if (apiKeyData.deleted_at) {
    throw new Error('This API key has been revoked. Please create a new key.');
  }
  
  // Update last_used_at
  await supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', apiKeyData.id);
  
  return { 
    userId: apiKeyData.user_id, 
    apiKeyId: apiKeyData.id, 
    isApiRequest: true 
  };
}

async function authenticateWithToken(
  token: string,
  supabase: SupabaseClient
): Promise<AuthResult> {
  logger.info('Authenticating with Bearer token');
  
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    throw new Error('Invalid authentication token');
  }
  
  return { 
    userId: user.id, 
    apiKeyId: null, 
    isApiRequest: false 
  };
}

async function authenticateUser(req: Request, supabase: SupabaseClient): Promise<AuthResult> {
  const apiKey = extractApiKey(req);
  
  if (apiKey) {
    return authenticateWithApiKey(apiKey, supabase);
  }
  
  const authHeader = req.headers.get('Authorization');
  if (authHeader) {
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    return authenticateWithToken(token, supabase);
  }
  
  throw new Error('No authentication provided. Please provide either an API key (x-api-key header) or Bearer token (Authorization header)');
}

// ============================================================================
// Credit Management
// ============================================================================

async function checkCredits(
  supabase: SupabaseClient,
  userId: string,
  creditType: CreditType
): Promise<void> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('credits_balance, api_credits_balance')
    .eq('id', userId)
    .single();

  if (!profile) {
    throw new Error('User profile not found');
  }

  const creditBalance = creditType === 'api' 
    ? (profile.api_credits_balance || 0) 
    : (profile.credits_balance || 0);

  logger.info('Credit check - Type:', creditType, 'Balance:', creditBalance, 'Required:', CONFIG.COST_PER_GENERATION);

  if (creditBalance < CONFIG.COST_PER_GENERATION) {
    const error: any = new Error('Insufficient credits. Please purchase more credits to continue generating characters.');
    error.statusCode = HTTP_STATUS.PAYMENT_REQUIRED;
    throw error;
  }
}

async function deductCredits(
  supabase: SupabaseClient,
  userId: string,
  creditType: CreditType,
  amount: number
): Promise<string> {
  const refId = generateRefId('gen');
  
  logger.info('Deducting credits - Type:', creditType, 'Amount:', amount);
  
  const deductResult = await supabase.rpc('deduct_credits', {
    p_user_id: userId,
    p_amount: amount,
    p_ref_id: refId,
    p_credit_type: creditType
  });

  if (deductResult.error) {
    logger.error('Failed to deduct credits:', deductResult.error);
    throw new Error('Failed to deduct credits: ' + deductResult.error.message);
  }

  if (!deductResult.data) {
    logger.error('Credit deduction returned false - insufficient credits or race condition');
    const error: any = new Error('Insufficient credits. Please purchase more credits to continue generating characters.');
    error.statusCode = HTTP_STATUS.PAYMENT_REQUIRED;
    throw error;
  }

  logger.info('Credits deducted successfully');
  return refId;
}

async function refundCredits(
  supabase: SupabaseClient,
  userId: string,
  creditType: CreditType,
  amount: number
): Promise<void> {
  logger.info('Refunding credits - Type:', creditType, 'Amount:', amount);
  
  const refundResult = await supabase.rpc('deduct_credits', {
    p_user_id: userId,
    p_amount: -amount, // Negative amount adds credits
    p_ref_id: generateRefId('refund'),
    p_credit_type: creditType
  });
  
  if (refundResult.error) {
    logger.error('Failed to refund credits:', refundResult.error);
  } else {
    logger.info('Credits refunded successfully');
  }
}

// ============================================================================
// Prompt Building
// ============================================================================

function resolveAccessoryConflicts(accessories: string[]): string[] {
  const seen = new Set<string>();
  
  return accessories.filter(accessory => {
    const conflict = ACCESSORY_CONFLICTS.get(accessory);
    if (conflict && seen.has(conflict)) {
      return false;
    }
    seen.add(accessory);
    return true;
  });
}

function normalizeAccessories(accessories: string | string[] | undefined): string[] {
  const accessoriesList = Array.isArray(accessories) 
    ? accessories 
    : accessories ? [accessories] : [];
  
  const validAccessories = accessoriesList.filter(a => a && a !== 'none');
  return resolveAccessoryConflicts(validAccessories);
}

function buildCharacterPrompt(config: CharacterConfig): string {
  const skinTonePrompt = PROMPT_MAPS.SKIN_TONES[config.skinTone as keyof typeof PROMPT_MAPS.SKIN_TONES] || PROMPT_MAPS.SKIN_TONES['medium'];
  const eyeColorPrompt = PROMPT_MAPS.EYE_COLORS[config.eyeColor as keyof typeof PROMPT_MAPS.EYE_COLORS] || 'dark';
  const hairStylePrompt = PROMPT_MAPS.HAIR_STYLES[config.hairStyle as keyof typeof PROMPT_MAPS.HAIR_STYLES] || PROMPT_MAPS.HAIR_STYLES['messy'];
  const hairColorPrompt = PROMPT_MAPS.HAIR_COLORS[config.hairColor as keyof typeof PROMPT_MAPS.HAIR_COLORS] || 'brown';
  const clothingColorPrompt = PROMPT_MAPS.CLOTHING_COLORS[config.clothingColor as keyof typeof PROMPT_MAPS.CLOTHING_COLORS] || 'white';
  const clothingItemPrompt = PROMPT_MAPS.CLOTHING_ITEMS[config.clothing as keyof typeof PROMPT_MAPS.CLOTHING_ITEMS] || 't-shirt';

  const validAccessories = normalizeAccessories(config.accessories);
  
  const accessoryPrompt = validAccessories.length > 0
    ? validAccessories.map(a => PROMPT_MAPS.ACCESSORIES[a as keyof typeof PROMPT_MAPS.ACCESSORIES] || a).join(' and ')
    : '';

  const expressionPrompt = Math.random() > 0.5 
    ? 'a happy smiling expression' 
    : 'a confident smirk';

  const negativePrompt = validAccessories.length === 0 
    ? 'No glasses. No sunglasses. No hats. No accessories.' 
    : '';

  const subjectPrompt = `
    A cute 3D vinyl toy character.
    View: Direct front view. Facing camera.
    Gender: ${config.gender || 'female'}.
    Skin: ${skinTonePrompt}.
    Eyes: Large circular ${eyeColorPrompt} eyes.
    Hair: ${hairStylePrompt}, colored ${hairColorPrompt}.
    Clothing: Wearing ${clothingColorPrompt} ${clothingItemPrompt}.
    Expression: ${expressionPrompt}.
    ${accessoryPrompt ? `Accessories: ${accessoryPrompt}.` : negativePrompt}
  `;
  
  logger.info('Generated prompt:', subjectPrompt);
  
  return `${STYLE_PROMPT} ${subjectPrompt}`;
}

// ============================================================================
// Image Generation
// ============================================================================

async function generateBaseImage(ai: GoogleGenAI, prompt: string): Promise<string> {
  logger.info('Generating base image...');
  
  const imageResponse = await ai.models.generateImages({
    model: CONFIG.MODEL_IMAGE_GEN,
    prompt: prompt,
    config: { 
      numberOfImages: 1, 
      outputMimeType: CONFIG.IMAGE_FORMAT, 
      aspectRatio: CONFIG.ASPECT_RATIO 
    },
  });

  if (!imageResponse.generatedImages?.[0]?.image?.imageBytes) {
    throw new Error("Failed to generate base image");
  }
  
  const rawBase64 = imageResponse.generatedImages[0].image.imageBytes;
  logger.info('Base image generated successfully');
  
  return rawBase64;
}

async function removeBackground(
  rawBase64: string, 
  ai: GoogleGenAI
): Promise<BackgroundRemovalResult> {
  logger.info('Generating Green Screen Mask (Gemini 2.5)...');
  
  try {
    const maskResponse = await ai.models.generateContent({
      model: CONFIG.MODEL_MASK_GEN,
      contents: {
        parts: [
          { inlineData: { mimeType: CONFIG.IMAGE_FORMAT, data: rawBase64 } },
          { text: `Replace the white background with a solid bright green background (hex ${CONFIG.GREEN_SCREEN_COLOR}). Keep the character EXACTLY the same. Do not change the character's pose, lighting, or details. High contrast.` }
        ]
      },
      config: { responseModalities: [Modality.IMAGE] }
    });

    const maskPart = maskResponse.candidates?.[0]?.content?.parts?.[0];

    if (!maskPart?.inlineData?.data) {
      logger.warn('Failed to generate green screen mask. Using original.');
      return { imageBase64: rawBase64, isTransparent: false };
    }

    logger.info('Green screen generation successful. Extracting mask...');

    const { PNG } = await import("npm:pngjs@^7.0.0");

    const rawBuffer = base64ToBuffer(rawBase64);
    const maskBuffer = base64ToBuffer(maskPart.inlineData.data);

    const rawPng = PNG.sync.read(Buffer.from(rawBuffer));
    const maskPng = PNG.sync.read(Buffer.from(maskBuffer));

    const width = rawPng.width;
    const height = rawPng.height;

    if (maskPng.width !== width || maskPng.height !== height) {
      logger.warn('Mask dimensions mismatch. Skipping background removal.');
      return { imageBase64: rawBase64, isTransparent: false };
    }

    let greenPixelCount = 0;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (width * y + x) * 4;

        const mr = maskPng.data[idx];
        const mg = maskPng.data[idx + 1];
        const mb = maskPng.data[idx + 2];

        const isGreen = (mg > mr + CONFIG.GREEN_DOMINANCE_THRESHOLD) && 
                       (mg > mb + CONFIG.GREEN_DOMINANCE_THRESHOLD);

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
      const finalImageBase64 = finalBuffer.toString('base64');
      logger.info(`Mask applied. ${greenPixelCount} pixels removed.`);
      return { imageBase64: finalImageBase64, isTransparent: true };
    } else {
      logger.warn('No green pixels found in mask. Background removal failed.');
      return { imageBase64: rawBase64, isTransparent: false };
    }

  } catch (err) {
    logger.error('Background removal failed:', err);
    return { imageBase64: rawBase64, isTransparent: false };
  }
}

// ============================================================================
// Storage Operations
// ============================================================================

async function uploadImage(
  supabase: SupabaseClient,
  path: string,
  imageBase64: string
): Promise<void> {
  const buffer = base64ToBuffer(imageBase64);
  await supabase.storage
    .from('generations')
    .upload(path, buffer, { contentType: CONFIG.IMAGE_FORMAT });
}

function getPublicUrl(supabase: SupabaseClient, path: string): string {
  const { data } = supabase.storage
    .from('generations')
    .getPublicUrl(path);
  
  return data.publicUrl;
}

// ============================================================================
// Database Operations
// ============================================================================

async function logGeneration(
  supabase: SupabaseClient,
  userId: string,
  apiKeyId: string | null,
  config: CharacterConfig,
  imageUrl: string,
  promptUsed: string
): Promise<void> {
  const configHash = await hashConfig(config);
  
  const { error } = await supabase
    .from('generations')
    .insert({
      user_id: userId,
      api_key_id: apiKeyId,
      config_hash: configHash,
      image_url: imageUrl,
      config: config,
      prompt_used: promptUsed,
      cost_in_credits: CONFIG.COST_PER_GENERATION
    });

  if (error) {
    logger.error('Failed to log generation:', error);
    throw new Error('Failed to log generation metadata');
  }
}

// ============================================================================
// Error Handling
// ============================================================================

function handleError(error: any): Response {
  logger.error('Edge Function Error:', error);
  
  let status: number = HTTP_STATUS.INTERNAL_ERROR;
  
  if (error.statusCode) {
    status = error.statusCode;
  } else if (error.message?.includes('authentication')) {
    status = HTTP_STATUS.UNAUTHORIZED;
  } else if (error.message?.includes('credits')) {
    status = HTTP_STATUS.PAYMENT_REQUIRED;
  } else if (error.message?.includes('billed users') || error.status === 400) {
    status = HTTP_STATUS.FAILED_DEPENDENCY;
    error.message = "System Error: The AI provider requires a billed account. Please contact the developer.";
  }
  
  return new Response(
    JSON.stringify({ error: error.message || "Internal Server Error" }), 
    {
      status,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
    }
  );
}

// ============================================================================
// Main Handler
// ============================================================================

async function generateCharacter(req: Request): Promise<Response> {
  const env = validateEnv();
  const supabase = createClient(env.supabaseUrl, env.supabaseServiceKey);
  const ai = new GoogleGenAI({ apiKey: env.geminiApiKey });

  const { userId, apiKeyId, isApiRequest } = await authenticateUser(req, supabase);
  logger.info('Authenticated user:', userId, 'API Key:', apiKeyId || 'none');

  const config: CharacterConfig = await req.json();
  logger.info('Received config:', JSON.stringify(config, null, 2));

  const creditType: CreditType = isApiRequest ? 'api' : 'app';

  await checkCredits(supabase, userId, creditType);
  await deductCredits(supabase, userId, creditType, CONFIG.COST_PER_GENERATION);

  try {
    const prompt = buildCharacterPrompt(config);
    const rawImageBase64 = await generateBaseImage(ai, prompt);
    
    const paths = generateStoragePaths(userId);
    await uploadImage(supabase, paths.original, rawImageBase64);

    const finalResult: BackgroundRemovalResult = config.transparent !== false
      ? await removeBackground(rawImageBase64, ai)
      : { imageBase64: rawImageBase64, isTransparent: false };
    
    const finalImageBase64 = finalResult.imageBase64;

    await uploadImage(supabase, paths.final, finalImageBase64);
    const imageUrl = getPublicUrl(supabase, paths.final);

    await logGeneration(supabase, userId, apiKeyId, config, imageUrl, prompt);

    logger.info('Generation complete. Image URL:', imageUrl);

    return new Response(
      JSON.stringify({ image: imageUrl }), 
      {
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      }
    );

  } catch (genError: any) {
    logger.error('Generation Failed, Refunding:', genError);
    await refundCredits(supabase, userId, creditType, CONFIG.COST_PER_GENERATION);
    throw genError;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    return await generateCharacter(req);
  } catch (error: any) {
    return handleError(error);
  }
});