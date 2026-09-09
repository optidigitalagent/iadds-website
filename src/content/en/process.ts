import type { Step, FAQ } from '@/types/content';
import { resolveBrandText } from '../site/brand-text';
export const processSteps: Step[] = resolveBrandText([
  {
    "title": "Describe the objective",
    "body": "Share the business, selected direction and desired outcome."
  },
  {
    "title": "We prepare for the consultation",
    "body": "{{firstName}} reviews the brand, product, website, social channels and existing content and develops an initial idea."
  },
  {
    "title": "Discuss the idea in Google Meet",
    "body": "A 20–30 minute call to refine the objective and select the test format."
  },
  {
    "title": "Create the test videos",
    "body": "1–2 launch-ready test videos, usually within 1–2 business days after receiving the assets."
  },
  {
    "title": "Agree the full project",
    "body": "Define scope, deliverables, timeline, price and payment method."
  },
  {
    "title": "Produce the content",
    "body": "Share intermediate materials, collect feedback and make reasonable revisions within the agreed direction."
  },
  {
    "title": "Deliver and scale",
    "body": "Provide final files and expand into new versions, localisations, series or a custom AI system."
  }
], 'en');
export const previewSteps = processSteps;
export const commercialNotes: Step[] = [
  {
    "title": "The agreed result",
    "body": "We commit to the agreed scope, deliverables, timeline, price and quality criteria. Advertising performance also depends on the product, offer, audience, traffic and campaign setup."
  },
  {
    "title": "Reasonable revisions",
    "body": "We make reasonable revisions within the agreed concept, format and outcome. If the concept, scope or deliverable type changes, the updated terms are agreed separately."
  },
  {
    "title": "Content and permission",
    "body": "Content is created for the client. We do not publish, reuse or share client materials or the final result without separate permission. Any portfolio use is agreed in advance."
  }
];
export const processDetails = commercialNotes;
export const globalFaq: FAQ[] = resolveBrandText([
  {
    "question": "Do we need to understand AI to work with you?",
    "answer": "No. We explain the process in clear language, propose an appropriate approach and take care of the technical work."
  },
  {
    "question": "What happens during the consultation?",
    "answer": "{{firstName}} reviews your business in advance and comes to a 20–30 minute Google Meet with an initial idea. After the call, you receive a written summary."
  },
  {
    "question": "What exactly is free?",
    "answer": "For an agreed objective, we can create 1–2 complete advertising test videos. We define the format and scope before work begins."
  },
  {
    "question": "Do the test videos have a watermark?",
    "answer": "No. You receive the material in full quality without a watermark. Usage terms are agreed for the specific objective."
  },
  {
    "question": "How long does the test take?",
    "answer": "Usually 1–2 business days after we receive all the required materials."
  },
  {
    "question": "What do we need to provide?",
    "answer": "A website or social media link, available product photos or videos, a logo or brand assets, your idea or references and a short description of the objective."
  },
  {
    "question": "What if the first version needs changes?",
    "answer": "We discuss what did not work and adjust the direction within the agreed test. An additional version may be possible after reviewing the result together."
  },
  {
    "question": "Can you create content from start to finish?",
    "answer": "Yes. We can handle analysis, the idea, scripting, AI production, editing, graphics, voice, adaptations and localisation. Publishing, advertising launch and performance analysis can be added by agreement."
  },
  {
    "question": "Can you build a system so we can generate content ourselves?",
    "answer": "Yes. It can be a Telegram bot, website, separate software interface or automated workflow."
  },
  {
    "question": "How is the price determined?",
    "answer": "Simple assets have a starting price per unit. Videos, series and AI systems are estimated after defining the format, duration, volume and complexity."
  },
  {
    "question": "How can we pay?",
    "answer": "The payment structure is agreed individually. Card transfer and USDT are currently available."
  },
  {
    "question": "Do you publish client work?",
    "answer": "Only with separate permission. Without consent, we do not use client materials or add the work to our portfolio."
  },
  {
    "question": "What do you guarantee?",
    "answer": "The agreed scope, deliverables, timeline, price and quality criteria. Advertising results also depend on the product, offer, audience and traffic."
  }
], 'en');
