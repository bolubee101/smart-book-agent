import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

export const sendToMakeWebhook = async (data: any): Promise<void> => {
    const webhookUrl = process.env.MAKE_WEBHOOK_URL;

    if (!webhookUrl) {
        console.warn('No Make.com webhook URL configured.');
        return;
    }

    try {
        await axios.post(webhookUrl, data, {
            headers: { 'Content-Type': 'application/json' }
        });
        console.log('Data sent to Make.com webhook.');
    } catch (error) {
        console.error('Failed to send data to Make.com webhook:', error);
    }
};
