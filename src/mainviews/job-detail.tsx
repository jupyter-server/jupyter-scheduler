import React from 'react';

import { IJobDetailModel, JobsView } from '../model';

export interface IJobDetailProps {
  model: IJobDetailModel;
  modelChanged: (model: IJobDetailModel) => void;
  setView: (view: JobsView) => void;
}

export function JobDetail(props: IJobDetailProps): JSX.Element {
  return <h1>Hi there!</h1>;
}
