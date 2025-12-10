import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Meeting, PRD, Roadmap, ActionItem, Decision } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Schemas
const meetingProcessingSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "A concise title for the meeting" },
    participants: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of people present" },
    overview: { type: Type.STRING, description: "A 2-3 sentence executive summary" },
    agenda: { type: Type.ARRAY, items: { type: Type.STRING } },
    risks: { type: Type.ARRAY, items: { type: Type.STRING } },
    decisions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          description: { type: Type.STRING },
          rationale: { type: Type.STRING },
          owner: { type: Type.STRING },
          status: { type: Type.STRING, enum: ['DECIDED', 'PENDING'] }
        }
      }
    },
    actionItems: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          task: { type: Type.STRING },
          owner: { type: Type.STRING },
          dueDate: { type: Type.STRING },
          priority: { type: Type.STRING, enum: ['High', 'Medium', 'Low'] },
          status: { type: Type.STRING, enum: ['Open', 'In Progress', 'Done'] }
        }
      }
    }
  },
  required: ["title", "overview", "decisions", "actionItems"]
};

const prdSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    problemStatement: { type: Type.STRING },
    personas: { type: Type.ARRAY, items: { type: Type.STRING } },
    userStories: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          role: { type: Type.STRING },
          capability: { type: Type.STRING },
          outcome: { type: Type.STRING },
          acceptanceCriteria: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      }
    },
    technicalRequirements: { type: Type.ARRAY, items: { type: Type.STRING } }
  }
};

const roadmapSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    strategicTheme: { type: Type.STRING },
    epics: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          phase: { type: Type.STRING, enum: ['Now', 'Next', 'Later'] },
          description: { type: Type.STRING },
          dependencies: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      }
    }
  }
};

/**
 * Process raw meeting input (text or audio base64) to extract initial metadata
 */
export const processMeetingInput = async (
  content: string,
  inputType: 'text' | 'audio',
  mimeType?: string
): Promise<Partial<Meeting>> => {
  
  const model = "gemini-2.5-flash"; // Efficient for extraction

  let contents;
  
  if (inputType === 'audio') {
    contents = {
      parts: [
        {
          inlineData: {
            mimeType: mimeType || 'audio/mp3',
            data: content
          }
        },
        {
          text: "Analyze this meeting recording. Provide a full transcript if possible, then extract the structured data requested in the schema."
        }
      ]
    };
  } else {
    contents = {
      parts: [{ text: `Analyze these meeting notes:\n\n${content}` }]
    };
  }

  const response = await ai.models.generateContent({
    model,
    contents,
    config: {
      responseMimeType: "application/json",
      responseSchema: meetingProcessingSchema,
      systemInstruction: "You are an expert Product Manager assistant. Analyze the meeting content to extract key product artifacts."
    }
  });

  const data = JSON.parse(response.text || "{}");

  // If it was audio, we want the transcript. The JSON schema above doesn't strictly force the transcript 
  // into the JSON to avoid token limits on the structured output, so we might need a separate pass or 
  // simpler extraction. For this demo, we assume the text input IS the transcript or notes. 
  // If audio, we do a quick second pass or just use the summary as the 'content' for now if transcript is too long.
  // Ideally, we'd use a separate call for pure transcription if needed, but 2.5 flash is good at multimodal.
  
  // Let's create a robust ID
  const meetingId = crypto.randomUUID();

  return {
    id: meetingId,
    date: new Date().toISOString(),
    type: inputType === 'audio' ? 'Audio' : 'Notes',
    transcript: inputType === 'text' ? content : "Audio Transcript Processed internally for context.", // Simplified for demo
    title: data.title || "Untitled Meeting",
    participants: data.participants || [],
    summary: {
      overview: data.overview || "",
      agenda: data.agenda || [],
      risks: data.risks || []
    },
    decisions: (data.decisions || []).map((d: any) => ({ ...d, id: crypto.randomUUID() })),
    actionItems: (data.actionItems || []).map((a: any) => ({ ...a, id: crypto.randomUUID() }))
  };
};

/**
 * Generate a PRD from meeting context
 */
export const generatePRD = async (meetingContext: string): Promise<PRD> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview", // Use stronger model for reasoning
    contents: {
      parts: [{ text: `Based on the following meeting context, generate a detailed Product Requirement Document (PRD).\n\nContext:\n${meetingContext}` }]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: prdSchema
    }
  });

  return JSON.parse(response.text || "{}");
};

/**
 * Generate a Roadmap from meeting context
 */
export const generateRoadmap = async (meetingContext: string): Promise<Roadmap> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: {
      parts: [{ text: `Based on the following meeting context, suggest a product roadmap with Epics clustered into Now, Next, and Later.\n\nContext:\n${meetingContext}` }]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: roadmapSchema
    }
  });

  return JSON.parse(response.text || "{}");
};

/**
 * Generate a specific stakeholder email
 */
export const generateEmail = async (meetingContext: string, tone: 'Executive' | 'Team' | 'Investor'): Promise<string> => {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: {
      parts: [{ text: `Write a stakeholder update email based on this meeting.\n\nTone: ${tone}\n\nMeeting Context:\n${meetingContext}` }]
    },
    config: {
      // Plain text response for emails to allow flexible formatting
    }
  });

  return response.text || "Could not generate email.";
};

/**
 * Chat with the meeting (RAG-style)
 */
export const askMeetingQuestion = async (history: {role: string, content: string}[], meetingContext: string, question: string): Promise<string> => {
  // Construct a prompt that includes the context
  // We use the 'gemini-2.5-flash' for fast conversational turns
  
  const systemPrompt = `You are a helpful PM assistant. You have access to the transcript/notes of a specific meeting. Answer the user's question based ONLY on the provided context. If the answer isn't in the context, say so.
  
  MEETING CONTEXT:
  ${meetingContext}
  `;

  const chat = await ai.chats.create({
    model: "gemini-2.5-flash",
    config: {
      systemInstruction: systemPrompt
    },
    history: history.map(h => ({ role: h.role, parts: [{ text: h.content }] }))
  });

  const result = await chat.sendMessage({ message: question });
  return result.text;
};
