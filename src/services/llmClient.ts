import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

interface LlmMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

interface LlmResponse {
    content: string;
}

export const callLlmApi = async (messages: LlmMessage[]): Promise<LlmResponse> => {
    const isOpenAI = process.env.LLM_PROVIDER === 'openai';

    const payload = {
        model: isOpenAI ? 'gpt-4o' : 'deepseek-r1:1.5b',
        messages,
        stream: false
    };

    const url = isOpenAI
        ? 'https://api.openai.com/v1/chat/completions'
        : 'http://localhost:11434/api/chat';

    const headers = {
        'Content-Type': 'application/json',
        ...(isOpenAI && { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` })
    };

    const response = await axios.post(url, payload, { headers });

    const content = isOpenAI
        ? response.data.choices[0].message.content
        : response.data.message.content;

    return { content };
};
