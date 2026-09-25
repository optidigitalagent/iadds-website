import { NfcError, object, type NfcLead } from './contract.ts';

export type Selection = { variant: 'standard' | 'branded' | 'bulk' | 'consultation' | 'instagram'; quantity: '1' | '2' | 'more' };
export type Quote = { currency: 'UAH'; status: 'fixed' | 'custom'; amount: number | null; deposit: 200; depositIncluded: true } |
  { currency: 'UAH'; status: 'fixed' | 'consultation'; quantity: number; unitPrice: number | null; amount: number | null;
    deposit: 200 | null; balance: number | null; unitPriceKopecks: number | null; amountKopecks: number | null;
    depositKopecks: number | null; balanceKopecks: number | null; depositIncluded: boolean };
// Accepted Review prices v11 and Instagram ready offer v18: totals include the deposit.
const prices = { 'review-card': { 1: 1500, 2: 2600 }, 'branded-review-card': { 1: 2000, 2: 3600 }, 'nfc-instagram-card': { 1: 1500, 2: 2600 } };
export function parseSelection(value: unknown, product: string, quantity: number): Selection | undefined {
  if (value === undefined) {
    if (product === 'nfc-instagram-card') throw new NfcError(422, 'invalid_selection');
    return;
  }
  const selection = object(value, ['variant', 'quantity']);
  const { variant, quantity: count } = selection;
  if (!['standard', 'branded', 'bulk', 'consultation', 'instagram'].includes(String(variant)) || !['1', '2', 'more'].includes(String(count)) ||
      (variant === 'instagram' && count === 'more') ||
      (variant === 'bulk' && count !== 'more') || product !== (variant === 'instagram' ? 'nfc-instagram-card' : variant === 'branded' ? 'branded-review-card' : 'review-card') ||
      quantity !== (count === 'more' ? 3 : Number(count))) throw new NfcError(422, 'invalid_selection');
  return { variant, quantity: count } as Selection;
}
export function quote(lead: NfcLead): Quote {
  if (lead.product === 'review-card-3d') {
    if (!lead.review3d || !Number.isSafeInteger(lead.quantity) || lead.quantity < 1 || lead.quantity > 10000) throw new NfcError(422, 'invalid_review_3d');
    const quantity = lead.quantity, unitPrice = 4000, amount = quantity * unitPrice;
    return { currency: 'UAH', status: 'fixed', quantity, unitPrice, amount, deposit: 200, balance: amount - 200,
      unitPriceKopecks: unitPrice * 100, amountKopecks: amount * 100, depositKopecks: 20000,
      balanceKopecks: (amount - 200) * 100, depositIncluded: true };
  }
  if (lead.product === 'nfc-menu-card') {
    if (!lead.menu) throw new NfcError(422, 'invalid_menu');
    if (lead.menu.intent === 'menu_consultation') return { currency: 'UAH', status: 'consultation', quantity: 0, unitPrice: null,
      amount: null, deposit: null, balance: null, unitPriceKopecks: null, amountKopecks: null,
      depositKopecks: null, balanceKopecks: null, depositIncluded: false };
    const quantity = lead.quantity;
    const unitPrice = quantity >= 25 ? 500 : quantity >= 10 ? 600 : quantity >= 5 ? 750 : 1000;
    const amount = quantity * unitPrice;
    return { currency: 'UAH', status: 'fixed', quantity, unitPrice, amount, deposit: 200, balance: amount - 200,
      unitPriceKopecks: unitPrice * 100, amountKopecks: amount * 100, depositKopecks: 20000,
      balanceKopecks: (amount - 200) * 100, depositIncluded: true };
  }
  if (lead.product === 'nfc-instagram-card' && (![1, 2].includes(lead.quantity) || lead.selection?.variant !== 'instagram')) throw new NfcError(422, 'invalid_selection');
  const custom = lead.quantity > 2 || ['bulk', 'consultation'].includes(lead.selection?.variant || '');
  return { currency: 'UAH', status: custom ? 'custom' : 'fixed',
    amount: custom ? null : prices[lead.product][lead.quantity as 1 | 2], deposit: 200, depositIncluded: true };
}
