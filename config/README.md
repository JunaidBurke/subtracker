# AI Provider Config

The settings UI reads providers and models from `config/ai-providers.json`.

To add or change providers:

1. Add or edit a provider entry in `config/ai-providers.json`
2. Add the matching API key env var to `.env.local`
3. Restart the Next.js dev server

For OpenAI-compatible providers, set:

- `protocol` to `openai-compatible`
- `api_base_url` to the provider's `/v1`-style base URL
- `env_key` to the server env var that stores the API key

Each provider must have at least one model. The first model becomes the default for that provider.
