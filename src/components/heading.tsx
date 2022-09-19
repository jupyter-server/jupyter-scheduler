import React from 'react';

export interface IHeadingProps {
  children?: React.ReactNode;
  level: number;
}

export function Heading(props: IHeadingProps): JSX.Element {
  switch (props.level) {
    case 1:
      return <h1 className="jp-jobs-Heading">{props.children}</h1>;
    case 2:
      return <h2 className="jp-jobs-Heading">{props.children}</h2>;
    case 3:
      return <h3 className="jp-jobs-Heading">{props.children}</h3>;
    default:
      return <h1 className="jp-jobs-Heading">{props.children}</h1>;
  }
}
