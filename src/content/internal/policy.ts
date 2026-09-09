/** Internal implementation data. Never import into public content or client components. */
export const internalPolicy = {
  test: {
    publicVideoCount: [1, 2], feedbackAfterFirst: true,
    thirdIteration: 'Only after discussion and the founder’s decision; never unconditional.',
    qualification: 'Real commercial objectives and B2B; no unlimited production or training.',
    usage: 'Confirm commercial usage rights in writing for each specific test before launch.',
  },
  estimates: {
    productVisual: [5, 30], adVariation: [5, 30], shortLocalisation: [10, 30],
    shortVideo: [15, 50], ugc: [15, 50], presenter: [15, 50],
    complexWork: 'custom', aiSystemDevelopment: [50, 1500], ongoingInfrastructure: [50, 300],
    currency: 'USD', systemRangesPublic: false,
  },
  publication: {
    case: ['official name verified', 'client permission and date', '2–3 approved real outputs', 'real public URL', 'verified attributed client review', 'complete UK/EN content'],
    privateFounderContext: 'Do not publish exact birth year, family finances, or unsupported credentials.',
    legal: 'Do not claim contracts, invoices, legal registration or an office until supplied.',
    proof: 'Do not imply equipment brands or the hockey team are clients or partners.',
  },
} as const;
