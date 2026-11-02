import React, { useEffect, useState } from 'react';
import api from '../../../services/api';
import type { FamilyPlanState, GoalGroup, Member, PlanGoalOutcome, PlanOption } from '../../../services/api';
import { money, monthLabel } from '../stepStyles';
import { AssistantChat, ChatChip, ChatMessage } from './AssistantChat';

// Words people use for each kind of goal, so "put the BTO first" finds the housing goal.
const GROUP_WORDS: Record<GoalGroup, string[]> = {
  EMERGENCY: ['emergency', 'buffer', 'safety', 'rainy'],
  HOUSING: ['home', 'house', 'bto', 'flat', 'housing', 'renovat'],
  EDUCATION: ['education', 'school', 'uni', 'university', 'poly', 'study'],
  RETIREMENT: ['retire', 'retirement'],
  FAMILY: ['holiday', 'trip', 'travel', 'family'],
  OTHER: [],
};

type Pending = { action: 'move' | 'amount' | 'goal'; goalKey?: string } | null;

const sharedGoals = (plan: PlanOption) => {
  const shared = plan.goals.filter((goal) => goal.owner === 'household');
  return (plan.priorityOrder?.length ? plan.priorityOrder : shared.map((goal) => goal.key))
    .map((key) => shared.find((goal) => goal.key === key))
    .filter(Boolean) as PlanGoalOutcome[];
};

const statusText = (goal: PlanGoalOutcome) => (goal.status === 'ON_TRACK' ? 'on track' : 'at risk');

// The goal a message is about: its name, its child's name, or a word for its kind.
const findGoal = (text: string, goals: PlanGoalOutcome[]) => {
  const typed = text.toLowerCase();
  const scored = goals.map((goal) => {
    const nameWords = goal.name.toLowerCase().replace(/'s\b/g, '').split(/\s+/).filter((word) => word.length > 3);
    const child = goal.childName?.split(' ')[0].toLowerCase();
    const score = (child && typed.includes(child) ? 3 : 0)
      + nameWords.filter((word) => typed.includes(word)).length * 2
      + GROUP_WORDS[goal.group].filter((word) => typed.includes(word)).length;
    return { goal, score };
  });
  const best = scored.sort((a, b) => b.score - a.score)[0];
  return best && best.score > 0 ? best.goal : null;
};

const amountIn = (text: string) => {
  const match = text.replace(/,/g, '').match(/(\d+(?:\.\d+)?)\s*(k)?/i);
  if (!match) return null;
  return Math.round(Number(match[1]) * (match[2] ? 1000 : 1));
};

/**
 * The plan assistant: changes the one family plan by message or by tapping. It can move a shared
 * goal up or down, set a goal's monthly amount, go back to the recommended plan, and explain the
 * plan. Every number comes from the planning engine; each change goes to the other adult to approve.
 */
export const PlanChatSheet: React.FC<{
  visible: boolean;
  viewer: Member;
  viewerName: string;
  otherName: string | null;
  state: FamilyPlanState;
  onClose: () => void;
  onChanged: (state: FamilyPlanState) => void;
}> = ({ visible, viewer, viewerName, otherName, state, onClose, onChanged }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pending, setPending] = useState<Pending>(null);
  const [busy, setBusy] = useState<boolean>(false);
  const asPartner = viewer === 'partner';
  const goals = sharedGoals(state.plan);
  const pot = state.plan.pots?.find((item) => item.id === 'household');

  useEffect(() => {
    if (!visible) return;
    setMessages([{ from: 'ai', text: `Hi ${viewerName}. What would you like to change? For example "Put the emergency savings first" or "S$300 a month for Percy's education".` }]);
    setPending(null);
  }, [visible]);

  const say = (next: ChatMessage[]) => setMessages((current) => [...current, ...next]);

  // What changed for each shared goal, in words, after the engine recalculates.
  const describeChange = (before: PlanOption, after: PlanOption) => {
    const lines = sharedGoals(after).map((goal, index) => {
      const old = before.goals.find((item) => item.key === goal.key);
      const moved = sharedGoals(before).findIndex((item) => item.key === goal.key) !== index;
      if (old && old.monthlyNow === goal.monthlyNow && old.status === goal.status && !moved) return null;
      return `${index + 1}. ${goal.name}: ${money(goal.monthlyNow)}/mo, done ${monthLabel(goal.completesBy)} (${statusText(goal)})`;
    }).filter(Boolean);
    return lines.length ? lines.join('\n') : 'Nothing else changes.';
  };

  const apply = async (order: string[], overrides: Record<string, number>, intro: string) => {
    setBusy(true);
    try {
      const next = await api.editFamilyPlan(order, overrides, asPartner);
      onChanged(next);
      say([{ from: 'ai', text: `${intro}\n${describeChange(state.plan, next.plan)}${otherName ? `\n\n${otherName} will be asked to approve the change.` : ''}` }]);
    } catch (err: any) {
      say([{ from: 'ai', text: err?.status ? `I couldn't do that: ${err.message}` : 'Changing the plan needs the planning engine. Start the backend and try again.' }]);
    } finally {
      setBusy(false);
      setPending(null);
    }
  };

  const currentOrder = () => goals.map((goal) => goal.key);
  const currentOverrides = () => ({ ...(state.plan.definition?.monthlyOverrides || {}) });

  const move = (goal: PlanGoalOutcome, to: 'first' | 'up' | 'down' | 'last') => {
    const order = currentOrder().filter((key) => key !== goal.key);
    const index = currentOrder().indexOf(goal.key);
    const target = to === 'first' ? 0 : to === 'last' ? order.length : to === 'up' ? Math.max(0, index - 1) : Math.min(order.length, index + 1);
    if (target === index) {
      say([{ from: 'ai', text: `${goal.name} is already ${index === 0 ? 'first' : 'last'}.` }]);
      setPending(null);
      return;
    }
    order.splice(target, 0, goal.key);
    apply(order, currentOverrides(), `Done. ${goal.name} is now number ${target + 1}.`);
  };

  const setAmount = (goal: PlanGoalOutcome, amount: number) => {
    apply(currentOrder(), { ...currentOverrides(), [goal.key]: Math.max(0, amount) }, `Done. ${goal.name} now gets ${money(Math.max(0, amount))} a month.`);
  };

  const reset = async () => {
    setBusy(true);
    try {
      const next = await api.resetFamilyPlan(asPartner);
      onChanged(next);
      say([{ from: 'ai', text: `Back to the recommended plan.\n${describeChange(state.plan, next.plan)}` }]);
    } catch (err: any) {
      say([{ from: 'ai', text: err?.status ? err.message : 'That needs the planning engine. Start the backend and try again.' }]);
    } finally {
      setBusy(false);
      setPending(null);
    }
  };

  const explain = () => {
    const lines = goals.map((goal, index) => `${index + 1}. ${goal.name}: ${money(goal.monthlyNow)}/mo, ${statusText(goal)}`);
    say([{
      from: 'ai',
      text: `The family pot is ${money(pot?.available ?? state.investable)} a month. Goals are funded in this order:\n${lines.join('\n')}\n${money(pot?.free ?? 0)} a month is kept free.${state.plan.tradeOffs.length ? `\n\n${state.plan.tradeOffs.join('\n')}` : ''}`,
    }]);
  };

  const onSend = (text: string) => {
    say([{ from: 'me', text }]);
    const typed = text.toLowerCase();
    if (/\b(reset|recommended|start over|undo)\b/.test(typed)) return reset();
    const goal = findGoal(text, goals) || (pending?.goalKey ? goals.find((item) => item.key === pending.goalKey) || null : null);
    const amount = amountIn(text);

    if (goal && amount !== null && (pending?.action === 'amount' || /\$|month|mo\b|put|give|set|more|less|add|cut|reduce|increase/.test(typed) || pending?.goalKey)) {
      const now = goal.monthlyNow;
      if (/\b(more|add|increase|extra|up by)\b|\+/.test(typed)) return setAmount(goal, now + amount);
      if (/\b(less|cut|reduce|decrease|down by)\b|-/.test(typed)) return setAmount(goal, now - amount);
      return setAmount(goal, amount);
    }
    if (goal && /\b(first|top|most important|priority|before)\b/.test(typed)) return move(goal, 'first');
    if (goal && /\blast\b/.test(typed)) return move(goal, 'last');
    if (goal && /\b(up|higher|earlier)\b/.test(typed)) return move(goal, 'up');
    if (goal && /\b(down|lower|later)\b/.test(typed)) return move(goal, 'down');
    if (!goal && amount !== null && pending?.action === 'amount') {
      say([{ from: 'ai', text: 'Which goal is that for?' }]);
      return;
    }
    if (goal) {
      setPending({ action: 'goal', goalKey: goal.key });
      say([{ from: 'ai', text: `${goal.name} gets ${money(goal.monthlyNow)} a month and is ${statusText(goal)}. What would you like to do?` }]);
      return;
    }
    if (/\b(why|explain|how|what)\b/.test(typed)) return explain();
    say([{ from: 'ai', text: 'Sorry, I didn\'t catch that. Try "Put the emergency savings first" or "S$300 a month for education".' }]);
  };

  const pendingGoal = pending?.goalKey ? goals.find((item) => item.key === pending.goalKey) : null;
  const chips: ChatChip[] = (() => {
    if (pending?.action === 'move') {
      return goals.slice(1).map((goal) => ({ label: goal.name, onPress: () => { say([{ from: 'me', text: `Move ${goal.name} up` }]); move(goal, 'up'); } }));
    }
    if (pending?.action === 'amount' && !pendingGoal) {
      return goals.map((goal) => ({
        label: goal.name,
        onPress: () => {
          say([{ from: 'me', text: goal.name }, { from: 'ai', text: `${goal.name} gets ${money(goal.monthlyNow)} a month now. How much should it get? Tap or type an amount.` }]);
          setPending({ action: 'amount', goalKey: goal.key });
        },
      }));
    }
    if (pendingGoal && pending?.action === 'amount') {
      return [-100, 100, 200].map((delta) => Math.max(0, pendingGoal.monthlyNow + delta)).map((value) => ({
        label: `${money(value)}/mo`,
        onPress: () => { say([{ from: 'me', text: `${money(value)} a month` }]); setAmount(pendingGoal, value); },
      }));
    }
    if (pendingGoal) {
      return [
        { label: 'Move it first', onPress: () => { say([{ from: 'me', text: 'Move it first' }]); move(pendingGoal, 'first'); } },
        { label: 'Change its amount', onPress: () => { say([{ from: 'me', text: 'Change its amount' }, { from: 'ai', text: 'How much a month? Tap or type an amount.' }]); setPending({ action: 'amount', goalKey: pendingGoal.key }); } },
        { label: 'Never mind', onPress: () => setPending(null), muted: true },
      ];
    }
    return [
      ...(goals.length > 1 ? [{ label: 'Move a goal up', onPress: () => { say([{ from: 'me', text: 'Move a goal up' }, { from: 'ai', text: 'Which one?' }]); setPending({ action: 'move' }); } }] : []),
      { label: 'Change a monthly amount', onPress: () => { say([{ from: 'me', text: 'Change a monthly amount' }, { from: 'ai', text: 'For which goal?' }]); setPending({ action: 'amount' }); } },
      { label: 'Explain this plan', onPress: () => { say([{ from: 'me', text: 'Explain this plan' }]); explain(); } },
      ...(state.plan.id === 'custom' ? [{ label: 'Back to recommended', onPress: () => { say([{ from: 'me', text: 'Back to recommended' }]); reset(); }, muted: true }] : []),
    ];
  })();

  return (
    <AssistantChat
      visible={visible}
      title="Plan assistant"
      subtitle={`Numbers from the planning engine${otherName ? `. ${otherName} approves any change` : ''}`}
      messages={messages}
      chips={chips}
      placeholder={pending?.action === 'amount' ? 'Type an amount, e.g. 300' : 'Type a message'}
      busy={busy}
      onSend={onSend}
      onClose={onClose}
    />
  );
};

export default PlanChatSheet;
