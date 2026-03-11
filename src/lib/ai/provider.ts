export interface AIProvider {
  analyzeText(prompt: string): Promise<string>
  analyzeImage(imageBase64: string, prompt: string): Promise<string>
}

export function getAIProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER || 'claude'
  switch (provider) {
    case 'claude': {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { ClaudeProvider } = require('./claude') as {
        ClaudeProvider: new () => AIProvider
      }
      return new ClaudeProvider()
    }
    default:
      throw new Error(`Unknown AI provider: ${provider}`)
  }
}
