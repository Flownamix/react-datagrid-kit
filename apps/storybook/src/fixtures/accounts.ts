export type AccountStatus = "active" | "review" | "blocked";

export interface AccountRow {
  id: string;
  name: string;
  segment: string;
  owner: string;
  region: string;
  status: AccountStatus;
  pipeline: number;
  risk: number;
  lastActivity: string;
}

export const accounts: AccountRow[] = [
  {
    id: "acc-001",
    name: "Acme Finance Holdings",
    segment: "Financial services",
    owner: "Nandi Mokoena",
    region: "Gauteng",
    status: "active",
    pipeline: 1250000,
    risk: 12,
    lastActivity: "2026-05-30"
  },
  {
    id: "acc-002",
    name: "Northwind Logistics",
    segment: "Transport",
    owner: "Karel Botha",
    region: "Western Cape",
    status: "review",
    pipeline: 640000,
    risk: 34,
    lastActivity: "2026-05-28"
  },
  {
    id: "acc-003",
    name: "Blue Crane Retail Group",
    segment: "Retail",
    owner: "Aisha Khan",
    region: "KwaZulu-Natal",
    status: "active",
    pipeline: 880000,
    risk: 18,
    lastActivity: "2026-05-31"
  },
  {
    id: "acc-004",
    name: "HelioGrid Energy",
    segment: "Energy",
    owner: "Pieter van Zyl",
    region: "Eastern Cape",
    status: "blocked",
    pipeline: 2100000,
    risk: 71,
    lastActivity: "2026-05-21"
  },
  {
    id: "acc-005",
    name: "Meridian Health Systems",
    segment: "Healthcare",
    owner: "Thabo Dlamini",
    region: "Gauteng",
    status: "review",
    pipeline: 920000,
    risk: 41,
    lastActivity: "2026-05-25"
  },
  {
    id: "acc-006",
    name: "Umoya Manufacturing",
    segment: "Industrial",
    owner: "Lerato Molefe",
    region: "Free State",
    status: "active",
    pipeline: 430000,
    risk: 9,
    lastActivity: "2026-05-29"
  }
];

export function currency(value: number): string {
  return new Intl.NumberFormat("en-ZA", {
    currency: "ZAR",
    maximumFractionDigits: 0,
    style: "currency"
  }).format(value);
}
