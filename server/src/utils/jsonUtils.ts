/**
 * @description Extracts a JSON object from a string that might contain other text.
 * @param text The raw text response from the AI.
 * @returns The parsed JSON object, or null if no valid JSON is found.
 */
export const parseJsonFromText = (text: string): any | null => {
  // Find the first '{' and the last '}' to extract the JSON block
  const jsonMatch = text.match(/{[\s\S]*}/);
  if (jsonMatch && jsonMatch[0]) {
    try {
      // Attempt to parse the extracted string
      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error("Failed to parse extracted JSON:", error);
      return null; // Return null if parsing fails
    }
  }
  return null; // Return null if no JSON object is found
};