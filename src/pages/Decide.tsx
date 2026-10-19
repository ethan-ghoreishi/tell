import { useState } from 'react';
import { KINDS, kind as kindOf } from '../domain/content';
import { ANSWER3, MATTERED, WENT, addCall, addPrinciple, brief, callSummary, followUp, localDay, noticed, type CallDraft } from '../domain/engine';
import { value } from '../domain/text';
import { FACTORS, type Answer3, type Call, type Factor, type Kind, type Lean, type Mattered, type Side, type TellState, type Went } from '../domain/types';
import { CutPlay, SlidePlay, mark } from '../mechanics';
import { store } from '../store/store';
import { copy, randomId, shortDate } from '../ui';

// Decide: a real call through the same mechanics, with the player's own words.
// Follow-up: three taps that close it, in Tell's fixed vocabulary plus the
// player's own words, which never leave the device.

type Stage = 'setup' | 'matters' | 'cut' | 'lean' | 'slide' | 'unknowns' | 'summary';

interface Draft {
  title: string;
  kind?: Kind;
  options: [string, string];
  selected: string[];
  own: { id: string; text: string; factor: Factor }[];
  order: string[];
  lean: Lean;
  slide?: CallDraft['slide'];
  unknowns: { id: string; text: string; check?: string; answer?: Answer3 }[];
  due: number;
}

const DUE = [
  { days: 7, label: 'In a week' },
  { days: 14, label: 'In two weeks' },
  { days: 30, label: 'In a month' },
];

export default function Decide({ state }: { state: TellState }) {
  const [stage, setStage] = useState<Stage>('setup');
  const [d, setD] = useState<Draft>({ title: '', options: ['', ''], selected: [], own: [], order: [], lean: 'none', unknowns: [], due: 14 });
  const set = (patch: Partial<Draft>) => setD({ ...d, ...patch });
  const k = d.kind;
  const items = k ? [...k.features, ...d.own].filter((f) => d.selected.includes(f.id)) : [];
  const side = (s: Side) => d.options[s === 'a' ? 0 : 1];
  const other = d.lean === 'a' ? side('b') : side('a');

  const toCall = (): CallDraft => ({
    kind: k!.id,
    title: d.title.trim(),
    options: [d.options[0].trim(), d.options[1].trim()],
    items: items.map((i) => ({ id: i.id, factor: i.factor, text: i.text, ...(d.own.some((o) => o.id === i.id) ? { own: true as const } : {}) })),
    order: d.order,
    winner: items.find((i) => !d.order.includes(i.id))!.id,
    lean: d.lean,
    ...(d.slide ? { slide: d.slide } : {}),
    unknowns: d.unknowns.map((u) => ({ id: u.id, text: u.text, ...(u.check ? { check: u.check } : {}), answer: u.answer ?? 'unsure' })),
  });

  const head = (step: number, title: string) => (
    <header className="stack-tight">
      <p className="small dim num">Decide · step {step} of 5</p>
      <h1 className="title">{title}</h1>
    </header>
  );

  if (stage === 'setup') {
    const ready = d.title.trim() && k && d.options.every((o) => o.trim());
    return (
      <div className="stack-lg">
        {head(1, 'What’s the call?')}
        <label className="field">
          <span className="small">In a few words</span>
          <input className="input" value={d.title} placeholder="Which laptop to buy" onChange={(e) => set({ title: e.target.value })} />
        </label>
        <div className="stack">
          <p className="small" id="kind">
            What kind of call is it?
          </p>
          <div className="options" role="group" aria-labelledby="kind">
            {KINDS.map((x) => (
              <button
                key={x.id}
                className={`option${k?.id === x.id ? ' on' : ''}`}
                aria-pressed={k?.id === x.id}
                onClick={() => set({ kind: x, selected: x.defaults, options: x.options.every(Boolean) ? x.options : d.options })}
              >
                <strong className="option-title">{x.name}</strong>
                <span className="small dim option-line">{x.example}</span>
              </button>
            ))}
          </div>
        </div>
        {(['a', 'b'] as Side[]).map((s, i) => (
          <label key={s} className="field">
            <span className="small">Option {s.toUpperCase()}</span>
            <input
              className="input"
              value={d.options[i]}
              placeholder={i ? 'The other one' : 'One option'}
              onChange={(e) => set({ options: (i ? [d.options[0], e.target.value] : [e.target.value, d.options[1]]) as [string, string] })}
            />
          </label>
        ))}
        <button className="btn btn-primary btn-block" disabled={!ready} onClick={() => setStage('matters')}>
          Next
        </button>
      </div>
    );
  }

  if (stage === 'matters') return <Matters draft={d} set={set} onNext={() => setStage('cut')} head={head(2, 'What matters here?')} />;

  if (stage === 'cut') {
    return (
      <div className="stack-lg">
        {head(2, 'What matters most?')}
        <CutPlay
          eyebrow="Your call"
          scene={`${d.title}: imagine you could have all five.`}
          items={items}
          onDone={(order) => {
            set({ order });
            setStage('lean');
          }}
        />
      </div>
    );
  }

  if (stage === 'lean') {
    return (
      <div className="stack-lg">
        {head(3, 'Which way are you leaning?')}
        <div className="options">
          {(['a', 'b'] as Side[]).map((s) => (
            <button
              key={s}
              className="option"
              onClick={() => {
                set({ lean: s });
                setStage('slide');
              }}
            >
              {side(s)}
            </button>
          ))}
        </div>
        <button
          className="btn btn-ghost btn-block"
          onClick={() => {
            set({ lean: 'none', slide: undefined });
            setStage('unknowns');
          }}
        >
          Too close to call
        </button>
      </div>
    );
  }

  if (stage === 'slide' && k && d.lean !== 'none') {
    const lean = side(d.lean);
    const dial = { unit: k.dial.unit, steps: k.dial.steps, rises: 'b' as const, measure: `How much it takes to switch you to ${other}` };
    return (
      <div className="stack-lg">
        {head(3, 'What would switch you?')}
        <SlidePlay
          texts={(i) => {
            const amount = i === null ? '…' : mark(value(k.dial.unit, k.dial.steps[i], state.currency));
            return { scene: `Would you still pick ${lean} if it ${k.dial.phrase.replace('{x}', amount)}?`, a: `Still ${lean}`, b: `Switch to ${other}` };
          }}
          dial={dial}
          currency={state.currency}
          eyebrow="Your call"
          onDone={(p) => {
            set({ slide: { unit: k.dial.unit, steps: k.dial.steps, phrase: k.dial.phrase, asked: p.asked, outcome: p.outcome } });
            setStage('unknowns');
          }}
        />
      </div>
    );
  }

  if (stage === 'unknowns' && k) {
    return <Unknowns state={state} draft={d} set={set} other={d.lean === 'none' ? null : other} onNext={() => setStage('summary')} head={head(4, 'What don’t you know yet?')} />;
  }

  const call = toCall();
  return (
    <div className="stack-lg">
      {head(5, 'What became clearer')}
      <ul className="stack">
        {callSummary({ ...call, id: '', at: '', day: '', due: '' }, state.currency).map((l) => (
          <li key={l}>{l}</li>
        ))}
      </ul>
      <div className="stack">
        <p className="small" id="due">
          When should Tell ask how it went?
        </p>
        <div className="chips" role="group" aria-labelledby="due">
          {DUE.map((x) => (
            <button key={x.days} className={`chip${d.due === x.days ? ' on' : ''}`} aria-pressed={d.due === x.days} onClick={() => set({ due: x.days })}>
              {x.label}
            </button>
          ))}
        </div>
      </div>
      <button
        className="btn btn-primary btn-block"
        onClick={() => {
          store.update((s) => addCall(s, call, d.due, new Date()));
          const saved = store.get();
          if (saved.status === 'ready') location.hash = `#/call/${saved.state.calls.at(-1)!.id}`;
        }}
      >
        Save the call
      </button>
    </div>
  );
}

function Matters({ draft: d, set, onNext, head }: { draft: Draft; set: (p: Partial<Draft>) => void; onNext: () => void; head: React.ReactNode }) {
  const [text, setText] = useState('');
  const [factor, setFactor] = useState<Factor | null>(null);
  const all = [...d.kind!.features, ...d.own];
  const toggle = (id: string) => set({ selected: d.selected.includes(id) ? d.selected.filter((x) => x !== id) : [...d.selected, id] });
  return (
    <div className="stack-lg">
      {head}
      <p className="dim num">Pick five. {d.selected.length === 5 ? 'Five picked.' : `${d.selected.length} of 5 picked.`}</p>
      <div className="options">
        {all.map((f) => {
          const on = d.selected.includes(f.id);
          return (
            <button key={f.id} className={`option${on ? ' on' : ''}`} aria-pressed={on} disabled={!on && d.selected.length >= 5} onClick={() => toggle(f.id)}>
              {f.text}
            </button>
          );
        })}
      </div>
      <div className="card-quiet stack">
        <label className="field">
          <span className="small">Something else that matters</span>
          <input className="input" value={text} placeholder="In your own words" onChange={(e) => setText(e.target.value)} />
        </label>
        {text.trim() && (
          <>
            <p className="small" id="closest">
              Which is it closest to?
            </p>
            <div className="chips" role="group" aria-labelledby="closest">
              {FACTORS.map((f) => (
                <button key={f.id} className={`chip${factor === f.id ? ' on' : ''}`} aria-pressed={factor === f.id} onClick={() => setFactor(f.id)}>
                  {f.name}
                </button>
              ))}
            </div>
            <button
              className="btn btn-sm"
              disabled={!factor}
              onClick={() => {
                const id = `own-${d.own.length + 1}`;
                set({ own: [...d.own, { id, text: text.trim(), factor: factor! }], selected: d.selected.length < 5 ? [...d.selected, id] : d.selected });
                setText('');
                setFactor(null);
              }}
            >
              Add it
            </button>
          </>
        )}
      </div>
      <button className="btn btn-primary btn-block" disabled={d.selected.length !== 5} onClick={onNext}>
        Next
      </button>
    </div>
  );
}

function Unknowns(props: { state: TellState; draft: Draft; set: (p: Partial<Draft>) => void; other: string | null; onNext: () => void; head: React.ReactNode }) {
  const { state, draft: d, set, other, onNext, head } = props;
  const [text, setText] = useState('');
  const k = d.kind!;
  const n = noticed(state, k.id);
  const badge = (id: string) => {
    const mine = n.mine.missed.find((x) => x.id === id)?.count;
    const shared = n.shared.missed.find((x) => x.id === id)?.count;
    return [mine && `missed in ${mine} of your calls`, shared && `missed in ${shared} shared calls`].filter(Boolean).join(' · ');
  };
  const picked = (id: string) => d.unknowns.some((u) => u.id === id);
  const toggle = (u: Draft['unknowns'][number]) => set({ unknowns: picked(u.id) ? d.unknowns.filter((x) => x.id !== u.id) : [...d.unknowns, u] });
  const answer = (id: string, a: Answer3) => set({ unknowns: d.unknowns.map((u) => (u.id === id ? { ...u, answer: a } : u)) });

  return (
    <div className="stack-lg">
      {head}
      <p className="dim">Pick up to four things you don’t know yet. Tell’s list is written by Tell; marks show what people noticed only afterwards.</p>
      <div className="options">
        {k.checks.map((c) => {
          const on = picked(c.id);
          const b = badge(c.id);
          return (
            <button key={c.id} className={`option${on ? ' on' : ''}`} aria-pressed={on} disabled={!on && d.unknowns.length >= 4} onClick={() => toggle({ id: c.id, text: c.text, check: c.id })}>
              {c.text}
              {b && <span className="tiny faint option-line">{b}</span>}
            </button>
          );
        })}
        {d.unknowns
          .filter((u) => !u.check)
          .map((u) => (
            <button key={u.id} className="option on" aria-pressed onClick={() => toggle(u)}>
              {u.text}
            </button>
          ))}
      </div>
      <div className="card-quiet stack">
        <label className="field">
          <span className="small">Something else you don’t know</span>
          <input className="input" value={text} placeholder="In your own words" onChange={(e) => setText(e.target.value)} />
        </label>
        <button
          className="btn btn-sm"
          disabled={!text.trim() || d.unknowns.length >= 4}
          onClick={() => {
            toggle({ id: `own-u-${d.unknowns.length + 1}-${text.length}`, text: text.trim() });
            setText('');
          }}
        >
          Add it
        </button>
      </div>
      {d.unknowns.length > 0 && (
        <section className="stack">
          <h2 className="section-title">{other ? `If it turned out in favour of ${other}, would you switch?` : 'If it favoured one of them, would that decide it?'}</h2>
          {d.unknowns.map((u) => (
            <div key={u.id} className="stack-tight">
              <p id={`u-${u.id}`}>{u.text}</p>
              <div className="chips" role="group" aria-labelledby={`u-${u.id}`}>
                {(Object.keys(ANSWER3) as Answer3[]).map((a) => (
                  <button key={a} className={`chip${u.answer === a ? ' on' : ''}`} aria-pressed={u.answer === a} onClick={() => answer(u.id, a)}>
                    {ANSWER3[a]}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </section>
      )}
      <button className="btn btn-primary btn-block" disabled={d.unknowns.some((u) => !u.answer)} onClick={onNext}>
        {d.unknowns.length ? 'Next' : 'Nothing unknown. Next'}
      </button>
    </div>
  );
}

/** A saved call: what became clearer, the brief for your AI, and the follow-up. */
export function CallPage({ state, id }: { state: TellState; id: string }) {
  const call = state.calls.find((c) => c.id === id);
  const [copied, setCopied] = useState<string | null>(null);
  if (!call) {
    return (
      <div className="stack-lg">
        <h1 className="title">That call isn’t here</h1>
        <a className="link" href="#/map">
          See your map
        </a>
      </div>
    );
  }
  const k = kindOf(call.kind);
  const text = brief(call, k?.name ?? call.kind, state.currency);
  return (
    <div className="stack-xl">
      <header className="stack">
        <p className="eyebrow">
          {k?.name ?? call.kind} · {shortDate(call.day)}
        </p>
        <h1 className="title">{call.title}</h1>
        <p className="dim">
          {call.options[0]} or {call.options[1]}
        </p>
      </header>
      <section className="stack">
        <h2 className="section-title">What became clearer</h2>
        <ul className="stack">
          {callSummary(call, state.currency).map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      </section>
      <section className="stack">
        <h2 className="section-title">A brief for your AI</h2>
        <p className="small dim">Paste it into a chat with your own AI, so it starts from what you found.</p>
        <pre className="brief" aria-label="Brief">
          {text}
        </pre>
        <button className="btn btn-block" onClick={() => copy(text).then((ok) => setCopied(ok ? 'Copied.' : 'Select the text above to copy it.'))}>
          Copy the brief
        </button>
        {copied && (
          <p className="small dim" role="status">
            {copied}
          </p>
        )}
      </section>
      {call.follow ? <Closed call={call} kind={k} /> : <FollowUp call={call} kind={k} />}
    </div>
  );
}

function Closed({ call, kind: k }: { call: Call; kind?: Kind }) {
  const f = call.follow!;
  const item = (id: string) => call.items.find((i) => i.id === id)?.text ?? id;
  return (
    <section className="stack">
      <h2 className="section-title">How it went</h2>
      <p>
        You chose {f.chose === 'neither' ? 'neither yet' : call.options[f.chose === 'a' ? 0 : 1]}. {WENT[f.went]}.
      </p>
      <ul className="evidence">
        {f.mattered.map((m) => (
          <li key={m.item}>
            <span>{item(m.item)}</span>
            <span className="pick-mark">{MATTERED[m.how]}</span>
          </li>
        ))}
      </ul>
      {f.missed.length > 0 && (
        <p className="small">Hadn’t considered: {f.missed.map((m) => (m.check ? (k?.checks.find((c) => c.id === m.check)?.text ?? m.check) : m.text)).join('; ')}.</p>
      )}
    </section>
  );
}

function FollowUp({ call, kind: k }: { call: Call; kind?: Kind }) {
  const [chose, setChose] = useState<Side | 'neither' | null>(null);
  const [went, setWent] = useState<Went | null>(null);
  const [mattered, setMattered] = useState<Record<string, Mattered>>({});
  const [missed, setMissed] = useState<string[]>([]);
  const [other, setOther] = useState('');
  const [principle, setPrinciple] = useState('');
  const asked = new Set(call.unknowns.map((u) => u.check));
  const checks = (k?.checks ?? []).filter((c) => !asked.has(c.id));
  const group = <T extends string>(label: string, id: string, options: [T, string][], value: T | null | undefined, onPick: (v: T) => void) => (
    <div className="stack-tight">
      <p className="small" id={id}>
        {label}
      </p>
      <div className="chips" role="group" aria-labelledby={id}>
        {options.map(([v, text]) => (
          <button key={v} className={`chip${value === v ? ' on' : ''}`} aria-pressed={value === v} onClick={() => onPick(v)}>
            {text}
          </button>
        ))}
      </div>
    </div>
  );
  const dueText = call.due <= localDay(new Date()) ? 'It’s due now.' : `Tell will ask on ${shortDate(call.due)}; you can answer any time.`;

  return (
    <section className="stack-lg" aria-labelledby="follow">
      <div className="stack-tight">
        <h2 className="section-title" id="follow">
          How did it go?
        </h2>
        <p className="small dim">{dueText}</p>
      </div>
      {group('What did you choose?', 'chose', [['a', call.options[0]], ['b', call.options[1]], ['neither', 'Neither yet']], chose, setChose)}
      {group('How did it turn out?', 'went', Object.entries(WENT) as [Went, string][], went, setWent)}
      {call.items.map((i) => (
        <div key={i.id}>{group(`${i.text}: how much did it matter?`, `m-${i.id}`, Object.entries(MATTERED) as [Mattered, string][], mattered[i.id], (v) => setMattered({ ...mattered, [i.id]: v }))}</div>
      ))}
      <div className="stack-tight">
        <p className="small" id="missed">
          Anything you hadn’t considered that mattered?
        </p>
        <div className="chips" role="group" aria-labelledby="missed">
          {checks.map((c) => {
            const on = missed.includes(c.id);
            return (
              <button key={c.id} className={`chip${on ? ' on' : ''}`} aria-pressed={on} onClick={() => setMissed(on ? missed.filter((x) => x !== c.id) : [...missed, c.id])}>
                {c.text}
              </button>
            );
          })}
        </div>
        <input className="input" value={other} placeholder="Something else, in your own words" aria-label="Something else you hadn’t considered" onChange={(e) => setOther(e.target.value)} />
      </div>
      <label className="field">
        <span className="small">A principle worth keeping (optional)</span>
        <input className="input" value={principle} placeholder="When I…, I…" onChange={(e) => setPrinciple(e.target.value)} />
      </label>
      <button
        className="btn btn-primary btn-block"
        disabled={!chose || !went}
        onClick={() =>
          store.update((s) => {
            const now = new Date();
            const closed = followUp(
              s,
              call.id,
              {
                lesson: randomId(),
                chose: chose!,
                went: went!,
                mattered: Object.entries(mattered).map(([item, how]) => ({ item, how })),
                missed: [...missed.map((check) => ({ check })), ...(other.trim() ? [{ text: other.trim() }] : [])],
              },
              now,
            );
            return addPrinciple(closed, principle, now, call.id);
          })
        }
      >
        Close the call
      </button>
      <p className="tiny faint">What you write here stays on this device. Sharing lessons from the Map shares only Tell’s fixed list, never your words.</p>
    </section>
  );
}
