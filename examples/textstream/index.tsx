import * as React from 'react';
import * as ReactDOM from 'react-dom';
import useStateMachine from '@cassiozen/usestatemachine';
import { readingTime } from 'reading-time-estimator';
import { useTextStream } from './useTextStream';

import './index.css';

/*
 * In this example we subscribe to a text stream
 */

type ReadingContext = {
  data?: ReturnType<typeof readingTime>;
};

function App() {
  const [read, onChange, ref] = useTextStream();

  const [machine, send] = useStateMachine<ReadingContext>()({
    initial: 'idle',
    verbose: true,
    states: {
      writing: {
        on: {
          IDLE: 'idle',
        },
      },
      idle: {
        on: {
          INPUT: 'writing',
        },
        effect(_, update) {
          read(text => update(() => ({ data: readingTime(text, 100) })));
        },
      },
    },
  });

  // both send and onChange on this case are stable
  React.useEffect(() => onChange(idle => send(idle ? 'IDLE' : 'INPUT')), [send, onChange]);

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
