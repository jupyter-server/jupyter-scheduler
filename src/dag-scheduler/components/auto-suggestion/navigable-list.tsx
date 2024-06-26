import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
  FC
} from 'react';
import { Contact } from '../../types';
import { Focusable } from './focusable';

type Props = {
  items: string[];
  onSelect: (value: string) => void;
};

export type RefHandlers = {
  getSelectedItem: () => Contact;
  navigate: (dir: number) => number;
};

const getPic = (name: string): string => {
  const [firstName = '', lastName = ''] = name.split(' ').map(d => d[0]);

  return `${firstName.toUpperCase()}${lastName.toUpperCase()}`;
};

export const NavigableListComponent: FC<Props> = ({ items, onSelect }, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const getNextIndex = useCallback(
    (dir: number) => (index: number) => {
      const nextIndex = dir + index;
      const maxIndex = items.length - 1;

      return nextIndex > maxIndex ? 0 : nextIndex < 0 ? maxIndex : nextIndex;
    },
    [items]
  );

  useImperativeHandle(
    ref,
    () => ({
      getSelectedItem: () => items[selectedIndex],
      navigate: (dir: number) => setSelectedIndex(getNextIndex(dir))
    }),
    [items, getNextIndex, selectedIndex]
  );

  useEffect(() => setSelectedIndex(-1), [items.length]);

  const handleSelect = (d: string, e: any) => {
    e.preventDefault();
    e.stopPropagation();

    onSelect(d);
  };

  return (
    <ul className="suggestions">
      {items.map((item: any, index) => (
        <Focusable key={index} isSelected={selectedIndex === index}>
          <li className={selectedIndex === index ? 'selected' : ''}>
            <a href="/#" onClick={handleSelect.bind(null, item)}>
              <div className="profile-pic">
                {getPic(item.name || item.email)}
              </div>
              <div className="suggestion-text">
                {item.name && <div>{item.name}</div>}
                <div>{item.email}</div>
              </div>
            </a>
          </li>
        </Focusable>
      ))}
    </ul>
  );
};

export const NavigableList = forwardRef(NavigableListComponent as any) as any;
