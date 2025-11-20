
import { CharacterConfig } from "../types";
import { supabase } from "./supabase";

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

    onStatusUpdate("Calling AI Cloud...");

    const { data, error } = await supabase.functions.invoke('generate-character', {
      body: config,
    });

    if (error) {
      console.error("Function Error:", error);
      throw new Error(error.message || "Failed to call generation service");
    }

    if (data.error) {
      throw new Error(data.error);
    }

    if (data.cached) {
      onStatusUpdate("Retrieved from Cache!");
    } else {
      onStatusUpdate("Generation Complete!");
    }

    return data.image;

  } catch (error: any) {
    console.error("Pipeline Error:", error);
    throw error;
  }
};
