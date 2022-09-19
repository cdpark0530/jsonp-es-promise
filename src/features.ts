let callbackCount = 0;

export interface JsonpResult<R> {
  promise: Promise<R>;
  cancel: () => void;
}

export interface JsonpOptions {
  params?: string;
  timeout?: number;
  /**
   * URL parameter name to tell server jsonp callback name
   * @default "jsonp"
   */
  callbackParam?: string;
  /**
   * jsonp callback name
   */
  callbackName?: string;
  /**
   * will be ignored if `callbackName` is defined
   */
  prefix?: string;
  /**
   * URL parameter name to append to querystring to avoid script caching
   * @default "_"
   */
  incrementalParam?: string;
}

export const jsonp = <R>(url: string, options?: JsonpOptions): JsonpResult<R> => {
  const { params, prefix, timeout, callbackParam, callbackName, incrementalParam }: JsonpOptions = {
    timeout: 15000,
    params: '__callback',
    callbackParam: 'jsonp',
    prefix: '__jp',
    incrementalParam: '_',
    ...options,
  };

  const windowVarName = callbackName ?? `${prefix}${callbackCount++}`;
  let scriptEl: HTMLScriptElement | undefined = undefined;
  let timer: number | undefined = undefined;

  const noop = () => {
    //
  };
  const cleanup = () => {
    if (scriptEl) {
      scriptEl.remove();
      scriptEl = undefined;
    }

    // @ts-expect-error inevitable type-unsafe code for jsonp
    window[windowVarName] = noop;

    if (timer) {
      clearTimeout(timer);
      timer = undefined;
    }
  };

  const scriptAppendTarget = document.getElementsByTagName('script')[0] ?? document.head;

  let cancel = noop;
  const promise = new Promise<R>((resolve, reject) => {
    // @ts-expect-error inevitable type-unsafe code for jsonp
    window[windowVarName] = (data) => {
      cleanup();
      resolve(data);
    };

    cancel = () => {
      // @ts-expect-error inevitable type-unsafe code for jsonp
      if (window[windowVarName] !== noop) {
        cleanup();
        reject(new Error(`jsonp for reqeust ${windowVarName} has been canceled`));
      }
    };

    if (timeout) {
      timer = setTimeout(() => {
        cleanup();
        reject(new Error(`jsonp for reqeust ${windowVarName} has been timeout`));
      }, timeout);
    }

    if (url.indexOf('?') < 0) {
      url += '?';
    } else if (url.indexOf('?') !== url.length - 1) {
      url += '&';
    }

    const searchParams = new URLSearchParams(params);
    searchParams.append(callbackParam, windowVarName);
    searchParams.append(incrementalParam, Date.now().toString());
    url += searchParams.toString();

    scriptEl = document.createElement('script');
    scriptEl.src = url;
    scriptAppendTarget.parentNode?.insertBefore(scriptEl, scriptAppendTarget);
  });

  return {
    promise,
    cancel,
  };
};
