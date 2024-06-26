import React, { FC, useEffect, useState } from 'react';
import { closeIcon } from '@jupyterlab/ui-components';
import { validate } from 'email-validator';
import { Contact } from '../../types';
import { Focusable } from './focusable';

type Props = {
  value: Contact;
  isSelected: boolean;
  onEdit: () => void;
  onRemove: () => void;
  onSelect: () => void;
};

export const Pill: FC<Props> = ({
  value,
  onEdit,
  onRemove,
  onSelect,
  isSelected
}) => {
  const [isValid, setIsValid] = useState(true);

  useEffect(() => setIsValid(validate(value.email)), [value.email]);

  const className = [
    'pill',
    isValid ? '' : 'invalid',
    isSelected ? 'selected' : ''
  ];

  return (
    <Focusable isSelected={isSelected}>
      <div
        onClick={onSelect}
        onDoubleClick={onEdit}
        className={className.join(' ')}
      >
        <span>{value.name || value.email}</span>
        <span onClick={onRemove} className="close-icon">
          <closeIcon.react width={12} height={12} />
        </span>
      </div>
    </Focusable>
  );
};
