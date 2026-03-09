
import { IPType, WordAssociation } from "../types";

/**
 * Generates word association content using Vercel API proxy.
 * @param word The vocabulary word
 * @param ipLabel The display label/name of the IP
 * @param ipType The enum type for internal tracking
 */
export const generateWordAssociation = async (word: string, ipLabel: string, ipType: IPType): Promise&lt;WordAssociation&gt; =&gt; {
  try {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        word,
        ipLabel
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() =&gt; ({ error: "Unknown error" }));
      throw new Error(errorData.error || `API error: ${response.status}`);
    }

    const data = await response.json();
    return { ...data, ip: ipType, customIPName: ipType === IPType.CUSTOM ? ipLabel : undefined };
  } catch (error) {
    console.error("Error calling API:", error);
    throw error;
  }
};
