import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import api from '../../../services/api';
import type { GoalCategory, GoalInput, Member } from '../../../services/api';
import { money, monthLabel } from '../stepStyles';
import { AssistantChat, ChatChip, ChatMessage, chatCardStyles } from './AssistantChat';

type Answers = Record<string, any>;
// aliases: other words that pick this choice when typed.
type Choice = { label: string; value: any; aliases?: string[] };
type Question = {
  id: string;
  ask: (answers: Answers) => string;
  choices: (answers: Answers) => Choice[];
  // Free input, when the chips don't fit. Returns the value, or an error message as { error }.
  input?: { placeholder: string; numeric?: boolean; parse: (text: string) => any };
  show: (value: any, answers: Answers) => string;
};
type Topic = {
  id: string;
  label: string;
  // Words that pick this topic when typed.
  keywords: string[];
  intro: string;
  goal: Partial<GoalInput>;
  questions: Question[];
  // The goal sent to the planning engine once every question is answered.
  build: (answers: Answers) => Partial<GoalInput>;
  summary: (answers: Answers) => Array<[string, string]>;
};

const thisYear = new Date().getFullYear();
const monthsAhead = (months: number) => {
  const date = new Date();
  date.setMonth(date.getMonth() + months);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};
const toAmount = (text: string) => {
  const value = Number(text.replace(/[^0-9.]/g, '')) * (/k\s*$/i.test(text.trim()) ? 1000 : 1);
  return value >= 1000 ? Math.round(value) : { error: 'Please enter at least S$1,000.' };
};
const toYear = (text: string) => {
  const year = Number(text.replace(/[^0-9]/g, ''));
  return year > thisYear && year < thisYear + 60 ? year : { error: `Please enter a year after ${thisYear}.` };
};

const whenQuestion: Question = {
  id: 'due',
  ask: () => 'When do you need it by?',
  choices: () => [1, 2, 3, 5].map((years) => ({ label: `In ${years} year${years > 1 ? 's' : ''}`, value: monthsAhead(years * 12) })),
  input: { placeholder: 'Or type a year, e.g. 2030', parse: (text) => { const year = toYear(text); return typeof year === 'number' ? `${year}-06` : year; } },
  show: (value) => monthLabel(value),
};

const customTopic = (id: string, label: string, keywords: string[], category: GoalCategory, name: string | null, amounts: number[], viewer: Member): Topic => ({
  id,
  label,
  keywords,
  intro: name ? `${name}. A few quick questions.` : 'Sure. A few quick questions.',
  goal: { type: 'CUSTOM', category },
  questions: [
    ...(name ? [] : [{
      id: 'name',
      ask: () => 'What should we call it?',
      choices: () => [],
      input: { placeholder: 'e.g. Family car', parse: (text: string) => text.trim() || { error: 'Please give it a name.' } },
      show: (value: string) => value,
    }]),
    {
      id: 'amount',
      ask: () => 'Roughly how much will it cost?',
      choices: () => amounts.map((value) => ({ label: money(value), value })),
      input: { placeholder: 'Or type an amount', numeric: true, parse: toAmount },
      show: (value) => money(value),
    },
    whenQuestion,
    {
      id: 'owner',
      ask: () => 'Is this for both of you, or just you?',
      choices: () => [
        { label: 'Shared', value: 'household', aliases: ['both', 'us', 'we', 'together', 'family', 'our'] },
        { label: 'Just me', value: viewer, aliases: ['me', 'mine', 'myself', 'my own', 'only me'] },
      ],
      show: (value) => (value === 'household' ? 'Shared' : 'Just me'),
    },
  ],
  build: (a) => ({ type: 'CUSTOM', category, name: name || a.name, amount: a.amount, saved: 0, dueDate: a.due, owner: a.owner }),
  summary: (a) => [['Goal', name || a.name], ['Amount', money(a.amount)], ['By', monthLabel(a.due)], ['For', a.owner === 'household' ? 'Both of you' : 'Just you']],
});

// The topics on offer: suggested goals not on the list yet, then the family's own kinds of goal.
const buildTopics = (available: GoalInput[], viewer: Member): Topic[] => {
  const topics: Topic[] = [];
  available.filter((g) => g.type === 'EDUCATION').forEach((g) => {
    const child = String(g.childName || 'Child').split(' ')[0];
    const birthYear = (g.startYear || thisYear + 19) - 19;
    topics.push({
      id: g.key,
      label: `🎓 ${child}'s education`,
      keywords: [child.toLowerCase(), 'education', 'uni', 'university', 'poly', 'school', 'study', 'college'],
      intro: `Let's plan for ${child}.`,
      goal: { type: 'EDUCATION', childIndex: g.childIndex },
      questions: [
        {
          id: 'path',
          ask: () => `University or polytechnic for ${child}?`,
          choices: () => [{ label: 'University', value: 'UNIVERSITY', aliases: ['uni', 'nus', 'ntu', 'smu', 'degree'] }, { label: 'Polytechnic', value: 'POLYTECHNIC', aliases: ['poly', 'diploma'] }],
          show: (value) => (value === 'UNIVERSITY' ? 'University' : 'Polytechnic'),
        },
        {
          id: 'startYear',
          ask: (a) => `When will ${child} start? Most start ${a.path === 'UNIVERSITY' ? 'university at 19' : 'polytechnic at 17'}.`,
          choices: (a) => {
            const typical = birthYear + (a.path === 'UNIVERSITY' ? 19 : 17);
            return [typical - 1, typical, typical + 1].filter((year) => year > thisYear).map((year) => ({ label: String(year), value: year }));
          },
          input: { placeholder: 'Or type a year', numeric: true, parse: toYear },
          show: (value) => String(value),
        },
        {
          id: 'annualCost',
          ask: (a) => (a.path === 'UNIVERSITY'
            ? 'How much a year? Local university is about S$10,000–12,000 (CNA, 2024).'
            : 'How much a year? Polytechnic is about S$3,100 (CNA, 2024).'),
          choices: (a) => (a.path === 'UNIVERSITY' ? [11000, 15000, 25000] : [3100, 5000]).map((value) => ({ label: money(value), value })),
          input: { placeholder: 'Or type an amount', numeric: true, parse: (text) => { const value = Number(text.replace(/[^0-9]/g, '')); return value > 0 ? value : { error: 'Please enter an amount.' }; } },
          show: (value) => `${money(value)} a year`,
        },
      ],
      build: (a) => ({ type: 'EDUCATION', childIndex: g.childIndex, path: a.path, startYear: a.startYear, annualCost: a.annualCost }),
      summary: (a) => {
        const years = a.path === 'UNIVERSITY' ? 4 : 3;
        return [['Goal', `${child}'s education`], ['Path', a.path === 'UNIVERSITY' ? 'University' : 'Polytechnic'], ['Starts', String(a.startYear)], ['Total', `${money(a.annualCost * years)} (${years} years)`]];
      },
    });
  });
  if (available.some((g) => g.type === 'EMERGENCY')) {
    topics.push({
      id: 'emergency',
      label: '🛡️ Emergency savings',
      keywords: ['emergency', 'buffer', 'safety', 'rainy', 'backup'],
      intro: 'A safety net for job loss or big surprises.',
      goal: { type: 'EMERGENCY' },
      questions: [
        {
          id: 'months',
          ask: () => 'How many months of essential spending? 3–6 is common.',
          choices: () => [3, 6, 9, 12].map((value) => ({ label: `${value} months`, value })),
          show: (value) => `${value} months`,
        },
        {
          id: 'withinMonths',
          ask: () => 'How soon do you want it built?',
          choices: () => [12, 18, 24, 36].map((value) => ({ label: `${value} months`, value })),
          show: (value) => `Within ${value} months`,
        },
      ],
      build: (a) => ({ type: 'EMERGENCY', months: a.months, withinMonths: a.withinMonths }),
      summary: (a) => [['Goal', 'Emergency savings'], ['Size', `${a.months} months of essentials`], ['Built within', `${a.withinMonths} months`]],
    });
  }
  if (available.some((g) => g.type === 'RETIREMENT' && g.owner === viewer)) {
    topics.push({
      id: 'retirement',
      label: '📈 My retirement',
      keywords: ['retire', 'retirement', 'old age', 'pension'],
      intro: 'This one is just yours. Your partner won\'t need to approve it.',
      goal: { type: 'RETIREMENT' },
      questions: [
        {
          id: 'retireAge',
          ask: () => 'When would you like to retire?',
          choices: () => [60, 63, 65].map((value) => ({ label: `At ${value}`, value })),
          show: (value) => `At ${value}`,
        },
        {
          id: 'amount',
          ask: () => 'How much on top of CPF LIFE payouts?',
          choices: () => [100000, 200000, 300000].map((value) => ({ label: money(value), value })),
          input: { placeholder: 'Or type an amount', numeric: true, parse: toAmount },
          show: (value) => money(value),
        },
      ],
      build: (a) => ({ type: 'RETIREMENT', retireAge: a.retireAge, amount: a.amount }),
      summary: (a) => [['Goal', 'My retirement'], ['Retire at', String(a.retireAge)], ['On top of CPF', money(a.amount)], ['For', 'Just you']],
    });
  }
  topics.push(
    customTopic('home', '🏠 Home', ['home', 'house', 'bto', 'flat', 'condo', 'renovat'], 'HOUSING', 'Home', [50000, 100000, 150000], viewer),
    customTopic('holiday', '✈️ Family holiday', ['holiday', 'trip', 'travel', 'vacation'], 'FAMILY', 'Family holiday', [5000, 8000, 12000], viewer),
    customTopic('other', '⭐ Something else', [], 'OTHER', null, [], viewer),
  );
  return topics;
};

const digits = (text: string) => text.replace(/[^0-9]/g, '');

// A typed answer that matches one of the chips: its label, an alias, or the same number.
const matchChoice = (text: string, choices: Choice[]) => {
  const typed = text.toLowerCase().trim();
  return choices.find((choice) => {
    const label = choice.label.toLowerCase();
    if (label === typed || label.includes(typed) && typed.length > 2) return true;
    if ((choice.aliases || []).some((alias) => new RegExp(`\\b${alias}\\b`).test(typed))) return true;
    return Boolean(digits(typed)) && digits(label) === digits(typed);
  });
};

/**
 * The goal assistant: a short guided chat that turns what someone wants into one goal at a time.
 * People can tap the suggestions or type. It asks only what the plan needs, suggests values with
 * their source, and adds nothing until the person says so. The other adult then approves or edits
 * it on the shared goals page.
 */
export const GoalChatSheet: React.FC<{
  visible: boolean;
  viewer: Member;
  viewerName: string;
  otherName: string | null;
  available: GoalInput[];
  onClose: () => void;
  onAdded: () => void;
}> = ({ visible, viewer, viewerName, otherName, available, onClose, onAdded }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [topic, setTopic] = useState<Topic | null>(null);
  const [answers, setAnswers] = useState<Answers>({});
  const [step, setStep] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState<boolean>(false);
  const topics = buildTopics(available, viewer);

  useEffect(() => {
    if (!visible) return;
    setMessages([{ from: 'ai', text: `Hi ${viewerName}. What would you like to plan for? Tap one or tell me in your own words.` }]);
    setTopic(null);
    setAnswers({});
    setStep(0);
    setError(null);
  }, [visible]);

  const say = (next: ChatMessage[]) => setMessages((current) => [...current, ...next]);

  const startTopic = (chosen: Topic, typed?: string) => {
    setTopic(chosen);
    setAnswers({});
    setStep(0);
    setError(null);
    say([{ from: 'me', text: typed || chosen.label.replace(/^\S+\s/, '') }, { from: 'ai', text: `${chosen.intro} ${chosen.questions[0].ask({})}` }]);
  };

  const answer = (value: any, typed?: string) => {
    if (!topic) return;
    const question = topic.questions[step];
    const next = { ...answers, [question.id]: value };
    setAnswers(next);
    setError(null);
    const following = topic.questions[step + 1];
    say([
      { from: 'me', text: typed || question.show(value, next) },
      { from: 'ai', text: following ? following.ask(next) : 'Here\'s the goal. Add it to the list?' },
    ]);
    setStep(step + 1);
  };

  const add = async () => {
    if (!topic) return;
    setAdding(true);
    setError(null);
    try {
      const goal = topic.build(answers);
      await api.proposeGoal(goal, viewer === 'partner');
      const shared = goal.type !== 'RETIREMENT' && goal.owner !== viewer;
      say([{ from: 'me', text: 'Add it' }, {
        from: 'ai',
        text: shared && otherName ? `Added. ${otherName} will be asked to approve it. Anything else?` : 'Added. Anything else?',
      }]);
      setTopic(null);
      onAdded();
    } catch (err: any) {
      setError(err?.status ? err.message : 'Adding goals needs the planning engine. Start the backend and try again.');
    } finally {
      setAdding(false);
    }
  };

  const question = topic && step < topic.questions.length ? topic.questions[step] : null;
  const summary = topic && !question ? topic.summary(answers) : null;

  // Typed messages: pick a topic, answer the current question, or confirm the summary.
  const onSend = (text: string) => {
    const typed = text.toLowerCase();
    if (!topic) {
      if (messages.length > 1 && /^(no|nope|done|that'?s all|nothing)\b/.test(typed)) {
        onClose();
        return;
      }
      const chosen = topics.find((item) => item.keywords.some((word) => typed.includes(word)));
      if (chosen) {
        startTopic(chosen, text);
        return;
      }
      // Anything else becomes the family's own goal, named after what they typed.
      const other = topics.find((item) => item.id === 'other');
      if (!other) return;
      const name = text.replace(/^(i want to|we want to|save for|saving for|a|an)\s+/i, '').slice(0, 40);
      setTopic(other);
      setAnswers({ name });
      setStep(1);
      say([{ from: 'me', text }, { from: 'ai', text: `"${name}" it is. ${other.questions[1].ask({ name })}` }]);
      return;
    }
    if (summary) {
      if (/^(yes|yep|ok|okay|sure|add)/.test(typed)) add();
      else if (/^(no|again|change|redo)/.test(typed)) startTopic(topic, text);
      else say([{ from: 'me', text }, { from: 'ai', text: 'Say "add" to add it, or "change" to start this goal again.' }]);
      return;
    }
    if (!question) return;
    const choice = matchChoice(text, question.choices(answers));
    if (choice) {
      answer(choice.value, text);
      return;
    }
    if (question.input) {
      const parsed = question.input.parse(text);
      if (parsed && typeof parsed === 'object' && 'error' in parsed) {
        say([{ from: 'me', text }, { from: 'ai', text: parsed.error }]);
        return;
      }
      answer(parsed, text);
      return;
    }
    say([{ from: 'me', text }, { from: 'ai', text: `Sorry, I didn't catch that. ${question.ask(answers)}` }]);
  };

  const chips: ChatChip[] = !topic
    ? [
      ...topics.map((item) => ({ label: item.label, onPress: () => startTopic(item) })),
      ...(messages.length > 1 ? [{ label: 'That\'s all for now', onPress: onClose, muted: true }] : []),
    ]
    : question ? question.choices(answers).map((choice) => ({ label: choice.label, onPress: () => answer(choice.value) })) : [];

  return (
    <AssistantChat
      visible={visible}
      title="Goal assistant"
      subtitle={`Sees your shared plan only${otherName ? `, not ${otherName}'s money` : ''}`}
      messages={messages}
      chips={chips}
      placeholder={question?.input?.placeholder || 'Type a message'}
      error={error}
      onSend={onSend}
      onClose={onClose}
    >
      {summary ? (
        <View style={chatCardStyles.card}>
          {summary.map(([label, value]) => (
            <View key={label} style={chatCardStyles.row}>
              <Text style={chatCardStyles.label}>{label}</Text>
              <Text style={chatCardStyles.value}>{value}</Text>
            </View>
          ))}
          <TouchableOpacity style={[chatCardStyles.button, adding && { opacity: 0.6 }]} onPress={add} disabled={adding}>
            {adding ? <ActivityIndicator color="#FFFFFF" /> : <Text style={chatCardStyles.buttonText}>Add to our goals</Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => topic && startTopic(topic)} style={chatCardStyles.link}>
            <Text style={chatCardStyles.linkText}>Start this goal again</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </AssistantChat>
  );
};

export default GoalChatSheet;
