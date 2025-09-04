import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { keywords } = await request.json();

    const prompt = `
      Act as a professional branding expert. Generate 5 unique, brandable business name ideas based on these keywords: ${keywords}.
      The names should be short, easy to remember, and spell. Return only the names, one per line.
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful branding expert that generates concise, brandable business names.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 100,
    });

    const generatedText = response.choices[0]?.message?.content;

    if (!generatedText) {
      throw new Error('Failed to generate names');
    }

    // Split the text by new lines to get an array of names
    const names = generatedText.split('\n')
      .filter(name => name.trim() !== '')
      .map(name => name.replace(/^\d+\.\s*/, '').trim()); // Remove numbering if present

    return NextResponse.json({ names });
  } catch (error) {
    console.error('Error with OpenAI API:', error);
    return NextResponse.json({ error: 'Failed to generate names' }, { status: 500 });
  }
}