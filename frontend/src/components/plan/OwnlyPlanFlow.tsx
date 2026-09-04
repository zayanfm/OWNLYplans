import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';

import api, { AgentAnalysisData, MockPassAuthResponse } from '../../services/api';
import { FALLBACK_FAMILY_MEMBERS, FALLBACK_SGFINDEX_INSTITUTIONS } from '../../constants/mockData';
import { AIPlanDashboard } from '../AIPlanDashboard';

import { IntroStep } from './steps/IntroStep';
import { SingpassLoginStep } from './steps/SingpassLoginStep';
import { MyInfoReviewStep } from './steps/MyInfoReviewStep';
import { SgFinDexStep } from './steps/SgFinDexStep';
import { FamilyConsentStep } from './steps/FamilyConsentStep';
import { InvitePendingStep } from './steps/InvitePendingStep';
import { AccountsConnectedStep } from './steps/AccountsConnectedStep';
import { AnalyzingStep } from './steps/AnalyzingStep';
import { YourPlanStep } from './steps/YourPlanStep';
import { FamilyMember, OwnlyPlan, OwnlyStep, PlanPreferences } from './types';
import { personalizePlan } from './planPersonalization';

const buildFallbackPlan = (preferences?: PlanPreferences): OwnlyPlan => {
  const priorities = preferences?.priorities || ['housing', 'education', 'wealth'];
  const split = preferences?.split || { housing: 0.5, education: 0.3, wealth: 0.2 };
  const timelineYears = Number(preferences?.timeline || '5');
  const predictionScenario = preferences?.predictionScenario || 'balanced';
  const annualReturnRate = predictionScenario === 'growth' ? 0.065 : predictionScenario === 'conservative' ? 0.025 : 0.045;
  const protectionEnabled = preferences?.protection.enabled !== false;
  const protectionTier = preferences?.protection.tier || 'essential';
  const monthlyPremium = protectionEnabled ? (protectionTier === 'enhanced' ? 52 : 28) : 0;
  const monthlySurplus = 1340;
  const investableSurplus = monthlySurplus - monthlyPremium;
  const routeDetails = {
    housing: ['r1', 'Home Loan Safety Reserve', 'OCBC 360 Savings Goal', 'Build a mortgage-payment buffer outside the emergency fund'],
    education: ['r2', '2-Child Education Fund', 'OCBC Savings Goal + RoboInvest', 'Build education funding by the selected goal horizon'],
    wealth: ['r3', 'Retirement & Liquid Wealth', 'OCBC RoboInvest + CPF', 'Grow retirement-ready assets while retaining liquidity'],
  } as const;
  const months = timelineYears * 12;
  const monthlyRate = annualReturnRate / 12;
  const project = (amount: number) => Math.round(amount * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate));
  const routes = priorities.map((key) => {
    const amount = Math.round(investableSurplus * split[key]);
    const [id, name, targetProduct, purpose] = routeDetails[key];
    return { id, key, name, targetProduct, purpose, monthlyAmount: amount, percentage: Math.round(split[key] * 100), projectedAtEnd: project(amount), status: 'ACTIVE_ROUTING' };
  });
  const projectedAtHorizon = routes.reduce((total, route) => total + route.projectedAtEnd, 0);

  return {
    monthlySurplus,
    investableSurplus,
    timelineYears,
    autonomyMode: preferences?.mode || '24H_WINDOW',
    predictionScenario,
    priorities,
    routes,
    protection: {
      enabled: protectionEnabled,
      tier: protectionTier,
      monthlyPremium,
      coverageAmount: protectionEnabled ? (protectionTier === 'enhanced' ? 300000 : 160000) : 0,
      protectionGapClosed: protectionEnabled ? 160000 : 0,
    },
    assumptions: { annualReturnRate, inflationRate: 0.025 },
    summary: {
      totalMonthlyRouted: investableSurplus,
      totalMonthlyCommitted: monthlySurplus,
      projected5YearAccumulation: Math.round(investableSurplus * 60 * (1 + annualReturnRate)),
      projected10YearAccumulation: Math.round(investableSurplus * 120 * (1 + annualReturnRate * 2)),
      projectedAtHorizon,
      annualYieldLift: '+S$456 / year',
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
}

export const OwnlyPlanFlow: React.FC<OwnlyPlanFlowProps> = ({ onHelp, onNav, initialPlan, onPlanActivated }) => {
  const [step, setStep] = useState<OwnlyStep>(initialPlan ? 'cockpit' : 'intro');
  const [myInfo, setMyInfo] = useState<MockPassAuthResponse | null>(null);
  const [aggregate, setAggregate] = useState<any>(null);
  const [family, setFamily] = useState<FamilyMember[]>([]);
  const [analysis, setAnalysis] = useState<AgentAnalysisData | null>(null);
  const [plan, setPlan] = useState<OwnlyPlan | null>(initialPlan || null);
  const [sending, setSending] = useState<boolean>(false);
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
    setStep('myinfo');
  };

  const handleToggleMember = (id: string) => {
    setFamily((prev) => prev.map((m) => (m.id === id ? { ...m, selected: !m.selected } : m)));
  };

  const handleSendInvite = async () => {
    const selected = family.filter((m) => m.selected);
    if (selected.length === 0) {
      setStep('connected');
      return;
    }
    setSending(true);
    try {
      await api.inviteFamily(
        selected.map((m) => ({ name: m.name, relation: m.relation, nric: m.maskedNric }))
      );
    } catch {
      // Offline: the pending step resolves the simulated approval locally.
    } finally {
      setSending(false);
    }
    setFamily((prev) => prev.map((m) => (m.selected ? { ...m, status: 'PENDING' } : m)));
    setStep('invited');
  };

  const handleApproved = useCallback(() => {
    setFamily((prev) => prev.map((m) => (m.selected ? { ...m, status: 'APPROVED' } : m)));
    setStep('connected');
  }, []);

  const handleAnalysisComplete = useCallback(async (result: AgentAnalysisData | null) => {
    setAnalysis(result);
    try {
      const response = await api.generatePlan({});
      setPlan(personalizePlan(response.plan, myInfo, aggregate));
    } catch {
      setPlan(personalizePlan(buildFallbackPlan(), myInfo, aggregate));
    }
    setStep('review');
  }, [aggregate, myInfo]);

  const handleConfirmPlan = useCallback(async (preferences: PlanPreferences) => {
    setSavingPlan(true);
    let finalPlan = personalizePlan(buildFallbackPlan(preferences), myInfo, aggregate);
    try {
      const generated = await api.generatePlan(preferences);
      finalPlan = personalizePlan(generated.plan, myInfo, aggregate);
      await api.approvePlan(finalPlan);
    } catch {
      // The prototype remains usable offline with the same calculated plan.
    } finally {
      setPlan(finalPlan);
      setSavingPlan(false);
      setStep('cockpit');
      onPlanActivated?.(finalPlan);
    }
  }, [aggregate, myInfo, onPlanActivated]);

  const institutionsCount =
    aggregate?.sgfindexConsent?.financialInstitutions?.length || FALLBACK_SGFINDEX_INSTITUTIONS.length;

  return (
    <View style={styles.container}>
      {step === 'intro' && <IntroStep onStart={() => setStep('singpass')} onHelp={onHelp} />}

      {step === 'singpass' && (
        <SingpassLoginStep onAuthenticated={handleAuthenticated} onBack={() => setStep('intro')} />
      )}

      {step === 'myinfo' && myInfo && (
        <MyInfoReviewStep
          profile={myInfo}
          onNext={() => setStep('sgfindex')}
          onBack={() => setStep('singpass')}
        />
      )}

      {step === 'sgfindex' && (
        <SgFinDexStep
          onNext={(result) => {
            setAggregate(result);
            setStep('family');
          }}
          onBack={() => setStep('myinfo')}
        />
      )}

      {step === 'family' && (
        <FamilyConsentStep
          members={family}
          sending={sending}
          onToggleMember={handleToggleMember}
          onSendInvite={handleSendInvite}
          onBack={() => setStep('sgfindex')}
        />
      )}

      {step === 'invited' && <InvitePendingStep members={family} onApproved={handleApproved} />}

      {step === 'connected' && (
        <AccountsConnectedStep
          members={family}
          institutionsCount={institutionsCount}
          onStartPlanning={() => setStep('analyzing')}
        />
      )}

      {step === 'analyzing' && <AnalyzingStep onComplete={handleAnalysisComplete} />}

      {step === 'review' && plan && (
        <YourPlanStep
          plan={plan}
          saving={savingPlan}
          onBack={() => setStep('connected')}
          onConfirm={handleConfirmPlan}
        />
      )}

      {step === 'cockpit' && (
        <AIPlanDashboard
          onNav={onNav}
          analysis={analysis}
          activePlan={plan}
          profile={myInfo}
          aggregate={aggregate}
          onEditPlan={() => setStep('review')}
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
