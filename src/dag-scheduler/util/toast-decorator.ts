import { AsyncActionHandler } from '../components/async-action-handler';

export interface IToastOptions {
  pending: string;
  success?: string;
  failure?: string;
}

export function Toast(options: IToastOptions) {
  return function (
    target: unknown,
    prop: string,
    descriptor: TypedPropertyDescriptor<(...arg: any[]) => any>
  ): any {
    const method = descriptor.value;

    if (target instanceof Function) {
      // for static methods return function itself
      return target;
    }

    descriptor.value = function (...args: any[]) {
      const returnValue = method?.apply(this, [...args]);
      const asyncHandler = new AsyncActionHandler({
        action: returnValue,
        title: options.pending,
        successMessage: options.success,
        failureMessage: options.failure
      });

      if (returnValue instanceof Promise) {
        (async () => {
          try {
            await Promise.all([returnValue, asyncHandler.start()]);
          } catch (e) {
            console.error('e', e);
          }
        })();
      }

      return returnValue;
    };
  };
}
