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

  interface IAdvancedOptionsSharedProps {
    errors: ErrorsType;
    handleErrorsChange: (errors: ErrorsType) => void;
  }

  interface IAdvancedOptionsCreateProps extends IAdvancedOptionsSharedProps {
    jobsView: JobsView.CreateForm;
    model: ICreateJobModel;
    handleModelChange: (model: ICreateJobModel) => void;
  }

  interface IAdvancedOptionsJobDetailProps extends IAdvancedOptionsSharedProps {
    jobsView: JobsView.JobDetail;
    model: IJobDetailModel;
    handleModelChange: (model: IJobDetailModel) => void;
  }

  interface IAdvancedOptionsJobDefinitionDetailProps
    extends IAdvancedOptionsSharedProps {
    jobsView: JobsView.JobDefinitionDetail;
    model: IJobDefinitionModel;
    handleModelChange: (model: IJobDefinitionModel) => void;
  }

  export type IAdvancedOptionsProps =
    | IAdvancedOptionsCreateProps
    | IAdvancedOptionsJobDetailProps
    | IAdvancedOptionsJobDefinitionDetailProps;

  export type IAdvancedOptions = React.FC<IAdvancedOptionsProps>;

  export const IAdvancedOptions = new Token<IAdvancedOptions>(
    '@jupyterlab/scheduler:IAdvancedOptions'
  );
}
