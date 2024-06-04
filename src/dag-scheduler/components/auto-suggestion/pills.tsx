import React, {
  forwardRef,
  useEffect,
  useCallback,
  useImperativeHandle,
  useState,
  FC
} from 'react';
import { Pill } from './pill';
import { usePrevious } from '../../hooks/usePrevious';

type Props = {
  items: string[];
  children: React.ReactNode[];
  onRemove: (index: number) => void;
};

export type RefHandlers = {
  reset: () => void;
  getEditIndex: () => number;
  getSelectedIndex: () => number;
  setEditable: (index: number) => void;
  navigate: (direction: number) => void;
};

export const PillsComponent: FC<Props> = (
  { items, children, onRemove },
  ref
) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const previousLength = usePrevious<number>(items.length);
  const previousIndex = usePrevious(selectedIndex);
  const [editIndex, setEditIndex] = useState(-1);

  const getNextIndex = useCallback(
    (direction: number) => (index: number) => {
      const nextIndex = direction + index;
      const maxIndex = items.length - 1;

      return nextIndex < 0
        ? 0
        : nextIndex > maxIndex
        ? maxIndex + 1
        : nextIndex;
    },
    [items]
  );

  const handleEditPill = useCallback(
    (index: number) => setEditIndex(index),
    []
  );
  const handlePillSelect = useCallback(
    (index: number) => setSelectedIndex(index),
    []
  );

  useImperativeHandle(ref, () => ({
    reset: () => {
      setEditIndex(-1);
      setSelectedIndex(items.length);
    },
    getEditIndex: () => editIndex,
    getSelectedIndex: () => selectedIndex,
    setEditable: (index: number) => setEditIndex(index),
    navigate: (direction: number) => setSelectedIndex(getNextIndex(direction))
  }));

  useEffect(
    () =>
      setSelectedIndex(
        previousLength > items.length
          ? Math.max(0, previousIndex - 1)
          : items.length
      ),
    // previousLength & previousIndex are left out intentionally
    [items.length]
  );

  return (
    <ul className="pill-container">
      {items.map(({ id, name, email }: any, index) => (
        <li key={index}>
          {editIndex === index ? (
            <>
              {React.cloneElement(
                // NOTE: Had to cast this to unknown first, then to ReactElement
                // when we bumped to JupyterLab 4.
                children as unknown as React.ReactElement,
                { key: email, value: name ? `${name} <${email}>` : email },
                null
              )}
            </>
          ) : (
            <Pill
              value={{ id, name, email }}
              onRemove={() => onRemove(index)}
              isSelected={selectedIndex === index}
              onEdit={() => handleEditPill(index)}
              onSelect={() => handlePillSelect(index)}
            />
          )}
        </li>
      ))}
      {editIndex === -1 && <li key="child-component">{children}</li>}
    </ul>
  );
};

export const Pills = forwardRef(PillsComponent as any) as any;
