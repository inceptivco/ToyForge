import { CharacterConfig } from "../types";
import { supabase } from "./supabase";
import { characterForgeClient } from "./sdk/client";

// --- Main Pipeline ---

export const generateCharacterPipeline = async (
  config: CharacterConfig,
  onStatusUpdate: (status: string) => void
): Promise<string> => {

  try {
    onStatusUpdate("Initiating Generation...");

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error("You must be logged in to generate characters.");
    }

    // Delegate to the SDK Client
    // The client handles caching, API calls, and status updates related to those actions
    const imageUrl = await characterForgeClient.generate(config, onStatusUpdate);

    onStatusUpdate("Generation Complete!");

    return imageUrl;

  } catch (error: any) {
    console.error("Pipeline Error:", error);
    throw error;
  }
};
