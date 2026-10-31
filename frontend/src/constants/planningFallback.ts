// Generated from the backend alex_family fixture so the prototype works offline.
// Regenerate after changing backend/data/personas.json.
import type { FamilyPicture, PlanOptions, GrowOverview } from '../services/api';

export const FALLBACK_PICTURE: FamilyPicture = {
  "success": true,
  "householdId": "alex_family",
  "cashflow": {
    "income": [
      {
        "owner": "primary",
        "name": "Alex Lim",
        "monthlyTakeHome": 4400
      },
      {
        "owner": "partner",
        "name": "Lila Tan",
        "monthlyTakeHome": 3840
      }
    ],
    "totalTakeHome": 8240,
    "commitments": [
      {
        "id": "rent",
        "label": "Rent until BTO keys",
        "category": "HOUSING",
        "monthlyAmount": 2000,
        "essential": true,
        "owner": "joint"
      },
      {
        "id": "infantcare",
        "label": "Infant care (after subsidy)",
        "category": "CHILDCARE",
        "monthlyAmount": 800,
        "essential": true,
        "owner": "joint"
      },
      {
        "id": "groceries",
        "label": "Groceries & household",
        "category": "LIVING",
        "monthlyAmount": 1400,
        "essential": true,
        "owner": "joint"
      },
      {
        "id": "transport",
        "label": "Transport",
        "category": "LIVING",
        "monthlyAmount": 450,
        "essential": true,
        "owner": "joint"
      },
      {
        "id": "insurance",
        "label": "Insurance premiums",
        "category": "INSURANCE",
        "monthlyAmount": 350,
        "essential": true,
        "owner": "joint"
      },
      {
        "id": "utilities",
        "label": "Utilities, phone & internet",
        "category": "LIVING",
        "monthlyAmount": 300,
        "essential": true,
        "owner": "joint"
      },
      {
        "id": "parents",
        "label": "Allowance to parents",
        "category": "FAMILY",
        "monthlyAmount": 600,
        "essential": true,
        "owner": "joint"
      },
      {
        "id": "rsp",
        "label": "RoboInvest regular savings plan",
        "category": "SAVINGS",
        "monthlyAmount": 300,
        "essential": false,
        "owner": "primary"
      },
      {
        "id": "lifestyle",
        "label": "Dining, lifestyle & subscriptions",
        "category": "LIFESTYLE",
        "monthlyAmount": 700,
        "essential": false,
        "owner": "joint"
      }
    ],
    "groups": [
      {
        "category": "LIVING",
        "label": "Everyday living",
        "monthlyAmount": 2150,
        "items": [
          {
            "id": "groceries",
            "label": "Groceries & household",
            "category": "LIVING",
            "monthlyAmount": 1400,
            "essential": true,
            "owner": "joint"
          },
          {
            "id": "transport",
            "label": "Transport",
            "category": "LIVING",
            "monthlyAmount": 450,
            "essential": true,
            "owner": "joint"
          },
          {
            "id": "utilities",
            "label": "Utilities, phone & internet",
            "category": "LIVING",
            "monthlyAmount": 300,
            "essential": true,
            "owner": "joint"
          }
        ]
      },
      {
        "category": "HOUSING",
        "label": "Housing",
        "monthlyAmount": 2000,
        "items": [
          {
            "id": "rent",
            "label": "Rent until BTO keys",
            "category": "HOUSING",
            "monthlyAmount": 2000,
            "essential": true,
            "owner": "joint"
          }
        ]
      },
      {
        "category": "CHILDCARE",
        "label": "Childcare",
        "monthlyAmount": 800,
        "items": [
          {
            "id": "infantcare",
            "label": "Infant care (after subsidy)",
            "category": "CHILDCARE",
            "monthlyAmount": 800,
            "essential": true,
            "owner": "joint"
          }
        ]
      },
      {
        "category": "LIFESTYLE",
        "label": "Lifestyle",
        "monthlyAmount": 700,
        "items": [
          {
            "id": "lifestyle",
            "label": "Dining, lifestyle & subscriptions",
            "category": "LIFESTYLE",
            "monthlyAmount": 700,
            "essential": false,
            "owner": "joint"
          }
        ]
      },
      {
        "category": "FAMILY",
        "label": "Family support",
        "monthlyAmount": 600,
        "items": [
          {
            "id": "parents",
            "label": "Allowance to parents",
            "category": "FAMILY",
            "monthlyAmount": 600,
            "essential": true,
            "owner": "joint"
          }
        ]
      },
      {
        "category": "INSURANCE",
        "label": "Insurance",
        "monthlyAmount": 350,
        "items": [
          {
            "id": "insurance",
            "label": "Insurance premiums",
            "category": "INSURANCE",
            "monthlyAmount": 350,
            "essential": true,
            "owner": "joint"
          }
        ]
      },
      {
        "category": "SAVINGS",
        "label": "Existing savings plans",
        "monthlyAmount": 300,
        "items": [
          {
            "id": "rsp",
            "label": "RoboInvest regular savings plan",
            "category": "SAVINGS",
            "monthlyAmount": 300,
            "essential": false,
            "owner": "primary"
          }
        ]
      }
    ],
    "totalCommitments": 6900,
    "essentialMonthly": 5900,
    "flexibleMonthly": 1000,
    "freeToPlan": 1340,
    "method": "Take-home pay from MyInfo, commitments from categorised OCBC transactions over 90 days"
  },
  "goals": [
    {
      "id": "goal_emergency",
      "key": "emergency",
      "routeKey": "emergency",
      "name": "Emergency buffer",
      "category": "EMERGENCY",
      "priority": 1,
      "targetAmount": 35400,
      "currentAmount": 28000,
      "shortfall": 7400,
      "deadline": "2028-05",
      "monthsRemaining": 18,
      "requiredMonthlyAllocation": 372,
      "annualRate": 0.015,
      "dependsOn": [],
      "basis": "6 months of essential spending (S$5,900/month)",
      "icon": "shield",
      "suggestedMonthlyAllocation": 310,
      "projectedCompletion": "2028-05",
      "status": "ON_TRACK",
      "support": []
    },
    {
      "id": "goal_housing",
      "key": "housing",
      "routeKey": "housing",
      "name": "BTO home purchase fund",
      "category": "HOUSING",
      "priority": 2,
      "targetAmount": 96000,
      "currentAmount": 80000,
      "shortfall": 16000,
      "deadline": "2028-09",
      "monthsRemaining": 22,
      "requiredMonthlyAllocation": 618,
      "annualRate": 0.015,
      "dependsOn": [
        "emergency"
      ],
      "basis": "Downpayment due at key collection (2028-09)",
      "icon": "home",
      "suggestedMonthlyAllocation": 618,
      "projectedCompletion": "2028-09",
      "status": "ON_TRACK",
      "support": [
        {
          "id": "climate_vouchers",
          "name": "Climate Friendly Households Programme",
          "agency": "National Environment Agency (NEA)",
          "goalKey": "housing",
          "fundType": "VOUCHER",
          "restricted": true,
          "status": "UPCOMING",
          "amount": 300,
          "reason": "Available to HDB households, so it applies after key collection (2028-09).",
          "action": "Claim at RedeemSG via Singpass",
          "nextDate": "2028-09"
        }
      ]
    },
    {
      "id": "goal_education",
      "key": "education",
      "routeKey": "education",
      "name": "Percy's education",
      "category": "EDUCATION",
      "priority": 3,
      "targetAmount": 80000,
      "currentAmount": 8000,
      "shortfall": 72000,
      "deadline": "2041-04",
      "monthsRemaining": 173,
      "requiredMonthlyAllocation": 267,
      "annualRate": 0.045,
      "dependsOn": [],
      "basis": "University and living costs by age 18; starts from the CDA balance, which moves to Edusave/PSEA for education use",
      "icon": "graduation-cap",
      "suggestedMonthlyAllocation": 267,
      "projectedCompletion": "2041-04",
      "status": "ON_TRACK",
      "support": [
        {
          "id": "cash_gift_percy",
          "name": "Baby Bonus Cash Gift (Percy)",
          "agency": "Ministry of Social and Family Development (MSF)",
          "goalKey": "education",
          "fundType": "CASH",
          "restricted": false,
          "status": "RECEIVING",
          "amount": 11000,
          "reason": "Paid to you in instalments until Percy is 6½. It is flexible cash, so you can choose to set it aside for education.",
          "action": "Check the remaining instalments on LifeSG and consider routing them to Percy's education goal.",
          "nextDate": "2029-10"
        },
        {
          "id": "cda_first_step_percy",
          "name": "CDA First Step Grant (Percy)",
          "agency": "Ministry of Social and Family Development (MSF)",
          "goalKey": "education",
          "fundType": "RESTRICTED_CDA",
          "restricted": true,
          "status": "RECEIVED",
          "amount": 5000,
          "reason": "Already in Percy's CDA and counted in the education goal's starting balance. CDA funds are restricted to approved childcare, preschool and healthcare uses.",
          "action": "No action needed.",
          "nextDate": null
        },
        {
          "id": "cda_matching_percy",
          "name": "CDA dollar-for-dollar matching (Percy)",
          "agency": "Ministry of Social and Family Development (MSF)",
          "goalKey": "education",
          "fundType": "RESTRICTED_CDA",
          "restricted": true,
          "status": "AVAILABLE",
          "amount": 2500,
          "reason": "S$1,500 of the S$4,000 matching cap is used. Each dollar you deposit is matched until the cap.",
          "action": "Deposit up to S$2,500 into Percy's OCBC CDA before 2035-12 to receive up to S$2,500 more.",
          "nextDate": "2035-12"
        }
      ]
    },
    {
      "id": "goal_retirement_primary",
      "key": "retirement_primary",
      "routeKey": "wealth",
      "name": "Alex's retirement",
      "category": "RETIREMENT",
      "priority": 4,
      "targetAmount": 200000,
      "currentAmount": 14200,
      "shortfall": 185800,
      "deadline": "2060-11",
      "monthsRemaining": 408,
      "requiredMonthlyAllocation": 141,
      "annualRate": 0.045,
      "dependsOn": [
        "housing"
      ],
      "basis": "Top-up beyond CPF LIFE payouts",
      "icon": "trending-up",
      "suggestedMonthlyAllocation": 51,
      "projectedCompletion": "2046-08",
      "status": "ON_TRACK",
      "support": []
    },
    {
      "id": "goal_retirement_partner",
      "key": "retirement_partner",
      "routeKey": "wealth",
      "name": "Lila's retirement",
      "category": "RETIREMENT",
      "priority": 4,
      "targetAmount": 200000,
      "currentAmount": 0,
      "shortfall": 200000,
      "deadline": "2062-11",
      "monthsRemaining": 432,
      "requiredMonthlyAllocation": 186,
      "annualRate": 0.045,
      "dependsOn": [
        "housing"
      ],
      "basis": "Top-up beyond CPF LIFE payouts",
      "icon": "trending-up",
      "suggestedMonthlyAllocation": 66,
      "projectedCompletion": "2046-01",
      "status": "ON_TRACK",
      "support": []
    }
  ],
  "fundingGap": 244,
  "totalRequiredMonthly": 1584,
  "support": {
    "totalGrantValue": 2800,
    "restrictedValue": 2800,
    "flexibleValue": 0,
    "upcomingDates": [
      {
        "grantId": "climate_vouchers",
        "name": "Climate Friendly Households Programme",
        "date": "2028-09"
      },
      {
        "grantId": "cash_gift_percy",
        "name": "Baby Bonus Cash Gift (Percy)",
        "date": "2029-10"
      },
      {
        "grantId": "cda_matching_percy",
        "name": "CDA dollar-for-dollar matching (Percy)",
        "date": "2035-12"
      }
    ],
    "notEligible": [
      {
        "id": "ehg_housing_grant",
        "name": "Enhanced CPF Housing Grant (EHG)",
        "agency": "HDB / CPF Board",
        "goalKey": "housing",
        "fundType": "CPF",
        "restricted": true,
        "status": "NOT_ELIGIBLE",
        "amount": 0,
        "reason": "Household income of S$10,300/month is above the S$9,000 ceiling.",
        "action": "No action needed; recheck if household income changes before the flat application.",
        "nextDate": null
      },
      {
        "id": "gst_voucher_cash_medisave",
        "name": "GST Voucher Scheme (Cash & MediSave)",
        "agency": "Ministry of Finance (MOF)",
        "goalKey": null,
        "fundType": "CASH",
        "restricted": false,
        "status": "NOT_ELIGIBLE",
        "amount": 0,
        "reason": "Assessable income of about S$66,000 is above the S$34,000 limit.",
        "action": "No action needed.",
        "nextDate": null
      }
    ],
    "disclaimer": "Estimates from published scheme rules and MyInfo data. Confirm with the agency before relying on them."
  },
  "findings": [
    "Funding every goal at once would need S$1,584/month, S$244 more than the S$1,340 surplus. Sequencing them, with retirement stepping up as earlier goals finish, keeps every deadline.",
    "BTO home purchase fund: S$16,000 still needed by 2028-09.",
    "Projected returns are assumptions, not guarantees."
  ]
};

export const FALLBACK_PLAN_OPTIONS: PlanOptions = {
  "success": true,
  "monthlySurplus": 1340,
  "protectionPremium": 28,
  "investable": 1312,
  "lumpSum": {
    "amount": 1100,
    "toGoal": "emergency",
    "reason": "Spare OCBC cash above the emergency fund and a month of working cash tops up the buffer today."
  },
  "recommendedPlanId": "balanced",
  "plans": [
    {
      "id": "balanced",
      "name": "Balanced",
      "tagline": "Every goal on time, retirement steps up as earlier goals finish",
      "routes": {
        "emergency": 310,
        "housing": 618,
        "education": 267,
        "wealth": 117
      },
      "unallocated": 0,
      "goals": [
        {
          "key": "emergency",
          "routeKey": "emergency",
          "name": "Emergency buffer",
          "targetAmount": 35400,
          "startingAmount": 29100,
          "deadline": "2028-05",
          "requiredMonthly": 372,
          "monthlyNow": 310,
          "completesBy": "2028-05",
          "projectedAtDeadline": 35401,
          "status": "ON_TRACK"
        },
        {
          "key": "housing",
          "routeKey": "housing",
          "name": "BTO home purchase fund",
          "targetAmount": 96000,
          "startingAmount": 80000,
          "deadline": "2028-09",
          "requiredMonthly": 618,
          "monthlyNow": 618,
          "completesBy": "2028-09",
          "projectedAtDeadline": 96005,
          "status": "ON_TRACK"
        },
        {
          "key": "education",
          "routeKey": "education",
          "name": "Percy's education",
          "targetAmount": 80000,
          "startingAmount": 8000,
          "deadline": "2041-04",
          "requiredMonthly": 267,
          "monthlyNow": 267,
          "completesBy": "2041-04",
          "projectedAtDeadline": 80138,
          "status": "ON_TRACK"
        },
        {
          "key": "retirement_primary",
          "routeKey": "wealth",
          "name": "Alex's retirement",
          "targetAmount": 200000,
          "startingAmount": 14200,
          "deadline": "2060-11",
          "requiredMonthly": 141,
          "monthlyNow": 51,
          "completesBy": "2046-08",
          "projectedAtDeadline": 380339,
          "status": "ON_TRACK"
        },
        {
          "key": "retirement_partner",
          "routeKey": "wealth",
          "name": "Lila's retirement",
          "targetAmount": 200000,
          "startingAmount": 0,
          "deadline": "2062-11",
          "requiredMonthly": 186,
          "monthlyNow": 66,
          "completesBy": "2046-01",
          "projectedAtDeadline": 428356,
          "status": "ON_TRACK"
        }
      ],
      "stepUps": [
        {
          "month": "2028-05",
          "fromGoal": "emergency",
          "amount": 310,
          "text": "Emergency buffer complete: S$310/month moves to retirement"
        },
        {
          "month": "2028-09",
          "fromGoal": "housing",
          "amount": 618,
          "text": "BTO home purchase fund complete: S$618/month moves to retirement"
        },
        {
          "month": "2041-04",
          "fromGoal": "education",
          "amount": 267,
          "text": "Percy's education complete: S$267/month moves to retirement"
        }
      ],
      "allOnTrack": true,
      "atRisk": [],
      "recommended": true,
      "tradeOffs": [
        "Retirement steps up as earlier goals finish: 2028-05, 2028-09, 2041-04."
      ]
    },
    {
      "id": "home_first",
      "name": "Home first",
      "tagline": "BTO fund finishes early with a cushion for renovation",
      "routes": {
        "emergency": 223,
        "housing": 711,
        "education": 267,
        "wealth": 111
      },
      "unallocated": 0,
      "goals": [
        {
          "key": "emergency",
          "routeKey": "emergency",
          "name": "Emergency buffer",
          "targetAmount": 35400,
          "startingAmount": 29100,
          "deadline": "2028-11",
          "requiredMonthly": 372,
          "monthlyNow": 223,
          "completesBy": "2028-11",
          "projectedAtDeadline": 35415,
          "status": "ON_TRACK"
        },
        {
          "key": "housing",
          "routeKey": "housing",
          "name": "BTO home purchase fund",
          "targetAmount": 96000,
          "startingAmount": 80000,
          "deadline": "2028-09",
          "requiredMonthly": 618,
          "monthlyNow": 711,
          "completesBy": "2028-07",
          "projectedAtDeadline": 96655,
          "status": "ON_TRACK"
        },
        {
          "key": "education",
          "routeKey": "education",
          "name": "Percy's education",
          "targetAmount": 80000,
          "startingAmount": 8000,
          "deadline": "2041-04",
          "requiredMonthly": 267,
          "monthlyNow": 267,
          "completesBy": "2041-04",
          "projectedAtDeadline": 80138,
          "status": "ON_TRACK"
        },
        {
          "key": "retirement_primary",
          "routeKey": "wealth",
          "name": "Alex's retirement",
          "targetAmount": 200000,
          "startingAmount": 14200,
          "deadline": "2060-11",
          "requiredMonthly": 141,
          "monthlyNow": 48,
          "completesBy": "2046-08",
          "projectedAtDeadline": 379561,
          "status": "ON_TRACK"
        },
        {
          "key": "retirement_partner",
          "routeKey": "wealth",
          "name": "Lila's retirement",
          "targetAmount": 200000,
          "startingAmount": 0,
          "deadline": "2062-11",
          "requiredMonthly": 186,
          "monthlyNow": 63,
          "completesBy": "2046-01",
          "projectedAtDeadline": 427336,
          "status": "ON_TRACK"
        }
      ],
      "stepUps": [
        {
          "month": "2028-07",
          "fromGoal": "housing",
          "amount": 711,
          "text": "BTO home purchase fund complete: S$711/month moves to retirement"
        },
        {
          "month": "2028-11",
          "fromGoal": "emergency",
          "amount": 223,
          "text": "Emergency buffer complete: S$223/month moves to retirement"
        },
        {
          "month": "2041-04",
          "fromGoal": "education",
          "amount": 267,
          "text": "Percy's education complete: S$267/month moves to retirement"
        }
      ],
      "allOnTrack": true,
      "atRisk": [],
      "recommended": false,
      "tradeOffs": [
        "Emergency buffer completes later (2028-11 vs 2028-05).",
        "BTO home purchase fund completes earlier (2028-07 vs 2028-09)."
      ]
    },
    {
      "id": "education_first",
      "name": "Education first",
      "tagline": "Front-loads education savings while time in the market is longest",
      "routes": {
        "emergency": 223,
        "housing": 618,
        "education": 401,
        "wealth": 70
      },
      "unallocated": 0,
      "goals": [
        {
          "key": "emergency",
          "routeKey": "emergency",
          "name": "Emergency buffer",
          "targetAmount": 35400,
          "startingAmount": 29100,
          "deadline": "2028-11",
          "requiredMonthly": 372,
          "monthlyNow": 223,
          "completesBy": "2028-11",
          "projectedAtDeadline": 35415,
          "status": "ON_TRACK"
        },
        {
          "key": "housing",
          "routeKey": "housing",
          "name": "BTO home purchase fund",
          "targetAmount": 96000,
          "startingAmount": 80000,
          "deadline": "2028-09",
          "requiredMonthly": 618,
          "monthlyNow": 618,
          "completesBy": "2028-09",
          "projectedAtDeadline": 96005,
          "status": "ON_TRACK"
        },
        {
          "key": "education",
          "routeKey": "education",
          "name": "Percy's education",
          "targetAmount": 80000,
          "startingAmount": 8000,
          "deadline": "2041-04",
          "requiredMonthly": 267,
          "monthlyNow": 401,
          "completesBy": "2037-09",
          "projectedAtDeadline": 94011,
          "status": "ON_TRACK"
        },
        {
          "key": "retirement_primary",
          "routeKey": "wealth",
          "name": "Alex's retirement",
          "targetAmount": 200000,
          "startingAmount": 14200,
          "deadline": "2060-11",
          "requiredMonthly": 141,
          "monthlyNow": 31,
          "completesBy": "2047-02",
          "projectedAtDeadline": 372531,
          "status": "ON_TRACK"
        },
        {
          "key": "retirement_partner",
          "routeKey": "wealth",
          "name": "Lila's retirement",
          "targetAmount": 200000,
          "startingAmount": 0,
          "deadline": "2062-11",
          "requiredMonthly": 186,
          "monthlyNow": 39,
          "completesBy": "2046-07",
          "projectedAtDeadline": 417836,
          "status": "ON_TRACK"
        }
      ],
      "stepUps": [
        {
          "month": "2028-09",
          "fromGoal": "housing",
          "amount": 618,
          "text": "BTO home purchase fund complete: S$618/month moves to retirement"
        },
        {
          "month": "2028-11",
          "fromGoal": "emergency",
          "amount": 223,
          "text": "Emergency buffer complete: S$223/month moves to retirement"
        },
        {
          "month": "2037-09",
          "fromGoal": "education",
          "amount": 401,
          "text": "Percy's education complete: S$401/month moves to retirement"
        }
      ],
      "allOnTrack": true,
      "atRisk": [],
      "recommended": false,
      "tradeOffs": [
        "Emergency buffer completes later (2028-11 vs 2028-05).",
        "Percy's education completes earlier (2037-09 vs 2041-04).",
        "Retirement starts with S$47/month less."
      ]
    }
  ]
};

export const FALLBACK_GROW: GrowOverview = {
  "success": true,
  "readiness": {
    "ready": true,
    "checks": [
      {
        "id": "floor",
        "label": "Emergency floor covers at least 3 months of essentials",
        "detail": "4.7 months today",
        "passed": true
      },
      {
        "id": "short_term",
        "label": "Short-term home goal stays in cash and on track",
        "detail": "BTO home purchase fund due 2028-09",
        "passed": true
      },
      {
        "id": "risk_profile",
        "label": "Risk profile on file",
        "detail": "BALANCED, reviewed 2026-06",
        "passed": true
      }
    ],
    "suggestions": [
      {
        "goalKey": "education",
        "goalName": "Percy's education",
        "monthlyAmount": 267,
        "product": "OCBC Blue Chip Investment Plan",
        "horizon": "2041-04"
      },
      {
        "goalKey": "retirement_primary",
        "goalName": "Alex's retirement",
        "monthlyAmount": 51,
        "product": "OCBC RoboInvest",
        "horizon": "2060-11"
      },
      {
        "goalKey": "retirement_partner",
        "goalName": "Lila's retirement",
        "monthlyAmount": 66,
        "product": "OCBC RoboInvest",
        "horizon": "2062-11"
      }
    ],
    "totalMonthly": 384,
    "handoff": {
      "label": "Continue in OCBC",
      "destination": "OCBC investment set-up",
      "note": "OCBC confirms suitability and your instructions before anything is invested."
    },
    "blockedReason": null
  },
  "advisory": {
    "recommended": true,
    "flags": [
      {
        "id": "bto",
        "label": "Upcoming BTO purchase and loan decisions"
      },
      {
        "id": "young_child",
        "label": "Young child with education goals"
      },
      {
        "id": "protection",
        "label": "S$160,000 protection gap"
      },
      {
        "id": "sequencing",
        "label": "Several goals that depend on each other"
      }
    ],
    "title": "Talk to an OCBC adviser",
    "reason": "Your plan has 4 moving parts an adviser can help you weigh together."
  }
};
