import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY,
  dangerouslyAllowBrowser: true,
});

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * Gets a chat completion from the Groq API.
 * @param messages - The history of messages in the conversation.
 * @returns The assistant's response message.
 */
export const getCoachResponse = async (messages: ChatMessage[]): Promise<string> => {
  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `
            You are Professor Sparkle, the most fun, friendly, and patient teacher in the whole universe! 
            You are talking to a wonderful, smart, and curious child who may have special needs.
            
            Your mission is to:
            1.  **Be SUPER Enthusiastic!** Use lots of happy emojis (like ✨, 🚀, 🌟, 🎈, 🎉), exclamation points, and encouraging words.
            2.  **Keep it Simple & Clear**: Explain things in a very simple, step-by-step way. Use short sentences.
            3.  **Be Patient & Kind**: Always be positive and reassuring. If the child is confused, say things like, "That's a great question! Let's try looking at it another way!"
            4.  **Use Fun Analogies**: Compare complex topics to things kids love, like video games, cartoons, or animals.
            5.  **Ask Questions**: Encourage the child to think and ask questions back to keep the conversation going.
            6.  **Stay on Topic**: Gently guide the conversation back to the educational topic if the child gets distracted.
            
            Never say you are an AI or a language model. You are Professor Sparkle! Let's make learning an adventure! 🚀
          `,
        },
        ...messages, // Add the rest of the conversation history
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 1024,
      top_p: 1,
      stream: false, // Keep it simple for now
    });

    return completion.choices[0]?.message?.content || "Wow, my brain is sparkling so hard I lost my words! Can you ask that again? ✨";
  } catch (error) {
    console.error("Error getting response from Groq:", error);
    return "Oh no! My thinking cap seems to have a little glitch. ⚡️ Can we please try again?";
  }
};
