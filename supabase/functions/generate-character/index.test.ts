import {
  assert,
  assertEquals,
  assertStringIncludes,
} from "https://deno.land/std@0.224.0/testing/asserts.ts";
import {
  buildCharacterPrompt,
  normalizeAccessories,
} from "./index.ts";

const baseConfig = {
  gender: 'male',
  ageGroup: 'young_adult',
  skinTone: 'medium',
  hairStyle: 'afro',
  hairColor: 'black',
  clothing: 'hoodie',
  clothingColor: 'blue',
  eyeColor: 'brown',
  accessories: ['glasses'],
  transparent: true,
} as const;

Deno.test('buildCharacterPrompt is deterministic for identical configs', () => {
  const promptA = buildCharacterPrompt(JSON.parse(JSON.stringify(baseConfig)));
  const promptB = buildCharacterPrompt(JSON.parse(JSON.stringify(baseConfig)));

  assertEquals(promptA, promptB);
});

Deno.test('hat accessory prompt isolates non-hat descriptions', () => {
  const prompt = buildCharacterPrompt({
    ...baseConfig,
    accessories: ['cap', 'glasses'],
  });

  const lines = prompt.split('\n');
  const hatLine = lines.find((line) => line.startsWith('Hat:'));
  const accessoriesLine = lines.find((line) => line.startsWith('Accessories ONLY'));

  assert(hatLine, 'Hat line should be present when hat accessory is selected');
  assertStringIncludes(hatLine!, 'baseball cap');
  // Hat line should not mention glasses or other accessories
  assert(!hatLine!.includes('glasses'), 'Hat line should not mention glasses');

  assert(accessoriesLine, 'Accessories line should be present for non-hat accessories');
  assertStringIncludes(accessoriesLine!, 'glasses');
});

Deno.test('headphones are removed when conflicting with hats', () => {
  const normalized = normalizeAccessories(['cap', 'headphones']);
  assertEquals(normalized, ['cap']);

  const prompt = buildCharacterPrompt({
    ...baseConfig,
    accessories: ['cap', 'headphones'],
  });

  // Positive accessory description should not mention headphones
  assert(
    !prompt.includes('wearing large over-ear headphones'),
    'Prompt should not instruct the model to add headphones when they conflict with hats',
  );
});

