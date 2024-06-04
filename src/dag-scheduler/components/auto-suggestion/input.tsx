import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  FC
} from 'react';

const MIN_WIDTH = 10;
const MAX_WIDTH = 250;

type Props = {
  value: string;
  onKeyUp: () => void;
  onFocus: () => void;
  onKeyDown: () => void;
  onHiddenKeyUp: () => void;
  onHiddenKeyDown: () => void;
  showPlaceholder: boolean;
};

export type RefHandlers = {
  focus: () => void;
  focusHidden: () => void;
  getValue: () => string;
  resetText: () => void;
};

const InputComponent: FC<Props> = (
  {
    onKeyUp,
    onFocus,
    onKeyDown,
    value = '',
    onHiddenKeyUp,
    onHiddenKeyDown,
    showPlaceholder = false
  },
  ref
) => {
  const hiddenRef = useRef<HTMLInputElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const hiddenDivRef = useRef<HTMLDivElement | null>(null);
  const [currentValue, setCurrentValue] = useState(value);

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
    focusHidden: () => hiddenRef.current?.focus(),
    getValue: () => inputRef.current?.value,
    resetText: () => {
      setCurrentValue('');
      inputRef.current?.focus();

      if (hiddenDivRef.current && inputRef.current) {
        hiddenDivRef.current.innerHTML = '';
        inputRef.current.style.width = `${MIN_WIDTH}px`;
      }
    }
  }));

  useEffect(() => {
    if (hiddenDivRef.current) {
      hiddenDivRef.current.innerText = currentValue;
    }

    const currentWidth = hiddenDivRef.current?.clientWidth as number;
    const width =
      currentWidth <= MAX_WIDTH ? currentWidth + MIN_WIDTH : MAX_WIDTH;

    if (inputRef.current?.value) {
      inputRef.current.style.width = `${width}px`;
    }
  }, [currentValue]);

  useEffect(() => inputRef.current?.select(), [value]);

  const handleChange = (e: any) => {
    setCurrentValue(e.currentTarget?.value?.replace(/(\r\n|\n|\r)/gm, ''));
  };

  return (
    <label htmlFor="input">
      <div
        ref={hiddenDivRef}
        style={{
          left: '-9999px',
          position: 'absolute'
        }}
      />
      <textarea
        rows={1}
        wrap="off"
        id="input"
        ref={inputRef}
        value={currentValue}
        onFocus={onFocus}
        onKeyUp={onKeyUp}
        onChange={handleChange}
        onKeyDown={onKeyDown}
        className={showPlaceholder ? 'placeholder' : ''}
        placeholder={showPlaceholder ? 'Add people and groups' : ''}
      />
      <input
        tabIndex={-1}
        ref={hiddenRef}
        aria-hidden="true"
        onKeyUp={onHiddenKeyUp}
        className="hidden-input"
        onKeyDown={onHiddenKeyDown}
      />
    </label>
  );
};

export const Input = forwardRef(InputComponent as any) as any;
