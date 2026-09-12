import { NfcError, object, type NfcLead } from './contract.ts';

export type Selection = { variant: 'standard' | 'branded' | 'bulk' | 'consultation'; quantity: '1' | '2' | 'more' };
export type Quote = { currency: 'UAH'; status: 'fixed' | 'custom'; amount: number | null; deposit: 200; depositIncluded: true };
// Accepted NFC commerce.json v11: total price, including the deposit.
const prices = { 'review-card': { 1: 1500, 2: 2600 }, 'branded-review-card': { 1: 2000, 2: 3600 } };
export function parseSelection(value: unknown, product: string, quantity: number): Selection | undefined {
  if (value === undefined) return;
  const selection = object(value, ['variant', 'quantity']);
  const { variant, quantity: count } = selection;
  if (!['standard', 'branded', 'bulk', 'consultation'].includes(String(variant)) || !['1', '2', 'more'].includes(String(count)) ||
      (variant === 'bulk' && count !== 'more') || product !== (variant === 'branded' ? 'branded-review-card' : 'review-card') ||
      quantity !== (count === 'more' ? 3 : Number(count))) throw new NfcError(422, 'invalid_selection');
  return { variant, quantity: count } as Selection;
}
export function quote(lead: NfcLead): Quote {
  const custom = lead.quantity > 2 || ['bulk', 'consultation'].includes(lead.selection?.variant || '');
  return { currency: 'UAH', status: custom ? 'custom' : 'fixed',
    amount: custom ? null : prices[lead.product][lead.quantity as 1 | 2], deposit: 200, depositIncluded: true };
}
