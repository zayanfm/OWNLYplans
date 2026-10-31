import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';

import api, { AgentAnalysisData, FamilyPicture, HouseholdWorkspace, MockPassAuthResponse, PlanOptionId } from '../../services/api';
import { FALLBACK_FAMILY_MEMBERS } from '../../constants/mockData';
import { FALLBACK_PLAN_OPTIONS } from '../../constants/planningFallback';
import { AIPlanDashboard } from '../AIPlanDashboard';

import { IntroStep } from './steps/IntroStep';
import { SingpassLoginStep } from './steps/SingpassLoginStep';
import { HouseholdStep } from './steps/HouseholdStep';
import { FamilyPictureStep } from './steps/FamilyPictureStep';
import { OurPlanStep } from './steps/OurPlanStep';
import { FamilyMember, OwnlyPlan, OwnlyStep } from './types';
import { personalizePlan } from './planPersonalization';

// Offline: build the active plan from the saved optimiser output for the chosen option.
const buildFallbackPlan = (planId: PlanOptionId): OwnlyPlan => {
  const options = FALLBACK_PLAN_OPTIONS;
  const option = options.plans.find((plan) => plan.id === planId) || options.plans[0];
  const annualReturnRate = 0.045;
  const months = 60;
  const monthlyRate = annualReturnRate / 12;
  const project = (amount: number) => Math.round(amount * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate));
  const routeDetails = {
    housing: ['r1', 'BTO Home Purchase Fund', 'OCBC 360 Savings Goal', 'Build the BTO downpayment by key collection'],
    education: ['r2', 'Percy’s Education Fund', 'OCBC Savings Goal + Blue Chip Investment Plan', 'Build education funding by age 18'],
    wealth: ['r3', 'Retirement & Liquid Wealth', 'OCBC RoboInvest + CPF', 'Grow retirement savings, stepping up as earlier goals finish'],
  } as const;
  const routes = (['housing', 'education', 'wealth'] as const).map((key) => {
    const [id, name, targetProduct, purpose] = routeDetails[key];
    const monthlyAmount = option.routes[key];
    return { id, key, name, targetProduct, purpose, monthlyAmount, percentage: Math.round(monthlyAmount / options.investable * 100), projectedAtEnd: project(monthlyAmount), status: 'ACTIVE_ROUTING' };
  });

  return {
    monthlySurplus: options.monthlySurplus,
    investableSurplus: options.investable,
    timelineYears: 5,
    autonomyMode: '24H_WINDOW',
    predictionScenario: 'balanced',
    priorities: ['housing', 'education', 'wealth'],
    routes,
    protection: { enabled: true, tier: 'essential', monthlyPremium: options.protectionPremium, coverageAmount: 160000, protectionGapClosed: 160000 },
    assumptions: { annualReturnRate, inflationRate: 0.025 },
    summary: {
      totalMonthlyRouted: options.investable,
      totalMonthlyCommitted: options.monthlySurplus,
      projected5YearAccumulation: Math.round(options.investable * 60 * (1 + annualReturnRate)),
      projected10YearAccumulation: Math.round(options.investable * 120 * (1 + annualReturnRate * 2)),
      projectedAtHorizon: routes.reduce((total, route) => total + route.projectedAtEnd, 0),
      annualYieldLift: '+S$1,064 / year',
    },
  };
};

const buildFamilyFromProfile = (profile: MockPassAuthResponse | null): FamilyMember[] => {
  const members: FamilyMember[] = [];

  if (profile?.partner) {
    members.push({
      id: 'spouse',
      name: profile.partner.name,
      relation: 'Spouse',
      maskedNric: profile.partner.nric,
      selected: true,
      status: 'IDLE',
    });
  }

  (profile?.household?.dependents || []).forEach((dependent: any, index: number) => {
    members.push({
      id: `child-${index + 1}`,
      name: dependent.name,
      relation: 'Child',
      maskedNric: dependent.nric || 'T****•••Z',
      selected: true,
      status: 'IDLE',
    });
  });

  if (members.length === 0 && !profile) {
    return FALLBACK_FAMILY_MEMBERS.map((m) => ({
      ...m,
      relation: m.relation as FamilyMember['relation'],
      selected: true,
      status: 'IDLE' as FamilyMember['status'],
    }));
  }

  return members;
};

export interface OwnlyPlanFlowProps {
  onHelp?: () => void;
  onNav?: (screenKey: string) => void;
  initialPlan?: OwnlyPlan | null;
  onPlanActivated?: (plan: OwnlyPlan) => void;
  authenticatedProfile?: MockPassAuthResponse | null;
}

/**
 * The OWNLYplan journey, one surface per stage:
 * Setup (intro → Singpass → household) → Understand (family picture) → Decide (our plan) → Grow (cockpit).
 */
export const OwnlyPlanFlow: React.FC<OwnlyPlanFlowProps> = ({ onHelp, onNav, initialPlan, onPlanActivated, authenticatedProfile }) => {
  const [step, setStep] = useState<OwnlyStep>(initialPlan ? 'cockpit' : 'intro');
  const [myInfo, setMyInfo] = useState<MockPassAuthResponse | null>(null);
  const [workspace, setWorkspace] = useState<HouseholdWorkspace | null>(null);
  const [picture, setPicture] = useState<FamilyPicture | null>(null);
  const [family, setFamily] = useState<FamilyMember[]>([]);
  const [analysis, setAnalysis] = useState<AgentAnalysisData | null>(null);
  const [plan, setPlan] = useState<OwnlyPlan | null>(initialPlan || null);
  const [savingPlan, setSavingPlan] = useState<boolean>(false);

  useEffect(() => {
    if (initialPlan && !plan) {
      setPlan(initialPlan);
      setStep('cockpit');
    }
  }, [initialPlan, plan]);

  const handleAuthenticated = (profile: MockPassAuthResponse) => {
    setMyInfo(profile);
    setFamily(buildFamilyFromProfile(profile));
    setStep('household');
  };

  useEffect(() => {
    if (authenticatedProfile && authenticatedProfile.authenticatedAt !== myInfo?.authenticatedAt) {
      handleAuthenticated(authenticatedProfile);
    }
  }, [authenticatedProfile, myInfo?.authenticatedAt]);

  const handleHouseholdReady = (result: HouseholdWorkspace) => {
    setWorkspace(result);
    // Agent analysis feeds the cockpit; run it in the background instead of a loading screen.
    api.analyzeAgents()
      .then((response) => setAnalysis(response.data))
      .catch(() => setAnalysis(null));
    setStep('picture');
  };

  const handleAgreed = useCallback(async (planId: PlanOptionId) => {
    setSavingPlan(true);
    let finalPlan = personalizePlan(buildFallbackPlan(planId), myInfo, workspace, picture);
    try {
      const generated = await api.generatePlan({ planId });
      finalPlan = personalizePlan(generated.plan, myInfo, workspace, picture);
      await api.approvePlan(finalPlan);
    } catch {
      // The prototype remains usable offline with the saved plan options.
    } finally {
      setPlan(finalPlan);
      setSavingPlan(false);
      setStep('cockpit');
      onPlanActivated?.(finalPlan);
    }
  }, [myInfo, onPlanActivated, picture, workspace]);

  return (
    <View style={styles.container}>
      {step === 'intro' && <IntroStep onStart={() => setStep('singpass')} onHelp={onHelp} />}

      {step === 'singpass' && (
        <SingpassLoginStep onAuthenticated={handleAuthenticated} onBack={() => setStep('intro')} />
      )}

      {step === 'household' && (
        <HouseholdStep
          profile={myInfo}
          family={family}
          onFamilyChange={setFamily}
          onNext={handleHouseholdReady}
          onBack={() => setStep('singpass')}
        />
      )}

      {step === 'picture' && (
        <FamilyPictureStep
          onNext={(result) => {
            setPicture(result);
            setStep('plan');
          }}
          onBack={() => setStep('household')}
        />
      )}

      {step === 'plan' && (
        <OurPlanStep
          partnerFirstName={myInfo?.partner?.name?.split(' ')[0]}
          saving={savingPlan}
          onBack={() => setStep(plan ? 'cockpit' : 'picture')}
          onAgreed={handleAgreed}
        />
      )}

      {step === 'cockpit' && (
        <AIPlanDashboard
          onNav={onNav}
          analysis={analysis}
          activePlan={plan}
          profile={myInfo}
          aggregate={workspace}
          onEditPlan={() => setStep('plan')}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default OwnlyPlanFlow;
