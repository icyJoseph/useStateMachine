import * as React from 'react';
import { useSubscription } from 'use-subscription';

/*
 * For this example, consider this to be an API you can't modify.
 * You can only consume it.
 *
 * If you have a type of stream, or subscription, you could try to
 * shape it in this form, and expose an read and onChange (or which ever event)
 * and return those to use them from within the state machine.
 *
 */

type VoidCb = () => void;
type OnChange = (idle: boolean) => void;

export const useTextStream = () => {
  const ref = React.useRef<HTMLTextAreaElement>(null);
  const [source, setSource] = React.useState<HTMLTextAreaElement | null>(null);

  React.useEffect(() => {
    if (ref.current) {
      const element = ref.current;
      setSource(element);
    }
  }, []);

  const _onChange = React.useRef<OnChange[]>([]);

  const [idle, setIdle] = React.useState(false);

  const subscription = React.useMemo(
    () => ({
      getCurrentValue: () => source?.value ?? '',
      subscribe: (callback: VoidCb) => {
        source?.addEventListener('input', callback);
        return () => source?.removeEventListener('input', callback);
      },
    }),
    [source]
  );

  const value = useSubscription(subscription);

  React.useEffect(() => {
    setIdle(false);
    const timer = setTimeout(() => setIdle(true), 1000);
    return () => clearTimeout(timer);
  }, [value]);

  React.useEffect(() => {
    _onChange.current.forEach(cb => cb(idle));
  }, [idle]);

  const read = (callback: (value: string) => void) => {
    if (typeof callback === 'function') {
      callback(value);
    }
  };

  const onChange = React.useCallback((handler: OnChange) => {
    _onChange.current.push(handler);
  }, []);

  return [read, onChange, ref] as const;
};
