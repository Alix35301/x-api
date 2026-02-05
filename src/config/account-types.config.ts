export const ACCOUNT_TYPES = [
  { value: 'SAVING', label: 'Saving' },
  { value: 'CURRENT', label: 'Current' },
  { value: 'CREDIT_CARD', label: 'Credit Card' },
  { value: 'OTHER', label: 'Other' },
] as const;

export type AccountTypeValue = (typeof ACCOUNT_TYPES)[number]['value'];

export const ACCOUNT_TYPE_VALUES = ACCOUNT_TYPES.map((t) => t.value);
