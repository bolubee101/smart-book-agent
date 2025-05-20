export const stripCodeBlock = (text: string): string => {
    return text
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/```$/, '')
        .trim();
};