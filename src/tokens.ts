import { Token } from '@lumino/coreutils';

namespace Scheduler {
  export interface ICustomEnvironmentProps {
    state: any;
    setState: any;
  }

  export type ICustomEnvironment = React.FC<ICustomEnvironmentProps>;

  export const ICustomEnvironment = new Token<ICustomEnvironment>(
    '@jupyterlab/scheduler:ICustomEnvironment'
  );
}

export default Scheduler;
