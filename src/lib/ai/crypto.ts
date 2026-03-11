import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto'

const ENCRYPTION_ENV_NAME = 'AI_CREDENTIAL_ENCRYPTION_KEY'

export class MissingAIConfigError extends Error {
  constructor(envName: string) {
    super(`${envName} environment variable is required`)
    this.name = 'MissingAIConfigError'
  }
}

function getEncryptionKey() {
  const secret = process.env[ENCRYPTION_ENV_NAME]
  if (!secret) {
    throw new MissingAIConfigError(ENCRYPTION_ENV_NAME)
  }

  return createHash('sha256').update(secret).digest()
}

export function encryptSecret(value: string) {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', getEncryptionKey(), iv)
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()

  return Buffer.concat([iv, authTag, encrypted]).toString('base64')
}

export function decryptSecret(payload: string) {
  const buffer = Buffer.from(payload, 'base64')
  const iv = buffer.subarray(0, 12)
  const authTag = buffer.subarray(12, 28)
  const encrypted = buffer.subarray(28)
  const decipher = createDecipheriv('aes-256-gcm', getEncryptionKey(), iv)
  decipher.setAuthTag(authTag)

  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8')
}

export function getSecretHint(secret: string) {
  const trimmed = secret.trim()
  if (trimmed.length <= 8) {
    return 'Saved'
  }

  return `${trimmed.slice(0, 4)}...${trimmed.slice(-4)}`
}
