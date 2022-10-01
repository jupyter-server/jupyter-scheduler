import { Token } from '@lumino/coreutils';
import { ICreateJobModel, IJobDetailModel, JobsView } from './model';

export namespace Scheduler {
  export type EnvironmentParameterValue = string | number | boolean;

  export type ErrorsType = { [key: string]: string };

  export interface IAdvancedOptionsProps {
    jobsView: JobsView;
    model: ICreateJobModel | IJobDetailModel;
    handleModelChange: (model: ICreateJobModel) => void;
    errors: ErrorsType;
    handleErrorsChange: (errors: ErrorsType) => void;
  }

  export type IAdvancedOptions = React.FC<IAdvancedOptionsProps>;

  export const IAdvancedOptions = new Token<IAdvancedOptions>(
    '@jupyterlab/scheduler:IAdvancedOptions'
  );
}
