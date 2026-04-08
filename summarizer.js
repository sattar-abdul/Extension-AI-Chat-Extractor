// Summarizer - AI-powered conversation summarization

const GEMINI_API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

function getSummarizationPrompt(conversationData) {
  const conversationText = conversationData.conversation
    .map((msg, idx) => {
      const role = msg.r ? (msg.r === 'u' ? 'USER' : 'ASSISTANT') : msg.role.toUpperCase();
      const content = msg.c || msg.content;
      return `[${idx + 1}] ${role}: ${content}`;
    })
    .join('\n\n');
  
  return `You are an analysis expert AI system designed to convert conversations into structured knowledge. Extract context from the given conversation.

CONVERSATION:
${conversationText}

Given a conversation segment, extract the following:

- metadata (domain, task type, participants)
- user_intent (what does the user want)
- key_claims (important factual or conceptual statements)
- constraints (limitations, requirements, also includes rejected decisions and their reasons)
- open_questions (questions and topics that still need discussion)
- definitions (extract conversation-specific definitions, fact-like statements that were agreed upon or asserted without dispute)
- conclusions (final decisions and results of the conversations)
- next_steps (steps yet to be executed)
- condensed_conversations(very short 1-2 sentence summary of what did the message include)

Return ONLY valid JSON (no markdown, no explanation):

{
  "metadata": {},
  "user_intent": {},
  "key_claims": [],
  "conclusions": [],
  "constraints": [],
  "open_questions": [],
  "definitions": {}
  "next_steps": ["Step 1", "Step 2"],
  "condensed_conversation": [{"turn": 1, "speaker": "user", "key_point": "..."}]
}

Keep it concise and ordered, but include all important information needed to further continue conversation`;
}

async function summarizeWithGemini(conversationData, apiKey) {
  if (!apiKey) throw new Error('API key required');

  const prompt = getSummarizationPrompt(conversationData);
  
  const requestBody = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.1,
      topK: 20,
      topP: 0.8,
      maxOutputTokens: 3048,
    },
    safetySettings: [
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
    ]
  };

  const response = await fetch(`${GEMINI_API_ENDPOINT}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Gemini API error: ${errorData.error?.message || response.statusText}`);
  }

  const data = await response.json();
  const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!generatedText) throw new Error('No response from Gemini');

  let jsonText = generatedText.trim()
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();
  
  const firstBrace = jsonText.indexOf('{');
  const lastBrace = jsonText.lastIndexOf('}');
  
  if (firstBrace === -1 || lastBrace === -1) {
    throw new Error('No valid JSON found');
  }
  
  jsonText = jsonText.substring(firstBrace, lastBrace + 1);
  
  let summary;
  try {
    summary = JSON.parse(jsonText);
  } catch (parseError) {
    throw new Error(`Failed to parse JSON: ${parseError.message}`);
  }
  
  const originalSize = JSON.stringify(conversationData).length;
  const summarySize = JSON.stringify(summary).length;
  const ratio = ((1 - summarySize / originalSize) * 100).toFixed(1);
  
  return {
    summary_metadata: {
      original_platform: conversationData.metadata.platform,
      original_url: conversationData.metadata.url,
      original_message_count: conversationData.metadata.messageCount,
      summarized_at: new Date().toISOString(),
      compression_ratio: `${ratio}% smaller`
    },
    ...summary
  };
}

function generateContinuationPrompt(summary) {
  const sections = [];
  
  sections.push(`I'm continuing a conversation from ${summary.summary_metadata.original_platform}. Here's the context:\n`);
  sections.push(`**Goal:** ${summary.goal}\n`);
  sections.push(`**Current Stage:** ${summary.stage} (${summary.progress_percent}% complete)\n`);
  
  if (summary.completed && summary.completed.length > 0) {
    sections.push(`**What's Been Completed:**\n${summary.completed.map(item => `- ${item}`).join('\n')}\n`);
  }
  
  if (summary.key_decisions && summary.key_decisions.length > 0) {
    sections.push(`**Key Decisions Made:**\n${summary.key_decisions.map(d => `- ${d.question} → ${d.choice} (${d.reason})`).join('\n')}\n`);
  }
  
  if (summary.technical_details && summary.technical_details.length > 0) {
    sections.push(`**Technical Details:**\n${summary.technical_details.map(item => `- ${item}`).join('\n')}\n`);
  }
  
  if (summary.current_blockers && summary.current_blockers.length > 0) {
    sections.push(`**Current Blockers:**\n${summary.current_blockers.map(b => `- ${b}`).join('\n')}\n`);
  }
  
  if (summary.next_steps && summary.next_steps.length > 0) {
    sections.push(`**Next Steps:**\n${summary.next_steps.map((step, i) => `${i + 1}. ${step}`).join('\n')}\n`);
  }
  
  sections.push(`---\n\nReady to continue. My question is: `);
  
  return sections.join('\n');
}
