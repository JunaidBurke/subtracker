export const PARSE_RECEIPT_PROMPT = `Extract subscription details from this receipt/screenshot.
Return ONLY valid JSON, no markdown or code blocks: { "name": string, "amount": number, "currency": string, "billing_cycle": "weekly"|"monthly"|"yearly", "category": string, "next_renewal": "YYYY-MM-DD" | null }
If a field cannot be determined, use null. For category, use one of: streaming, dev-tools, productivity, entertainment, cloud, finance, health, education, other.`

export function costAdvisorPrompt(subscriptions: string): string {
  return `Analyze these active subscriptions and identify:
1. Overlapping or duplicate services
2. Potentially unused subscriptions (high cost, niche category)
3. Cheaper alternatives for well-known services

Subscriptions:
${subscriptions}

Return ONLY valid JSON array, no markdown: [{ "title": string, "body": string, "type": "optimization", "related_names": string[] }]
If no issues found, return an empty array [].`
}

export function nlQueryPrompt(context: string, question: string): string {
  return `You are a subscription tracking assistant. Answer based on this data:

${context}

User question: ${question}

Be concise and conversational. Include specific numbers when relevant. If you can't answer from the data, say so.`
}

export function forecastPrompt(
  subscriptions: string,
  priceHistory: string
): string {
  return `Analyze these subscriptions and their price history for anomalies or trends:

Subscriptions:
${subscriptions}

Price History:
${priceHistory}

Flag any unusual price increases or patterns. Return ONLY valid JSON:
{ "anomalies": [{ "subscription_name": string, "detail": string }], "summary": string }
If no anomalies, return { "anomalies": [], "summary": "No anomalies detected." }`
}
