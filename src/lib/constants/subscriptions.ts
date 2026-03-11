export const DEFAULT_CATEGORY_OPTIONS = [
  { label: 'Streaming', value: 'streaming' },
  { label: 'Music', value: 'music' },
  { label: 'Productivity', value: 'productivity' },
  { label: 'Cloud', value: 'cloud' },
  { label: 'Gaming', value: 'gaming' },
  { label: 'Fitness', value: 'fitness' },
  { label: 'News', value: 'news' },
  { label: 'Entertainment', value: 'entertainment' },
  { label: 'Finance', value: 'finance' },
  { label: 'Health', value: 'health' },
  { label: 'Education', value: 'education' },
  { label: 'Dev Tools', value: 'dev-tools' },
  { label: 'Other', value: 'other' },
] as const

export const DEFAULT_CATEGORIES = DEFAULT_CATEGORY_OPTIONS.map(
  ({ value }) => value
)
