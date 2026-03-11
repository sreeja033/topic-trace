import { GoogleGenAI, Type, Modality } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateSubjectSyllabus(subjectName: string) {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Generate a structured syllabus and revision plan for a B.Tech student studying "${subjectName}". 
    Provide 5 key topics. For each topic, provide a brief summary (notes), 3 important questions, and 2 related concepts to search for.`,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          topics: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING, description: 'A unique slug for the topic' },
                title: { type: Type.STRING, description: 'The title of the topic' },
                summary: { type: Type.STRING, description: 'Brief revision notes for the topic' },
                importantQuestions: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: '3 important questions related to the topic',
                },
                relatedConcepts: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: '2 related concepts or keywords to search for',
                },
              },
              required: ['id', 'title', 'summary', 'importantQuestions', 'relatedConcepts'],
            },
          },
        },
        required: ['topics'],
      },
    },
  });

  const text = response.text;
  if (!text) throw new Error('Failed to generate syllabus');
  return JSON.parse(text) as {
    topics: {
      id: string;
      title: string;
      summary: string;
      importantQuestions: string[];
      relatedConcepts: string[];
    }[];
  };
}

export async function generateSingleTopic(subjectName: string, topicTitle: string) {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Generate revision material for the topic "${topicTitle}" in the subject "${subjectName}" for a B.Tech student.
    Provide a brief summary (notes), 3 important questions, and 2 related concepts to search for.`,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: 'A unique slug for the topic' },
          title: { type: Type.STRING, description: 'The title of the topic' },
          summary: { type: Type.STRING, description: 'Brief revision notes for the topic' },
          importantQuestions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: '3 important questions related to the topic',
          },
          relatedConcepts: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: '2 related concepts or keywords to search for',
          },
        },
        required: ['id', 'title', 'summary', 'importantQuestions', 'relatedConcepts'],
      },
    },
  });

  const text = response.text;
  if (!text) throw new Error('Failed to generate topic');
  return JSON.parse(text) as {
    id: string;
    title: string;
    summary: string;
    importantQuestions: string[];
    relatedConcepts: string[];
  };
}

export async function generateQuiz(subjectName: string, topicTitle: string) {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Generate a 3-question multiple choice quiz for the topic "${topicTitle}" in the subject "${subjectName}" for a B.Tech student.`,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          questions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: '4 possible answers',
                },
                correctAnswerIndex: { type: Type.INTEGER, description: '0-based index of the correct option' },
                explanation: { type: Type.STRING, description: 'Explanation of why the answer is correct' },
              },
              required: ['question', 'options', 'correctAnswerIndex', 'explanation'],
            },
          },
        },
        required: ['questions'],
      },
    },
  });

  const text = response.text;
  if (!text) throw new Error('Failed to generate quiz');
  return JSON.parse(text) as {
    questions: {
      question: string;
      options: string[];
      correctAnswerIndex: number;
      explanation: string;
    }[];
  };
}

export async function askQuestionStream(subjectName: string, topicTitle: string, question: string, useSearch: boolean = false, studentContext: string = "") {
  const contextString = studentContext ? `\n\nStudent Progress Context:\n${studentContext}\nUse this context to personalize your feedback, refer to their past quiz scores, or relate new concepts to topics they have already completed.` : "";

  if (useSearch) {
    const response = await ai.models.generateContentStream({
      model: 'gemini-3-flash-preview',
      contents: `You are an expert tutor for B.Tech students. 
      Context: Subject is "${subjectName}", Topic is "${topicTitle}".${contextString}
      Student asks: "${question}"
      
      Provide a clear, concise, and accurate answer suitable for a B.Tech student. Use markdown for formatting if necessary. Search the web for the most up-to-date information.`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });
    return response;
  } else {
    const response = await ai.models.generateContentStream({
      model: 'gemini-3.1-pro-preview',
      contents: `You are an expert tutor for B.Tech students. 
      Context: Subject is "${subjectName}", Topic is "${topicTitle}".${contextString}
      Student asks: "${question}"
      
      Provide a clear, concise, and accurate answer suitable for a B.Tech student. Use markdown for formatting if necessary.`,
    });
    return response;
  }
}

export async function askQuestion(subjectName: string, topicTitle: string, question: string, useSearch: boolean = false) {
  if (useSearch) {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are an expert tutor for B.Tech students. 
      Context: Subject is "${subjectName}", Topic is "${topicTitle}".
      Student asks: "${question}"
      
      Provide a clear, concise, and accurate answer suitable for a B.Tech student. Use markdown for formatting if necessary. Search the web for the most up-to-date information.`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    let answer = response.text || 'Sorry, I could not generate an answer.';
    
    // Extract URLs
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks && chunks.length > 0) {
      answer += '\n\n**Sources:**\n';
      chunks.forEach((chunk: any) => {
        if (chunk.web?.uri && chunk.web?.title) {
          answer += `- [${chunk.web.title}](${chunk.web.uri})\n`;
        }
      });
    }
    return answer;
  } else {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: `You are an expert tutor for B.Tech students. 
      Context: Subject is "${subjectName}", Topic is "${topicTitle}".
      Student asks: "${question}"
      
      Provide a clear, concise, and accurate answer suitable for a B.Tech student. Use markdown for formatting if necessary.`,
    });

    return response.text || 'Sorry, I could not generate an answer.';
  }
}

export async function generateLastMinuteRevision(subjectName: string, topicTitles: string[]) {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Create a "Last Minute Revision" cheat sheet for the B.Tech subject "${subjectName}".
    Cover the following topics: ${topicTitles.join(', ')}.
    
    Format the output in Markdown. Include:
    - Key formulas or definitions.
    - Important bullet points for each topic.
    - Common pitfalls or things to remember.
    Make it highly condensed and easy to scan before an exam.`,
  });

  return response.text || 'Failed to generate last minute revision.';
}

export async function searchTopicUpdates(subjectName: string, topicTitle: string) {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Find the latest news, updates, or recent advancements related to "${topicTitle}" in the context of "${subjectName}". 
    Provide a brief summary of the most interesting recent developments. Format in Markdown.`,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  let answer = response.text || 'No recent updates found.';
  
  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  if (chunks && chunks.length > 0) {
    answer += '\n\n**Sources:**\n';
    chunks.forEach((chunk: any) => {
      if (chunk.web?.uri && chunk.web?.title) {
        answer += `- [${chunk.web.title}](${chunk.web.uri})\n`;
      }
    });
  }
  return answer;
}

export async function generateFlashcards(subjectName: string, topicTitle: string) {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Generate 5 flashcards for the topic "${topicTitle}" in the subject "${subjectName}" for a B.Tech student. Focus on key terms, definitions, and important concepts.`,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          flashcards: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                front: { type: Type.STRING, description: 'The term or question on the front of the flashcard' },
                back: { type: Type.STRING, description: 'The definition or answer on the back of the flashcard' },
              },
              required: ['id', 'front', 'back'],
            },
          },
        },
        required: ['flashcards'],
      },
    },
  });

  const text = response.text;
  if (!text) throw new Error('Failed to generate flashcards');
  return JSON.parse(text) as {
    flashcards: {
      id: string;
      front: string;
      back: string;
    }[];
  };
}

export async function generateExplanationFromFile(subjectName: string, topicTitle: string, base64Data: string, mimeType: string) {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType,
          }
        },
        {
          text: `Analyze this document/image. Instead of a Q&A format, provide a comprehensive but simple and easy-to-understand explanation of the topic "${topicTitle}" and its core concepts based on the content of this file. Break down complex ideas into simple terms so that anyone can understand it. Format the explanation clearly in Markdown.`
        }
      ]
    }
  });
  return response.text || 'Failed to generate explanation from file.';
}

export async function generateAudio(text: string) {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Puck' },
        },
      },
    },
  });
  const inlineData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;
  return inlineData ? { data: inlineData.data, mimeType: inlineData.mimeType } : null;
}

export async function generateAnalogy(subjectName: string, topicTitle: string) {
  const response = await ai.models.generateContent({
    model: 'gemini-3.1-pro-preview',
    contents: `Explain the topic "${topicTitle}" in the subject "${subjectName}" using a highly creative, real-world analogy. Keep it under 3 paragraphs. Format in Markdown.`,
  });
  return response.text || 'Failed to generate analogy.';
}

export async function roastAnswer(subjectName: string, topicTitle: string, studentAnswer: string) {
  const response = await ai.models.generateContent({
    model: 'gemini-3.1-pro-preview',
    contents: `You are a strict, sarcastic, but ultimately helpful B.Tech professor. 
    The subject is "${subjectName}" and the topic is "${topicTitle}".
    The student has provided the following answer/code:
    "${studentAnswer}"
    
    Roast their answer. Point out the flaws in a funny, sarcastic way, but then actually explain what the correct answer should be so they learn from it. Format in Markdown.`,
  });
  return response.text || 'Failed to roast answer.';
}

export async function generateMindMap(subjectName: string, topics: string[]) {
  const response = await ai.models.generateContent({
    model: 'gemini-3.1-pro-preview',
    contents: `Create a Mermaid.js mindmap (using 'mindmap' syntax) for the subject "${subjectName}" and its topics: ${topics.join(', ')}. 
    Include 2-3 sub-nodes for each topic representing key concepts.
    Return ONLY the raw Mermaid code block, without any markdown formatting like \`\`\`mermaid. Just the raw text starting with 'mindmap'.
    Example format:
    mindmap
      root(("${subjectName}"))
        ${topics[0] || 'Topic 1'}
          Concept A
          Concept B
    `,
  });
  return response.text?.replace(/```mermaid/g, '').replace(/```/g, '').trim() || '';
}

