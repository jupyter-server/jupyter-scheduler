import React, { useEffect, FC, useRef } from 'react';

type Props = {
  children: React.ReactElement;
  isSelected: boolean;
};

export const Focusable: FC<Props> = ({ children, isSelected }) => {
  const ref = useRef<HTMLLIElement>(null);

  useEffect(() => {
    isSelected && ref.current?.scrollIntoView();
  }, [isSelected]);

  return React.cloneElement(children, { ref });
};
