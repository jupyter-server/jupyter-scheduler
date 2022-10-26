import { Token } from '@lumino/coreutils';
import {
  ICreateJobModel,
  IJobDefinitionModel,
  IJobDetailModel,
  JobsView
} from './model';

export namespace Scheduler {
  export type EnvironmentParameterValue = string | number | boolean;

  export type ErrorsType = { [key: string]: string };

  type ModelType = ICreateJobModel | IJobDetailModel | IJobDefinitionModel;

  export interface IAdvancedOptionsProps {
    jobsView: JobsView;
    model: ModelType;
    handleModelChange: (model: ModelType) => void;
    errors: ErrorsType;
    handleErrorsChange: (errors: ErrorsType) => void;
  }

  export type IAdvancedOptions = React.FC<IAdvancedOptionsProps>;

  export const IAdvancedOptions = new Token<IAdvancedOptions>(
    '@jupyterlab/scheduler:IAdvancedOptions'
  );
}
