export interface Customer {
  id: string;
  name: string;
  phone: string;
  pakAccount: string;
  totalTransactions: number;
  totalBuy: number;
  totalSell: number;
  debt: number;
  createdAt: string;
}

export interface Transaction {
  id: string;
  type: "buy" | "sell";
  customer: string;
  customerId: string;
  currency: string;
  amount: number;
  rate: number;
  totalToman: number;
  receivedAmount?: number;
  destinationAccount?: string;
  profit: number;
  employee: string;
  description: string;
  date: string;
  time: string;
}

export interface CurrencyRate {
  id: string;
  currency: string;
  buyRate: number;
  sellRate: number;
  lastChangedBy: string;
  lastChangedAt: string;
  history: RateHistoryEntry[];
}

export interface RateHistoryEntry {
  oldBuy: number;
  newBuy: number;
  oldSell: number;
  newSell: number;
  changedBy: string;
  date: string;
}

export interface CashRegister {
  id: string;
  name: string;
  type: "toman" | "rupee";
  balance: number;
  entries: CashEntry[];
}

export interface CashEntry {
  id: string;
  type: "in" | "out";
  amount: number;
  description: string;
  date: string;
}

export interface Expense {
  id: string;
  category: string;
  amount: number;
  description: string;
  date: string;
  employee: string;
}

export const employees = ["سارا احمدی", "امیر حسینی", "نیلوفر رستمی", "حسن عباسی"];

export const currencyNames: Record<string, string> = {
  USD: "دلار",
  EUR: "یورو",
  PKR: "روپیه پاکستان",
  GBP: "پوند",
  AED: "درهم",
  TRY: "لیر",
};

export const customers: Customer[] = [
  { id: "c1", name: "احمد محمدی", phone: "09121234567", pakAccount: "PK-1234", totalTransactions: 45, totalBuy: 2500000000, totalSell: 1800000000, debt: 150000000, createdAt: "۱۴۰۳/۰۱/۱۵" },
  { id: "c2", name: "علی رضایی", phone: "09139876543", pakAccount: "PK-5678", totalTransactions: 32, totalBuy: 1200000000, totalSell: 900000000, debt: 0, createdAt: "۱۴۰۳/۰۲/۱۰" },
  { id: "c3", name: "فاطمه کریمی", phone: "09011112222", pakAccount: "PK-9012", totalTransactions: 18, totalBuy: 800000000, totalSell: 600000000, debt: 50000000, createdAt: "۱۴۰۳/۰۳/۰۵" },
  { id: "c4", name: "حسن عباسی", phone: "09223334444", pakAccount: "PK-3456", totalTransactions: 67, totalBuy: 4000000000, totalSell: 3500000000, debt: 0, createdAt: "۱۴۰۲/۱۱/۲۰" },
  { id: "c5", name: "زهرا نوری", phone: "09335556666", pakAccount: "PK-7890", totalTransactions: 12, totalBuy: 600000000, totalSell: 450000000, debt: 20000000, createdAt: "۱۴۰۳/۰۴/۰۱" },
];

export const transactions: Transaction[] = [
  { id: "t1", type: "sell", customer: "احمد محمدی", customerId: "c1", currency: "PKR", amount: 5000000, rate: 320, totalToman: 1600000000, profit: 45000000, employee: "سارا احمدی", description: "فروش روپیه", date: "۱۴۰۳/۰۴/۱۵", time: "۱۴:۳۰" },
  { id: "t2", type: "buy", customer: "علی رضایی", customerId: "c2", currency: "PKR", amount: 3000000, rate: 295, totalToman: 885000000, profit: 30000000, employee: "امیر حسینی", description: "خرید روپیه", date: "۱۴۰۳/۰۴/۱۵", time: "۱۳:۴۵" },
  { id: "t3", type: "sell", customer: "فاطمه کریمی", customerId: "c3", currency: "PKR", amount: 2000000, rate: 318, totalToman: 636000000, profit: 18000000, employee: "نیلوفر رستمی", description: "فروش روپیه به مشتری جدید", date: "۱۴۰۳/۰۴/۱۵", time: "۱۲:۱۵" },
  { id: "t4", type: "buy", customer: "حسن عباسی", customerId: "c4", currency: "PKR", amount: 10000000, rate: 290, totalToman: 2900000000, profit: 65000000, employee: "سارا احمدی", description: "خرید عمده روپیه", date: "۱۴۰۳/۰۴/۱۵", time: "۱۱:۰۰" },
  { id: "t5", type: "sell", customer: "احمد محمدی", customerId: "c1", currency: "PKR", amount: 1500000, rate: 322, totalToman: 483000000, profit: 12000000, employee: "امیر حسینی", description: "فروش روپیه", date: "۱۴۰۳/۰۴/۱۴", time: "۱۶:۰۰" },
  { id: "t6", type: "buy", customer: "زهرا نوری", customerId: "c5", currency: "PKR", amount: 800000, rate: 292, totalToman: 233600000, profit: 8000000, employee: "نیلوفر رستمی", description: "خرید روپیه", date: "۱۴۰۳/۰۴/۱۴", time: "۱۵:۳۰" },
  { id: "t7", type: "sell", customer: "حسن عباسی", customerId: "c4", currency: "PKR", amount: 8000000, rate: 325, totalToman: 2600000000, profit: 80000000, employee: "سارا احمدی", description: "فروش عمده روپیه", date: "۱۴۰۳/۰۴/۱۴", time: "۱۴:۰۰" },
  { id: "t8", type: "buy", customer: "علی رضایی", customerId: "c2", currency: "PKR", amount: 4500000, rate: 293, totalToman: 1318500000, profit: 35000000, employee: "امیر حسینی", description: "خرید روپیه", date: "۱۴۰۳/۰۴/۱۳", time: "۱۳:۰۰" },
];

export const currencyRates: CurrencyRate[] = [
  {
    id: "r1", currency: "PKR", buyRate: 295, sellRate: 320, lastChangedBy: "امیر حسینی", lastChangedAt: "۱۴:۰۰",
    history: [
      { oldBuy: 290, newBuy: 295, oldSell: 315, newSell: 320, changedBy: "امیر حسینی", date: "۱۴:۰۰ - ۱۵/۰۴" },
      { oldBuy: 285, newBuy: 290, oldSell: 310, newSell: 315, changedBy: "سارا احمدی", date: "۱۱:۳۰ - ۱۵/۰۴" },
      { oldBuy: 290, newBuy: 285, oldSell: 318, newSell: 310, changedBy: "امیر حسینی", date: "۰۹:۰۰ - ۱۴/۰۴" },
    ],
  },
];

export const cashRegisters: CashRegister[] = [
  {
    id: "cr1", name: "صندوق تومان", type: "toman", balance: 2450000000,
    entries: [
      { id: "ce1", type: "in", amount: 1600000000, description: "فروش روپیه - احمد محمدی", date: "۱۴:۳۰" },
      { id: "ce2", type: "out", amount: 885000000, description: "خرید روپیه - علی رضایی", date: "۱۳:۴۵" },
      { id: "ce3", type: "in", amount: 636000000, description: "فروش روپیه - فاطمه کریمی", date: "۱۲:۱۵" },
      { id: "ce4", type: "out", amount: 2900000000, description: "خرید روپیه - حسن عباسی", date: "۱۱:۰۰" },
      { id: "ce5", type: "in", amount: 483000000, description: "فروش روپیه - احمد محمدی", date: "دیروز ۱۶:۰۰" },
    ],
  },
  {
    id: "cr2", name: "صندوق روپیه", type: "rupee", balance: 12800000,
    entries: [
      { id: "ce6", type: "out", amount: 5000000, description: "فروش - احمد محمدی", date: "۱۴:۳۰" },
      { id: "ce7", type: "in", amount: 3000000, description: "خرید - علی رضایی", date: "۱۳:۴۵" },
      { id: "ce8", type: "out", amount: 2000000, description: "فروش - فاطمه کریمی", date: "۱۲:۱۵" },
      { id: "ce9", type: "in", amount: 10000000, description: "خرید - حسن عباسی", date: "۱۱:۰۰" },
    ],
  },
];

export const expenses: Expense[] = [
  { id: "ex1", category: "حقوق", amount: 150000000, description: "حقوق اردیبهشت کارکنان", date: "۱۴۰۳/۰۲/۳۱", employee: "مدیریت" },
  { id: "ex2", category: "اجاره", amount: 45000000, description: "اجاره ماهانه دفتر", date: "۱۴۰۳/۰۲/۰۱", employee: "مدیریت" },
  { id: "ex3", category: "حمل پول", amount: 8000000, description: "هزینه حمل پول نقد", date: "۱۴۰۳/۰۳/۱۰", employee: "امیر حسینی" },
  { id: "ex4", category: "اینترنت", amount: 2500000, description: "هزینه اینترنت ماهانه", date: "۱۴۰۳/۰۳/۰۵", employee: "مدیریت" },
  { id: "ex5", category: "کارمزد", amount: 25000000, description: "کارمزد خدمات صرافی", date: "۱۴۰۳/۰۴/۱۰", employee: "نیلوفر رستمی" },
  { id: "ex6", category: "خدمات جانبی", amount: 12000000, description: "درآمد خدمات جانبی", date: "۱۴۰۳/۰۴/۰۵", employee: "سارا احمدی" },
];
