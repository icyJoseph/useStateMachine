import * as React from 'react';
import * as ReactDOM from 'react-dom';
import useStateMachine from '@cassiozen/usestatemachine';
import { useSubscription } from 'use-subscription';
import { readingTime } from 'reading-time-estimator';

import './index.css';

/*
 * In this example we subscribe to a text stream
 */

type ReadingContext = {
  data?: ReturnType<typeof readingTime>;
};

type ContextUpdate<Context> = (context: Context) => Context;
type UpdateFn = React.Dispatch<ContextUpdate<ReadingContext | undefined>>;

const useTextStream = <T, V = string>(element: HTMLTextAreaElement | null, callback: (ctx: T, value: V) => T) => {
  const sendRef = React.useRef<React.Dispatch<'IDLE' | 'INPUT'> | null>(null);
  const [idle, setIdle] = React.useState(false);

  const subscription = React.useMemo(
    () => ({
      getCurrentValue: () => element?.value,
      subscribe: (callback: () => void) => {
        element?.addEventListener('input', callback);
        return () => element?.removeEventListener('input', callback);
      },
    }),
    [element]
  );

  const value = useSubscription(subscription);

  React.useEffect(() => {
    setIdle(false);
    const timer = setTimeout(() => setIdle(true), 1000);
    return () => clearTimeout(timer);
  }, [value]);

  React.useEffect(() => {
    sendRef.current?.(idle ? 'IDLE' : 'INPUT');
  }, [idle]);

  return (send: React.Dispatch<'IDLE' | 'INPUT'>, update?: UpdateFn) => {
    sendRef.current = send;
    console.count('sub');
    update?.((ctx: T) => callback(ctx, value));
  };
};

function App() {
  const ref = React.useRef<HTMLTextAreaElement>(null);
  const [source, setSource] = React.useState<HTMLTextAreaElement | null>(null);

  React.useEffect(() => {
    if (ref.current) {
      const element = ref.current;
      setSource(element);
    }
  }, []);

  const subscription = useTextStream<ReadingContext>(source, (_, text) => ({ data: readingTime(text) }));

  const [machine] = useStateMachine<ReadingContext>()({
    initial: 'idle',
    verbose: true,
    states: {
      writing: {
        on: {
          IDLE: 'idle',
        },
        effect(send) {
          subscription(send);
        },
      },
      idle: {
        on: {
          INPUT: 'writing',
        },
        effect(send, update) {
          subscription(send, update);
        },
      },
    },
  });

  return (
    <React.Fragment>
      <h1>Estimate reading time</h1>
      <p>{machine.value}</p>
      <p>{machine?.context?.data?.text}</p>
      <textarea ref={ref} rows={4} />
    </React.Fragment>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));
