import dotenv from 'dotenv';
import { OpenAI } from 'openai';
import axios from 'axios';

dotenv.config();

export interface LlmMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}


interface LlmResponse {
    content: string;
}

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export const callLlmApi = async (messages: LlmMessage[]): Promise<LlmResponse> => {
    const isOpenAI = process.env.LLM_PROVIDER === 'openai';

    if (isOpenAI) {
        const chatCompletion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages,
            stream: false,
        });

        return {
            content: chatCompletion.choices[0]?.message?.content || '',
        };
    } else {
        const response = await axios.post('http://localhost:11434/api/chat', {
            model: 'deepseek-r1:1.5b',
            messages,
            stream: false,
        }, {
            headers: {
                'Content-Type': 'application/json',
            },
        });

        return {
            content: response.data.message?.content || '',
        };
    }
};
