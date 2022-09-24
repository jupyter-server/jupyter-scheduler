import { Token } from '@lumino/coreutils';
import { ICreateJobModel, JobsView } from './model';

namespace Scheduler {

  export type EnvironmentParameterValue = string | number | boolean

  type ErrorsType = { [key: string]: string; };

  export interface IAdvancedOptionsProps {
    mode: JobsView;
    model: ICreateJobModel;
    modelChanged: (model: ICreateJobModel) => void;
    errors: ErrorsType;
    errorsChanged: (errors: ErrorsType) => void;
  }

  export type IAdvancedOptions =
    React.FC<IAdvancedOptionsProps>;

  export const IAdvancedOptions = new Token<IAdvancedOptions>(
    '@jupyterlab/scheduler:IAdvancedOptions'
  );
}

export default Scheduler;
