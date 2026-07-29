import {
  Send,
  ArrowDownToLine,
  Coins,
  BanknoteIcon,
} from "lucide-react";

export type OrderTypeEnum = "IR_TO_PK" | "PK_TO_IR" | "BUY_PKR" | "SELL_PKR";

export interface Direction {
  id: "toman-to-pkr" | "pkr-to-toman";
  label: string;
  sub: string;
  color: string;
  icon: typeof Send;
}

export interface SubType {
  id: OrderTypeEnum;
  label: string;
  desc: string;
  color: string;
}

export interface OrderTypeInfo {
  label: string;
  short: string;
  color: string;
  bg: string;
}

export const DIRECTIONS: Direction[] = [
  {
    id: "toman-to-pkr",
    label: "تومان به روپیه",
    sub: "پرداخت تومان، دریافت روپیه",
    color: "bg-green-50 text-green-600",
    icon: Send,
  },
  {
    id: "pkr-to-toman",
    label: "روپیه به تومان",
    sub: "پرداخت روپیه، دریافت تومان",
    color: "bg-blue-50 text-blue-600",
    icon: ArrowDownToLine,
  },
];

export const SUB_TYPES: Record<string, SubType[]> = {
  "toman-to-pkr": [
    {
      id: "IR_TO_PK",
      label: "ارسال پول به پاکستان",
      desc: "تومان پرداخت می‌کنید، ما به حساب مقصد در پاکستان روپیه واریز می‌کنیم.",
      color: "bg-green-600",
    },
    {
      id: "SELL_PKR",
      label: "فروش روپیه",
      desc: "تومان دریافت می‌کنید و روپیه به مشتری تحویل می‌دهید.",
      color: "bg-amber-600",
    },
  ],
  "pkr-to-toman": [
    {
      id: "PK_TO_IR",
      label: "ارسال پول به ایران",
      desc: "روپیه دریافت می‌کنیم و معادل آن را به حساب بانکی ایران واریز می‌کنیم.",
      color: "bg-blue-600",
    },
    {
      id: "BUY_PKR",
      label: "خرید روپیه",
      desc: "روپیه از مشتری می‌خریم و تومان پرداخت می‌کنیم.",
      color: "bg-violet-600",
    },
  ],
};

export const ORDER_TYPE_LABELS: Record<string, OrderTypeInfo> = {
  IR_TO_PK: {
    label: "ارسال پول به پاکستان",
    short: "پاکستان",
    color: "text-green-600",
    bg: "bg-green-50 text-green-600",
  },
  PK_TO_IR: {
    label: "ارسال پول به ایران",
    short: "ایران",
    color: "text-blue-600",
    bg: "bg-blue-50 text-blue-600",
  },
  BUY_PKR: {
    label: "خرید روپیه",
    short: "خرید",
    color: "text-violet-600",
    bg: "bg-violet-50 text-violet-600",
  },
  SELL_PKR: {
    label: "فروش روپیه",
    short: "فروش",
    color: "text-amber-600",
    bg: "bg-amber-50 text-amber-600",
  },
};

export const STATUS_LABELS: Record<string, string> = {
  IN_PROGRESS: "در حال انجام",
  COMPLETED: "تکمیل شده",
  CANCELLED: "لغو شده",
};

export const STATUS_COLORS: Record<string, string> = {
  IN_PROGRESS: "bg-yellow-50 text-yellow-600",
  COMPLETED: "bg-green-50 text-green-600",
  CANCELLED: "bg-red-50 text-red-600",
};

export const METHOD_LABELS: Record<string, string> = {
  EASYPAISA: "Easypaisa",
  JAZZCASH: "JazzCash",
  BANK_TRANSFER: "حواله بانکی",
  CASH: "نقدی",
  HAWALA: "حواله",
};

export const ICON_MAP: Record<string, typeof Send> = {
  IR_TO_PK: Send,
  PK_TO_IR: ArrowDownToLine,
  BUY_PKR: BanknoteIcon,
  SELL_PKR: Coins,
};

export function isHawalaType(orderType: string): boolean {
  return orderType === "IR_TO_PK" || orderType === "PK_TO_IR";
}

export function isTomanAmountType(orderType: string): boolean {
  return orderType === "IR_TO_PK" || orderType === "SELL_PKR";
}
