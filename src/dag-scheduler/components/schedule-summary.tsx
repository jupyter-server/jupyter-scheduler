import React, { FC } from 'react';

import cronstrue from 'cronstrue';

type Props = {
  schedule: string | undefined;
};

export const ScheduleSummary: FC<Props> = props => {
  if (props.schedule === undefined) {
    return null;
  }

  if (props.schedule.toLocaleLowerCase() === '@once') {
    return <>{props.schedule}</>;
  }

  return <>{cronstrue.toString(props.schedule)}</>;
};
