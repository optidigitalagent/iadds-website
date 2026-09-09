import { handleConsultation } from '@/lib/consultation/handler';
export const runtime = 'nodejs';
export async function POST(request: Request) { return handleConsultation(request); }
