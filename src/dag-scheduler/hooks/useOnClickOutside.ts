import { useEffect, MutableRefObject } from 'react';

type UseOnClickOutsideHandler = (
  ref: MutableRefObject<HTMLElement | null>,
  handler: (e: Event) => void
) => void;

export const useOnClickOutside: UseOnClickOutsideHandler = (ref, handler) => {
  useEffect(() => {
    const listener = (event: Event) => {
      if (!ref.current || ref.current.contains(event.target as HTMLElement)) {
        return;
      }

      handler(event);
    };

    document.addEventListener('mousedown', listener);

    return () => document.removeEventListener('mousedown', listener);
  }, [ref, handler]);
};
