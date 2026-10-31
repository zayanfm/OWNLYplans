// Generated from the backend alex_family fixture so the prototype works offline.
// Captured after Alex shares his account and Lila accepts. The picture is captured before goals
// are confirmed; plan options and grow after confirming the suggestions.
// Regenerate after changing backend/data/personas.json or the goal suggestions.
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
        ],
        "benchmark": {
          "amount": 2643,
          "label": "food, transport, and information and communication",
          "source": "SingStat average monthly household expenditure, 2023"
        }
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
        ],
        "benchmark": {
          "amount": 2122,
          "label": "housing and related",
          "source": "SingStat average monthly household expenditure, 2023"
        }
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
        ],
        "benchmark": {
          "amount": 404,
          "label": "education",
          "source": "SingStat average monthly household expenditure, 2023"
        }
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
        ],
        "benchmark": {
          "amount": 455,
          "label": "recreation, sport and culture, and clothing",
          "source": "SingStat average monthly household expenditure, 2023"
        }
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
        ],
        "benchmark": null
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
        ],
        "benchmark": null
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
        ],
        "benchmark": null
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
      "inputStatus": "NEEDS_DECISION",
      "planned": false,
      "source": "Suggested: 3–6 months of essential spending is a common guideline. Choose what lets you sleep at night.",
      "input": {
        "key": "emergency",
        "type": "EMERGENCY",
        "owner": "household",
        "enabled": true,
        "months": 6,
        "withinMonths": 18,
        "source": "Suggested: 3–6 months of essential spending is a common guideline. Choose what lets you sleep at night.",
        "suggested": {
          "key": "emergency",
          "type": "EMERGENCY",
          "owner": "household",
          "enabled": true,
          "months": 6,
          "withinMonths": 18,
          "source": "Suggested: 3–6 months of essential spending is a common guideline. Choose what lets you sleep at night."
        },
        "status": "NEEDS_DECISION"
      },
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
      "basis": "6 months of essential spending (S$5,900/month), built within 18 months",
      "icon": "shield",
      "suggestedMonthlyAllocation": 0,
      "projectedCompletion": null,
      "status": "NEEDS_DECISION",
      "support": []
    },
    {
      "inputStatus": "NEEDS_DECISION",
      "planned": false,
      "source": "From your HDB booking (MyInfo): downpayment and key collection date. Edit if your purchase plan differs.",
      "input": {
        "key": "housing",
        "type": "HOUSING",
        "owner": "household",
        "enabled": true,
        "amount": 96000,
        "dueDate": "2028-09",
        "source": "From your HDB booking (MyInfo): downpayment and key collection date. Edit if your purchase plan differs.",
        "suggested": {
          "key": "housing",
          "type": "HOUSING",
          "owner": "household",
          "enabled": true,
          "amount": 96000,
          "dueDate": "2028-09",
          "source": "From your HDB booking (MyInfo): downpayment and key collection date. Edit if your purchase plan differs."
        },
        "status": "NEEDS_DECISION"
      },
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
      "basis": "Downpayment due 2028-09",
      "icon": "home",
      "suggestedMonthlyAllocation": 0,
      "projectedCompletion": null,
      "status": "NEEDS_DECISION",
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
      "inputStatus": "NEEDS_DECISION",
      "planned": false,
      "source": "Suggested: local university tuition S$10,000–12,000 a year (CNA, 2024). Start year is your choice.",
      "input": {
        "key": "education",
        "type": "EDUCATION",
        "owner": "household",
        "enabled": true,
        "childName": "Percy Lim",
        "childIndex": 0,
        "path": "UNIVERSITY",
        "startYear": 2042,
        "years": 4,
        "annualCost": 11000,
        "source": "Suggested: local university tuition S$10,000–12,000 a year (CNA, 2024). Start year is your choice.",
        "suggested": {
          "key": "education",
          "type": "EDUCATION",
          "owner": "household",
          "enabled": true,
          "childName": "Percy Lim",
          "childIndex": 0,
          "path": "UNIVERSITY",
          "startYear": 2042,
          "years": 4,
          "annualCost": 11000,
          "source": "Suggested: local university tuition S$10,000–12,000 a year (CNA, 2024). Start year is your choice."
        },
        "status": "NEEDS_DECISION"
      },
      "id": "goal_education",
      "key": "education",
      "routeKey": "education",
      "name": "Percy's education",
      "category": "EDUCATION",
      "priority": 3,
      "targetAmount": 44000,
      "currentAmount": 8000,
      "shortfall": 36000,
      "deadline": "2042-08",
      "monthsRemaining": 189,
      "requiredMonthlyAllocation": 102,
      "annualRate": 0.045,
      "dependsOn": [],
      "basis": "University from 2042: 4 years at S$11,000 a year (today's prices); starts from the CDA balance",
      "icon": "graduation-cap",
      "suggestedMonthlyAllocation": 0,
      "projectedCompletion": null,
      "status": "NEEDS_DECISION",
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
      "inputStatus": "NEEDS_DECISION",
      "planned": false,
      "source": "Suggested: savings on top of CPF LIFE payouts, which start from age 65. Only Alex can confirm this goal.",
      "input": {
        "key": "retirement_primary",
        "type": "RETIREMENT",
        "owner": "primary",
        "enabled": true,
        "adultName": "Alex Lim",
        "retireAge": 65,
        "amount": 200000,
        "source": "Suggested: savings on top of CPF LIFE payouts, which start from age 65. Only Alex can confirm this goal.",
        "suggested": {
          "key": "retirement_primary",
          "type": "RETIREMENT",
          "owner": "primary",
          "enabled": true,
          "adultName": "Alex Lim",
          "retireAge": 65,
          "amount": 200000,
          "source": "Suggested: savings on top of CPF LIFE payouts, which start from age 65. Only Alex can confirm this goal."
        },
        "status": "NEEDS_DECISION"
      },
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
      "basis": "Savings on top of CPF LIFE by age 65",
      "icon": "trending-up",
      "suggestedMonthlyAllocation": 0,
      "projectedCompletion": null,
      "status": "NEEDS_DECISION",
      "support": []
    },
    {
      "inputStatus": "CONFIRMED",
      "planned": true,
      "source": "Suggested: savings on top of CPF LIFE payouts, which start from age 65. Only Lila can confirm this goal.",
      "input": {
        "key": "retirement_partner",
        "type": "RETIREMENT",
        "owner": "partner",
        "enabled": true,
        "adultName": "Lila Tan",
        "retireAge": 65,
        "amount": 200000,
        "source": "Suggested: savings on top of CPF LIFE payouts, which start from age 65. Only Lila can confirm this goal.",
        "suggested": {
          "key": "retirement_partner",
          "type": "RETIREMENT",
          "owner": "partner",
          "enabled": true,
          "adultName": "Lila Tan",
          "retireAge": 65,
          "amount": 200000,
          "source": "Suggested: savings on top of CPF LIFE payouts, which start from age 65. Only Lila can confirm this goal."
        },
        "confirmed": true,
        "confirmedBy": "partner",
        "status": "CONFIRMED"
      },
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
      "basis": "Savings on top of CPF LIFE by age 65",
      "icon": "trending-up",
      "suggestedMonthlyAllocation": 1312,
      "projectedCompletion": "2036-12",
      "status": "ON_TRACK",
      "support": []
    }
  ],
  "fundingGap": 0,
  "totalRequiredMonthly": 186,
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
    "All goals can be funded on time from the S$1,340 monthly surplus.",
    "BTO home purchase fund: S$16,000 still needed by 2028-09.",
    "4 goal(s) need your decision before they are planned.",
    "Projected returns are assumptions, not guarantees."
  ]
};

export const FALLBACK_PLAN_OPTIONS: PlanOptions = {
  "success": true,
  "monthlySurplus": 1340,
  "protectionPremium": 28,
  "investable": 1312,
  "lumpSum": null,
  "recommendedPlanId": "balanced",
  "needsDecision": [],
  "plans": [
    {
      "id": "balanced",
      "name": "Balanced",
      "tagline": "Every goal on time, retirement steps up as earlier goals finish",
      "routes": {
        "emergency": 372,
        "housing": 618,
        "education": 102,
        "custom": 0,
        "wealth": 220
      },
      "unallocated": 0,
      "goals": [
        {
          "key": "emergency",
          "routeKey": "emergency",
          "name": "Emergency buffer",
          "targetAmount": 35400,
          "startingAmount": 28000,
          "deadline": "2028-05",
          "requiredMonthly": 372,
          "monthlyNow": 372,
          "completesBy": "2028-05",
          "projectedAtDeadline": 35404,
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
          "targetAmount": 44000,
          "startingAmount": 8000,
          "deadline": "2042-08",
          "requiredMonthly": 102,
          "monthlyNow": 102,
          "completesBy": "2042-08",
          "projectedAtDeadline": 44212,
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
          "monthlyNow": 95,
          "completesBy": "2045-05",
          "projectedAtDeadline": 405220,
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
          "monthlyNow": 125,
          "completesBy": "2044-08",
          "projectedAtDeadline": 455278,
          "status": "ON_TRACK"
        }
      ],
      "stepUps": [
        {
          "month": "2028-05",
          "fromGoal": "emergency",
          "amount": 372,
          "text": "Emergency buffer complete: S$372/month moves to retirement"
        },
        {
          "month": "2028-09",
          "fromGoal": "housing",
          "amount": 618,
          "text": "BTO home purchase fund complete: S$618/month moves to retirement"
        },
        {
          "month": "2042-08",
          "fromGoal": "education",
          "amount": 102,
          "text": "Percy's education complete: S$102/month moves to retirement"
        }
      ],
      "allOnTrack": true,
      "atRisk": [],
      "recommended": true,
      "tradeOffs": [
        "Retirement steps up as earlier goals finish: 2028-05, 2028-09, 2042-08."
      ]
    },
    {
      "id": "home_first",
      "name": "Home first",
      "tagline": "BTO fund finishes early with a cushion for renovation",
      "routes": {
        "emergency": 269,
        "housing": 711,
        "education": 102,
        "custom": 0,
        "wealth": 230
      },
      "unallocated": 0,
      "goals": [
        {
          "key": "emergency",
          "routeKey": "emergency",
          "name": "Emergency buffer",
          "targetAmount": 35400,
          "startingAmount": 28000,
          "deadline": "2028-11",
          "requiredMonthly": 372,
          "monthlyNow": 269,
          "completesBy": "2028-11",
          "projectedAtDeadline": 35402,
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
          "targetAmount": 44000,
          "startingAmount": 8000,
          "deadline": "2042-08",
          "requiredMonthly": 102,
          "monthlyNow": 102,
          "completesBy": "2042-08",
          "projectedAtDeadline": 44212,
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
          "monthlyNow": 100,
          "completesBy": "2045-05",
          "projectedAtDeadline": 404580,
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
          "monthlyNow": 130,
          "completesBy": "2044-08",
          "projectedAtDeadline": 454225,
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
          "amount": 269,
          "text": "Emergency buffer complete: S$269/month moves to retirement"
        },
        {
          "month": "2042-08",
          "fromGoal": "education",
          "amount": 102,
          "text": "Percy's education complete: S$102/month moves to retirement"
        }
      ],
      "allOnTrack": true,
      "atRisk": [],
      "recommended": false,
      "tradeOffs": [
        "Emergency buffer completes later (2028-11 vs 2028-05).",
        "BTO home purchase fund completes earlier (2028-07 vs 2028-09).",
        "Retirement starts with S$10/month more."
      ]
    },
    {
      "id": "education_first",
      "name": "Education first",
      "tagline": "Front-loads education savings while time in the market is longest",
      "routes": {
        "emergency": 269,
        "housing": 618,
        "education": 153,
        "custom": 0,
        "wealth": 272
      },
      "unallocated": 0,
      "goals": [
        {
          "key": "emergency",
          "routeKey": "emergency",
          "name": "Emergency buffer",
          "targetAmount": 35400,
          "startingAmount": 28000,
          "deadline": "2028-11",
          "requiredMonthly": 372,
          "monthlyNow": 269,
          "completesBy": "2028-11",
          "projectedAtDeadline": 35402,
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
          "targetAmount": 44000,
          "startingAmount": 8000,
          "deadline": "2042-08",
          "requiredMonthly": 102,
          "monthlyNow": 153,
          "completesBy": "2039-03",
          "projectedAtDeadline": 51436,
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
          "monthlyNow": 118,
          "completesBy": "2045-07",
          "projectedAtDeadline": 399415,
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
          "monthlyNow": 154,
          "completesBy": "2044-11",
          "projectedAtDeadline": 450930,
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
          "amount": 269,
          "text": "Emergency buffer complete: S$269/month moves to retirement"
        },
        {
          "month": "2039-03",
          "fromGoal": "education",
          "amount": 153,
          "text": "Percy's education complete: S$153/month moves to retirement"
        }
      ],
      "allOnTrack": true,
      "atRisk": [],
      "recommended": false,
      "tradeOffs": [
        "Emergency buffer completes later (2028-11 vs 2028-05).",
        "Percy's education completes earlier (2039-03 vs 2042-08).",
        "Retirement starts with S$52/month more."
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
        "monthlyAmount": 102,
        "product": "OCBC Blue Chip Investment Plan",
        "horizon": "2042-08"
      },
      {
        "goalKey": "retirement_primary",
        "goalName": "Alex's retirement",
        "monthlyAmount": 95,
        "product": "OCBC RoboInvest",
        "horizon": "2060-11"
      },
      {
        "goalKey": "retirement_partner",
        "goalName": "Lila's retirement",
        "monthlyAmount": 125,
        "product": "OCBC RoboInvest",
        "horizon": "2062-11"
      }
    ],
    "totalMonthly": 322,
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
