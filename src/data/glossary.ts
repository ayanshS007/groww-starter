// Glossary (README 7.3 plus PLAN item 40). One-line meaning + everyday analogy.
import type { GlossaryTerm } from '../state/types';

export const GLOSSARY: GlossaryTerm[] = [
  {
    id: 'sip',
    term: 'SIP',
    meaning: 'A Systematic Investment Plan: you put in a fixed amount, say ₹500, automatically every month.',
    analogy: 'Like a monthly phone recharge, but the money stays yours and can grow.',
  },
  {
    id: 'nav',
    term: 'NAV',
    meaning: 'Net Asset Value: the price of one unit of a fund on a given day.',
    analogy: 'Like the price tag on one slice of a shared pizza.',
  },
  {
    id: 'average-nav',
    term: 'Average NAV',
    meaning: 'The average price you paid per unit across all your purchases.',
    analogy: 'Like the average price per litre after filling petrol on different days.',
  },
  {
    id: 'units',
    term: 'Units',
    meaning: 'The pieces of a fund you own. Money ÷ NAV = units.',
    analogy: 'Like the number of pizza slices you bought.',
  },
  {
    id: 'mutual-fund',
    term: 'Mutual fund',
    meaning: 'A pool of money from many people, invested together by a fund house.',
    analogy: 'Like friends chipping in for a big order and splitting it fairly.',
  },
  {
    id: 'expense-ratio',
    term: 'Expense ratio',
    meaning: 'The yearly fee a fund takes, as a % of your money in it.',
    analogy: 'Like a small yearly maintenance charge on a gym membership.',
  },
  {
    id: 'exit-load',
    term: 'Exit load',
    meaning: 'A fee some funds charge if you withdraw before a set time.',
    analogy: 'Like a fee for cancelling a booking too early.',
  },
  {
    id: 'lump-sum',
    term: 'One-time (lump sum)',
    meaning: 'Investing a single amount once, instead of every month.',
    analogy: 'Like paying a year’s subscription upfront instead of monthly.',
  },
  {
    id: 'redemption',
    term: 'Redemption',
    meaning: 'Selling your fund units to get money back. In this app we call it Withdraw.',
    analogy: 'Like cashing in a gift card.',
  },
  {
    id: 'index',
    term: 'Index',
    meaning: 'A list of companies used to measure how a part of the market is doing.',
    analogy: 'Like a class average that sums up how everyone did.',
  },
  {
    id: 'nifty-50',
    term: 'Nifty 50',
    meaning: 'An index of 50 of the largest companies listed in India.',
    analogy: 'Like a top-50 playlist that changes as songs rise and fall.',
  },
  {
    id: 'equity',
    term: 'Equity',
    meaning: 'Shares in companies. You own a small part of the business.',
    analogy: 'Like owning a few bricks of a building.',
  },
  {
    id: 'debt-fund',
    term: 'Debt fund',
    meaning: 'A fund that lends money to companies or the government and earns interest.',
    analogy: 'Like lending to a reliable friend who pays you back with a little extra.',
  },
  {
    id: 'liquid-fund',
    term: 'Liquid fund',
    meaning: 'A very steady fund for money you may need soon. Withdrawals are quick.',
    analogy: 'Like a savings jar on the shelf, easy to reach.',
  },
  {
    id: 'hybrid-fund',
    term: 'Hybrid fund',
    meaning: 'A fund that mixes shares and bonds to smooth out the ride.',
    analogy: 'Like a thali: a bit of everything so no single dish dominates.',
  },
  {
    id: 'volatility',
    term: 'Volatility',
    meaning: 'How much and how often a price moves up and down.',
    analogy: 'Like a bumpy road versus a smooth highway.',
  },
  {
    id: 'kyc',
    term: 'KYC',
    meaning: 'Know Your Customer: a one-time ID check every investment app has to do.',
    analogy: 'Like showing ID once to open a bank account.',
  },
  {
    id: 'upi-autopay',
    term: 'UPI autopay',
    meaning: 'Your OK for your bank to pay your SIP by UPI each month.',
    analogy: 'Like auto-renew on a subscription, which you can cancel any time.',
  },
  {
    id: 'mandate',
    term: 'Mandate',
    meaning: 'Your one-time approval for automatic payments up to a set limit.',
    analogy: 'Like giving a standing instruction to your bank.',
  },
  {
    id: 'step-up',
    term: 'Step-up',
    meaning: 'Raising your SIP amount automatically once a year, here by 10%.',
    analogy: 'Like a yearly raise for your future self.',
  },
  {
    id: 'cushion',
    term: 'Cushion',
    meaning: 'Money kept aside for surprises, usually about 3 months of income.',
    analogy: 'Like a spare tyre: you hope not to need it, but you’re glad it’s there.',
  },
  {
    id: 'stocks-vs-funds',
    term: 'Stocks vs funds',
    meaning: 'A stock is one company. A fund holds many, so one bad company hurts less.',
    analogy: 'Like betting on one player versus backing the whole team.',
  },
  {
    id: 'delivery-vs-intraday',
    term: 'Delivery vs intraday',
    meaning: 'Delivery means you keep the shares. Intraday means buying and selling the same day.',
    analogy: 'Like buying a bike to ride versus flipping it the same afternoon.',
  },
  {
    id: 'market-order',
    term: 'Market order',
    meaning: 'Buy at whatever the current price is, right away.',
    analogy: 'Like buying at the price on the shelf today.',
  },
  {
    id: 'limit-order',
    term: 'Limit order',
    meaning: 'Buy only if the price is at or below the price you set.',
    analogy: 'Like telling a shop to call you if the price drops to your budget.',
  },
  {
    id: 'f-and-o',
    term: 'F&O',
    meaning: 'Futures and options: bets on where prices will go, often with borrowed money.',
    analogy: 'Like betting on a match score rather than supporting a team. Most people lose.',
  },
  {
    id: 'xirr',
    term: 'XIRR',
    meaning: 'Your yearly return when money went in at different times, as with a SIP.',
    analogy: 'Like an average speed for a trip with many stops.',
  },
];

const BY_ID = new Map(GLOSSARY.map((t) => [t.id, t]));

export function getTerm(id: string): GlossaryTerm | undefined {
  return BY_ID.get(id);
}
