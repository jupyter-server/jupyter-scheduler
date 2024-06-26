import React, { useCallback, useRef, FC } from 'react';
import { Input, RefHandlers as InputRefHandlers } from './input';
import { Pills, RefHandlers } from './pills';
import { NavigableList, RefHandlers as ListRefHander } from './navigable-list';
import { useOnClickOutside } from '../../hooks/useOnClickOutside';
import { Contact } from '../../types';

// 50 characters for each name and email should be good enough
export const REGEX = /^([a-zA-Z][^<>]{1,50})<([^<>]{1,50})>/i;

type Props = {
  value: Contact[];
  contacts?: Contact[];
  onChange: (value: []) => void;
  onSearch: (value: string) => void;
};

const AutoSuggestionInput: FC<Props> = ({
  onChange,
  onSearch,
  value: pills,
  contacts = []
}) => {
  const canDelete = useRef(true);
  const ref = useRef<InputRefHandlers | null>(null);
  const listRef = useRef<ListRefHander | null>();
  const nodeRef = useRef<HTMLDivElement | null>(null);
  const pillsRef = useRef<RefHandlers | null>(null);

  const resetText = useCallback(() => {
    ref.current?.resetText();
    onSearch('');
  }, [ref]);

  const handleEmailAdd = useCallback(
    (pills: any, ignoreEdits = false) => {
      const currentIndex = pillsRef.current?.getEditIndex();

      if (!ignoreEdits && currentIndex !== -1) {
        pills[currentIndex as number] = pills.pop();
      }

      if (ignoreEdits) {
        pillsRef.current?.setEditable(-1);
      } else {
        pillsRef.current?.reset();
      }

      resetText();
      onChange(pills);
    },
    [onChange, resetText, pillsRef]
  );

  const handleClickOutside = useCallback(() => {
    pillsRef.current?.reset();

    const value = ref.current?.getValue().trim() || '';
    const [, name, email = value] = value.match(REGEX) || [];

    if (email) {
      handleEmailAdd([...pills, { email, name }]);
    }
  }, [ref, handleEmailAdd, pills]);

  const handleFocus = useCallback(() => {
    ref.current?.focus();
    pillsRef.current?.reset();
  }, [ref, pillsRef]);

  // TODO: Create Keyboard handler map
  const handleKeyDown = (e: any) => {
    const { value } = e.target;

    const {
      getSelectedIndex,
      getEditIndex,
      navigate: pillsNavigate,
      reset: resetInput
    } = pillsRef.current || ({} as RefHandlers);

    const { getSelectedItem, navigate: listNavigate } =
      listRef.current || ({} as ListRefHander);

    const index = getSelectedIndex();
    const editIndex = getEditIndex();
    const isInRange = index > -1 && index < pills.length;

    switch (e.key) {
      case 'Tab':
        if (e.altKey || e.shiftKey) {
          value ? setValue() : undefined;

          return;
        }

        value ? setValue() : handlePillRemove(index, true);

        break;
      case 'Enter':
        if (value) {
          return setValue();
        }

        if (isInRange) {
          pillsRef.current?.setEditable(index);
        }
        break;
      case 'Backspace':
        if (value || !canDelete.current) {
          return;
        }

        canDelete.current = false;
        handlePillRemove(pills.length - 1);
        break;
      case 'ArrowDown':
        if (!contacts.length) {
          return;
        }

        listNavigate(1);
        e.preventDefault();
        break;
      case 'ArrowUp':
        if (!contacts.length) {
          return;
        }

        listNavigate(-1);
        e.preventDefault();
        break;
      case 'ArrowLeft':
        if (value || editIndex !== -1) {
          return;
        }

        pillsNavigate(-1);
        ref.current?.focusHidden();
        break;
      case 'ArrowRight':
        if (value || !isInRange || editIndex !== -1) {
          return;
        }

        pillsNavigate(1);
        ref.current?.focusHidden();
        break;
      case 'Escape':
        handleEmailAdd(pills, true);

        break;
      default:
        break;
    }

    function setValue() {
      const isFunc = listRef.current && typeof getSelectedItem === 'function';
      const [, name, email = value] = value.trim().match(REGEX) || [];
      const newEmail = (isFunc ? getSelectedItem() : null) || { name, email };

      if (!newEmail.email.length) {
        return;
      }

      resetInput();
      e.preventDefault();
      handleEmailAdd([...pills, newEmail]);
    }
  };

  // TODO: Create Keyboard handler map and Move handler to child component
  const handlePillNavigation = (e: any) => {
    const { getSelectedIndex = () => -1, navigate: pillsNavigate } =
      pillsRef.current || ({} as RefHandlers);

    const index = getSelectedIndex();
    const isInRange = index > -1 && index < pills.length;

    switch (e.key) {
      case 'Backspace':
        if (!isInRange || !canDelete.current) {
          return;
        }

        handlePillRemove(index);
        canDelete.current = false;

        break;
      case 'ArrowLeft':
        pillsNavigate(-1);

        break;
      case 'ArrowRight':
        if (getSelectedIndex() < pills.length - 1) {
          return pillsNavigate(1);
        }

        pillsRef.current?.reset();
        setTimeout(() => ref.current?.focus(), 0);

        break;
      case 'Tab':
        if (!isInRange) {
          return;
        }

        e.preventDefault();
        pillsRef.current?.reset();
        setTimeout(() => ref.current?.focus(), 0);

        break;
      case 'Enter':
        pillsRef.current?.setEditable(index);

        break;
      default:
        break;
    }

    ref.current?.focusHidden();
  };

  const handleSuggestionSelect = useCallback(
    (item: string) => {
      handleEmailAdd([...pills, item]);
    },
    [pills, handleEmailAdd]
  );

  const handlePillRemove = useCallback(
    (index: number, ignoreEdits = false) => {
      const newPills = [...pills];

      newPills.splice(index, 1);
      handleEmailAdd(newPills, ignoreEdits);

      if (!newPills.length) {
        setTimeout(() => ref.current?.focus(), 0);
      }
    },
    [ref, pills, handleEmailAdd]
  );

  const handleHiddenKeyUp = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Backspace') {
        canDelete.current = !!pills.length;
      }
    },
    [pills.length]
  );

  const handleKeyUp = useCallback(
    (e: any) => {
      const { value } = e.target;

      handleHiddenKeyUp(e);
      onSearch(value);
    },
    [handleHiddenKeyUp]
  );

  useOnClickOutside(nodeRef, handleClickOutside);

  return (
    <div ref={nodeRef} className="autosuggest" onClick={handleFocus}>
      <div className="jp-form-group">
        <div className="jp-form-control">
          <Pills items={pills} ref={pillsRef} onRemove={handlePillRemove}>
            <Input
              ref={ref}
              onKeyUp={handleKeyUp}
              onKeyDown={handleKeyDown}
              showPlaceholder={!pills.length}
              onHiddenKeyUp={handleHiddenKeyUp}
              onHiddenKeyDown={handlePillNavigation}
            />
          </Pills>
        </div>
        <div className="suggestion-wrapper">
          {ref.current?.getValue().length && contacts.length ? (
            <NavigableList
              ref={listRef}
              items={contacts}
              onSelect={handleSuggestionSelect}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
};

export { AutoSuggestionInput };
