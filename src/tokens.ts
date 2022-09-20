import { Token } from '@lumino/coreutils';

namespace SchedulerExtension {
  export interface ICustomEnvironmentProps {
    state: any;
    setState: any;
  }

  export type ICustomEnvironment = React.FC<ICustomEnvironmentProps>;
  
  export const ICustomEnvironment = new Token<ICustomEnvironment>(
    'scheduler-extension-custom-environment:ICustomEnvironment'
  );
}

export default SchedulerExtension;