import Anthropic from '@anthropic-ai/sdk'
import type { AIProvider } from './provider'

export class ClaudeProvider implements AIProvider {
  private client: Anthropic

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required')
    }
    this.client = new Anthropic({ apiKey })
  }

  async analyzeText(prompt: string): Promise<string> {
    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })
    const block = response.content[0]
    if (block.type !== 'text') {
      throw new Error('Unexpected response type')
    }
    return block.text
  }

  async analyzeImage(imageBase64: string, prompt: string): Promise<string> {
    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/png',
                data: imageBase64,
              },
            },
            { type: 'text', text: prompt },
          ],
        },
      ],
    })
    const block = response.content[0]
    if (block.type !== 'text') {
      throw new Error('Unexpected response type')
    }
    return block.text
  }
}
