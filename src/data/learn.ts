// Learn content for P0/P1 only (PLAN C16): Stocks vs funds, Help FAQs, readiness questions.
// No 60-second cards (P2).

export const STOCKS_VS_FUNDS = {
  title: 'Stocks vs funds',
  bullets: [
    'A stock is a part of one company. If that company struggles, your money falls with it.',
    'A fund spreads your money over many companies, so one bad company hurts less.',
    'Most people start with funds and add stocks later, in small amounts they can afford to lose.',
  ],
} as const;

export const HELP_FAQS: { q: string; a: string }[] = [
  {
    q: 'Is this real money?',
    a: 'No. This is a prototype. Payments, KYC and prices are all simulated with sample data.',
  },
  {
    q: 'Can I skip or pause my SIP?',
    a: 'Yes. Skip any month for free, or pause for 1 to 3 months. Your plan stays alive.',
  },
  {
    q: 'What happens to my money if I stop a SIP?',
    a: 'Stopping only ends future payments. Your units stay invested until you withdraw them.',
  },
  {
    q: 'How do I get my money back?',
    a: 'Open the holding and tap Withdraw. Money usually reaches your bank in 1–3 working days.',
  },
  {
    q: 'Why does the app ask about my income and savings?',
    a: 'Your answers shape the starter shortlist, so it fits your money and time frame. It is not investment advice.',
  },
];

export type ReadinessQuestion = {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

export const READINESS_QUESTIONS: ReadinessQuestion[] = [
  {
    id: 'one_company',
    question: 'You put ₹2,000 into one company’s shares. What could happen?',
    options: ['It can only go up', 'It can fall a lot, even to near zero', 'The app returns my money if it falls'],
    correctIndex: 1,
    explanation: 'A single company can fall sharply. Nobody refunds the loss.',
  },
  {
    id: 'limit_order',
    question: 'What does a limit order do?',
    options: ['Buys right now at any price', 'Buys only at your price or lower', 'Limits how much you can lose'],
    correctIndex: 1,
    explanation: 'A limit order waits for your price. It may not fill at all.',
  },
  {
    id: 'budget',
    question: 'How much of your money should go into single stocks when starting?',
    options: ['Everything, for faster growth', 'A small part you can afford to lose', 'Whatever a friend suggests'],
    correctIndex: 1,
    explanation: 'Keep stocks to a small, self-set share of your money.',
  },
  {
    id: 'tips',
    question: 'A group promises “guaranteed 30% a month”. What is it most likely?',
    options: ['A great opportunity', 'A red flag', 'Normal for stocks'],
    correctIndex: 1,
    explanation: 'Nobody can guarantee stock returns. Guarantees are a classic red flag.',
  },
  {
    id: 'fno',
    question: 'What is true about F&O for new investors?',
    options: ['Most lose money', 'It is the safest way to start', 'It needs no extra money'],
    correctIndex: 0,
    explanation: 'Most individual F&O traders lose money. This prototype does not offer it.',
  },
];
