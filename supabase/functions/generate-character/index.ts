import { GoogleGenAI, Modality } from "npm:@google/genai@^1.30.0";
import { createClient } from "npm:@supabase/supabase-js@2";
import { Buffer } from "node:buffer";
import { handleCors, jsonResponse, errorResponse, authenticateRequest, isAuthError, sha256Hash, validateCharacterConfig, HTTP_STATUS } from '../_shared/index.ts';
// Polyfill Buffer for pngjs
globalThis.Buffer = Buffer;
// ============================================================================
// Constants
// ============================================================================
const CONFIG = {
  COST_PER_GENERATION: 1,
  GREEN_DOMINANCE_THRESHOLD: 40,
  IMAGE_FORMAT: 'image/png',
  ASPECT_RATIO: '1:1',
  MODEL_IMAGE_GEN: 'imagen-4.0-generate-001',
  MODEL_MASK_GEN: 'gemini-2.5-flash-image',
  GREEN_SCREEN_COLOR: '#00FF00'
};
// HTTP_STATUS now imported from _shared
const STYLE_PROMPT = `
Render a high-end collectible vinyl toy figure. Direct front view. Facing the camera straight on. Symmetrical upper body portrait.
Material: Soft matte vinyl with a smooth clay-like finish. NOT glossy, NOT shiny plastic.
Lighting: Soft studio lighting, warm and diffuse.
Background: Solid bright white seamless studio backdrop with no gradients, stickers, logos, or text overlays.
Aesthetic: Clean, minimalist, rounded shapes, premium designer toy style.
Absolutely do NOT place any text, numbers, hex codes, signatures, or UI elements anywhere in the frame.
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
    'deep': 'deep ebony skin'
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
    'blue': 'vibrant blue',
    'purple': 'vibrant purple'
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
    'teal': 'teal'
  },
  EYE_COLORS: {
    'dark': 'dark',
    'brown': 'warm brown',
    'blue': 'blue',
    'green': 'green',
    'hazel': 'hazel',
    'grey': 'grey'
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
    'combover': 'a classic combover hairstyle',
    'messy': 'messy short textured hair',
    'afro': 'a round puffy afro',
    'curly': 'short curly hair'
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
    'henley': 'a henley shirt'
  },
  ACCESSORIES: {
    'none': '',
    'glasses': 'wearing thick black rimmed glasses',
    'sunglasses': 'wearing exactly ONE single pair of sunglasses on the face covering the eyes. NOT on top of head. NOT multiple pairs. ONLY one pair on face.',
    'headphones': 'wearing large headphones around the neck',
    'cap': 'wearing a front-facing baseball cap with the visor pointing forward, solid front panel, and zero visibility of any rear strap, opening, or adjustment hardware',
    'beanie': 'wearing a knit beanie hat'
  },
  AGE_GROUPS: {
    'kid': 'Childlike proportions with larger head-to-body ratio (1:3), very round soft features, big innocent eyes, button nose, gentle expression',
    'preteen': 'Pre-adolescent proportions (1:4 head-to-body), slightly more defined features while maintaining softness, bright curious expression',
    'teen': 'Adolescent proportions (1:5 head-to-body), balanced features, expressive and energetic',
    'young_adult': 'Young adult proportions (1:6 head-to-body), refined features, confident presence, mature expression',
    'adult': 'Mature adult proportions (1:6.5 head-to-body), fully defined features, distinguished appearance, composed expression'
  }
};
const ACCESSORY_CONFLICTS = new Map([
  [
    'glasses',
    'sunglasses'
  ],
  [
    'sunglasses',
    'glasses'
  ],
  [
    'cap',
    'beanie'
  ],
  [
    'beanie',
    'cap'
  ]
]);
// ============================================================================
// Logger
// ============================================================================
const logger = {
  info: (msg, ...args)=>console.log(`[generate-character] ${msg}`, ...args),
  warn: (msg, ...args)=>console.warn(`[generate-character] ${msg}`, ...args),
  error: (msg, ...args)=>console.error(`[generate-character] ${msg}`, ...args)
};
// ============================================================================
// Utility Functions
// ============================================================================
function base64ToBuffer(base64) {
  return Uint8Array.from(atob(base64), (c)=>c.charCodeAt(0));
}
// sha256Hash now imported from _shared/auth
async function hashConfig(config) {
  // Sort keys to ensure deterministic hash, excluding cache
  const sortedConfig = Object.keys(config).filter((key)=>key !== 'cache').sort().reduce((obj, key)=>{
    obj[key] = config[key];
    return obj;
  }, {});
  return sha256Hash(JSON.stringify(sortedConfig));
}
function validateEnv() {
  const env = {
    supabaseUrl: Deno.env.get('SUPABASE_URL'),
    supabaseServiceKey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
    geminiApiKey: Deno.env.get('GEMINI_API_KEY')
  };
  const missing = Object.entries(env).filter(([_, value])=>!value).map(([key])=>key);
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }
  return env;
}
function generateStoragePaths(userId) {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(7);
  return {
    timestamp,
    randomId,
    original: `${userId}/${timestamp}_${randomId}_original.png`,
    final: `${userId}/${timestamp}_${randomId}.png`
  };
}
function generateRefId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
// ============================================================================
// Authentication
// ============================================================================
// Authentication functions now imported from _shared/auth
// ============================================================================
// Credit Management
// ============================================================================
async function checkCredits(supabase, userId, creditType) {
  const { data: profile } = await supabase.from('profiles').select('credits_balance, api_credits_balance').eq('id', userId).single();
  if (!profile) {
    throw new Error('User profile not found');
  }
  const creditBalance = creditType === 'api' ? profile.api_credits_balance || 0 : profile.credits_balance || 0;
  logger.info('Credit check - Type:', creditType, 'Balance:', creditBalance, 'Required:', CONFIG.COST_PER_GENERATION);
  if (creditBalance < CONFIG.COST_PER_GENERATION) {
    const error = new Error('Insufficient credits. Please purchase more credits to continue generating characters.');
    error.statusCode = HTTP_STATUS.PAYMENT_REQUIRED;
    throw error;
  }
}
async function deductCredits(supabase, userId, creditType, amount) {
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
    const error = new Error('Insufficient credits. Please purchase more credits to continue generating characters.');
    error.statusCode = HTTP_STATUS.PAYMENT_REQUIRED;
    throw error;
  }
  logger.info('Credits deducted successfully');
  return refId;
}
async function refundCredits(supabase, userId, creditType, amount) {
  logger.info('Refunding credits - Type:', creditType, 'Amount:', amount);
  const refundResult = await supabase.rpc('deduct_credits', {
    p_user_id: userId,
    p_amount: -amount,
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
function resolveAccessoryConflicts(accessories) {
  const seen = new Set();
  return accessories.filter((accessory)=>{
    const conflict = ACCESSORY_CONFLICTS.get(accessory);
    if (conflict && seen.has(conflict)) {
      return false;
    }
    seen.add(accessory);
    return true;
  });
}
function normalizeAccessories(accessories) {
  const accessoriesList = Array.isArray(accessories) ? accessories : accessories ? [
    accessories
  ] : [];
  const validAccessories = accessoriesList.filter((a)=>a && a !== 'none');
  return resolveAccessoryConflicts(validAccessories);
}
function buildCharacterPrompt(config) {
  const ageGroup = config.ageGroup || 'teen';
  const agePrompt = PROMPT_MAPS.AGE_GROUPS[ageGroup] || PROMPT_MAPS.AGE_GROUPS['teen'];
  const skinTonePrompt = PROMPT_MAPS.SKIN_TONES[config.skinTone] || PROMPT_MAPS.SKIN_TONES['medium'];
  const eyeColorPrompt = PROMPT_MAPS.EYE_COLORS[config.eyeColor] || 'dark';
  const hairStylePrompt = PROMPT_MAPS.HAIR_STYLES[config.hairStyle] || PROMPT_MAPS.HAIR_STYLES['messy'];
  const hairColorPrompt = PROMPT_MAPS.HAIR_COLORS[config.hairColor] || 'brown';
  const clothingColorPrompt = PROMPT_MAPS.CLOTHING_COLORS[config.clothingColor] || 'white';
  const clothingItemPrompt = PROMPT_MAPS.CLOTHING_ITEMS[config.clothing] || 't-shirt';
  const validAccessories = normalizeAccessories(config.accessories);
  const accessoryPrompt = validAccessories.length > 0 ? validAccessories.map((a)=>PROMPT_MAPS.ACCESSORIES[a] || a).join(' and ') : '';
  const expressionPrompt = Math.random() > 0.5 ? 'a happy smiling expression' : 'a confident smirk';
  // Build constraint prompt for accessories + general guardrails
  const constraints = [];
  if (validAccessories.length === 0) {
    constraints.push('No glasses. No sunglasses. No hats. No accessories.');
  } else {
    if (!validAccessories.includes('glasses') && !validAccessories.includes('sunglasses')) {
      constraints.push('No glasses or sunglasses other than what is described.');
    }
    if (!validAccessories.includes('cap') && !validAccessories.includes('beanie')) {
      constraints.push('No hats other than what is described.');
    }
    if (!validAccessories.includes('headphones')) {
      constraints.push('No headphones other than what is described.');
    }
    if (validAccessories.includes('sunglasses')) {
      constraints.push('Sunglasses must stay on the face only, never on the head, and only a single pair.');
    }
    if (validAccessories.includes('cap')) {
      constraints.push('Cap must face forward with visor in front; do not show any rear opening, strap, or backwards orientation.');
    }
  }
  constraints.push('Absolutely no text, lettering, numbers, logos, stickers, watermarks, or hex codes anywhere in the image.');
  const accessorialPrompt = accessoryPrompt ? `Accessories: ${accessoryPrompt}.` : '';
  const constraintPrompt = constraints.length > 0 ? `Constraints: ${constraints.join(' ')}` : '';
  const subjectPrompt = `
    A cute 3D vinyl toy character.
    View: Direct front view. Facing camera.
    Gender: ${config.gender || 'female'}.
    Age: ${agePrompt}.
    Skin: ${skinTonePrompt}.
    Eyes: Large circular ${eyeColorPrompt} eyes.
    Hair: ${hairStylePrompt}, colored ${hairColorPrompt}.
    Clothing: Wearing ${clothingColorPrompt} ${clothingItemPrompt}.
    Expression: ${expressionPrompt}.
    ${accessorialPrompt}
    ${constraintPrompt}
  `;
  logger.info('Generated prompt:', subjectPrompt);
  return `${STYLE_PROMPT} ${subjectPrompt}`;
}
// ============================================================================
// Image Generation
// ============================================================================
async function generateBaseImage(ai, prompt) {
  logger.info('Generating base image...');
  const imageResponse = await ai.models.generateImages({
    model: CONFIG.MODEL_IMAGE_GEN,
    prompt: prompt,
    config: {
      numberOfImages: 1,
      outputMimeType: CONFIG.IMAGE_FORMAT,
      aspectRatio: CONFIG.ASPECT_RATIO
    }
  });
  if (!imageResponse.generatedImages?.[0]?.image?.imageBytes) {
    throw new Error("Failed to generate base image");
  }
  const rawBase64 = imageResponse.generatedImages[0].image.imageBytes;
  logger.info('Base image generated successfully');
  return rawBase64;
}
async function removeBackground(rawBase64, ai) {
  logger.info('Generating Green Screen Mask (Gemini 2.5)...');
  try {
    const maskResponse = await ai.models.generateContent({
      model: CONFIG.MODEL_MASK_GEN,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: CONFIG.IMAGE_FORMAT,
              data: rawBase64
            }
          },
          {
            text: `Replace the white background with a solid bright green background (hex ${CONFIG.GREEN_SCREEN_COLOR}). Keep the character EXACTLY the same. Do not change the character's pose, lighting, or details. High contrast.`
          }
        ]
      },
      config: {
        responseModalities: [
          Modality.IMAGE
        ]
      }
    });
    const maskPart = maskResponse.candidates?.[0]?.content?.parts?.[0];
    if (!maskPart?.inlineData?.data) {
      logger.warn('Failed to generate green screen mask. Using original.');
      return {
        imageBase64: rawBase64,
        isTransparent: false
      };
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
      return {
        imageBase64: rawBase64,
        isTransparent: false
      };
    }
    let greenPixelCount = 0;
    for(let y = 0; y < height; y++){
      for(let x = 0; x < width; x++){
        const idx = (width * y + x) * 4;
        const mr = maskPng.data[idx];
        const mg = maskPng.data[idx + 1];
        const mb = maskPng.data[idx + 2];
        const isGreen = mg > mr + CONFIG.GREEN_DOMINANCE_THRESHOLD && mg > mb + CONFIG.GREEN_DOMINANCE_THRESHOLD;
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
      return {
        imageBase64: finalImageBase64,
        isTransparent: true
      };
    } else {
      logger.warn('No green pixels found in mask. Background removal failed.');
      return {
        imageBase64: rawBase64,
        isTransparent: false
      };
    }
  } catch (err) {
    logger.error('Background removal failed:', err);
    return {
      imageBase64: rawBase64,
      isTransparent: false
    };
  }
}
// ============================================================================
// Storage Operations
// ============================================================================
async function uploadImage(supabase, path, imageBase64) {
  const buffer = base64ToBuffer(imageBase64);
  await supabase.storage.from('generations').upload(path, buffer, {
    contentType: CONFIG.IMAGE_FORMAT
  });
}
function getPublicUrl(supabase, path) {
  const { data } = supabase.storage.from('generations').getPublicUrl(path);
  return data.publicUrl;
}
// ============================================================================
// Database Operations
// ============================================================================
async function logGeneration(supabase, userId, apiKeyId, config, imageUrl, promptUsed) {
  const configHash = await hashConfig(config);
  const { error } = await supabase.from('generations').insert({
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
function handleError(error) {
  logger.error('Edge Function Error:', error);
  let status = HTTP_STATUS.INTERNAL_ERROR;
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
  return errorResponse(error.message || "Internal Server Error", status);
}
// ============================================================================
// Main Handler
// ============================================================================
async function generateCharacter(req) {
  const env = validateEnv();
  const supabase = createClient(env.supabaseUrl, env.supabaseServiceKey);
  const ai = new GoogleGenAI({
    apiKey: env.geminiApiKey
  });
  // Authenticate using shared auth utilities
  const authResult = await authenticateRequest(req, supabase);
  if (isAuthError(authResult)) {
    return errorResponse(authResult.message, authResult.statusCode);
  }
  const { userId, apiKeyId, isApiRequest } = authResult;
  logger.info('Authenticated user:', userId, 'API Key:', apiKeyId || 'none');
  const config = await req.json();
  logger.info('Received config:', JSON.stringify(config, null, 2));
  // Validate config using shared validation
  const validationResult = validateCharacterConfig(config);
  if (!validationResult.success) {
    return errorResponse(validationResult.error || 'Invalid configuration', HTTP_STATUS.BAD_REQUEST);
  }
  const creditType = isApiRequest ? 'api' : 'app';
  await checkCredits(supabase, userId, creditType);
  await deductCredits(supabase, userId, creditType, CONFIG.COST_PER_GENERATION);
  try {
    const prompt = buildCharacterPrompt(config);
    const rawImageBase64 = await generateBaseImage(ai, prompt);
    const paths = generateStoragePaths(userId);
    await uploadImage(supabase, paths.original, rawImageBase64);
    const finalResult = config.transparent !== false ? await removeBackground(rawImageBase64, ai) : {
      imageBase64: rawImageBase64,
      isTransparent: false
    };
    const finalImageBase64 = finalResult.imageBase64;
    await uploadImage(supabase, paths.final, finalImageBase64);
    const imageUrl = getPublicUrl(supabase, paths.final);
    await logGeneration(supabase, userId, apiKeyId, config, imageUrl, prompt);
    logger.info('Generation complete. Image URL:', imageUrl);
    return jsonResponse({
      image: imageUrl
    });
  } catch (genError) {
    logger.error('Generation Failed, Refunding:', genError);
    await refundCredits(supabase, userId, creditType, CONFIG.COST_PER_GENERATION);
    throw genError;
  }
}
Deno.serve(async (req)=>{
  // Handle CORS preflight using shared utility
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;
  try {
    return await generateCharacter(req);
  } catch (error) {
    return handleError(error);
  }
});
