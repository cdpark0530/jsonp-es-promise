let callbackCount = 0;

export interface JsonpResult<R> {
  promise: Promise<R>;
  cancel: () => void;
}

export interface JsonpOptions {
  params?: string;
  timeout?: number;
  callbackName?: string;
  prefix?: string;
}

export const jsonp = <R>(url: string, options?: JsonpOptions): JsonpResult<R> => {
  const { params, prefix, timeout, callbackName } = {
    timeout: 15000,
    params: '__callback',
    prefix: '__jp',
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
    if (timeout) {
      timer = setTimeout(function () {
        cleanup();
        reject(new Error(`jsonp for reqeust ${windowVarName} has been timeout`));
      }, timeout);
    }

    // @ts-expect-error inevitable type-unsafe code for jsonp
    window[windowVarName] = (data) => {
      cleanup();
      resolve(data);
    };

    // Add querystring component
    if (url.indexOf('?') < 0) {
      url += '?';
    }

    url += `${params}&callback=${encodeURIComponent(windowVarName)}`.replace(/^&+|&+$/g, '');

    scriptEl = document.createElement('script');
    scriptEl.src = url;
    scriptAppendTarget.parentNode?.insertBefore(scriptEl, scriptAppendTarget);

    cancel = () => {
      // @ts-expect-error inevitable type-unsafe code for jsonp
      if (window[windowVarName]) {
        cleanup();
        reject(new Error(`jsonp for reqeust ${windowVarName} has been canceled`));
      }
    };
  });

  return {
    promise,
    cancel,
  };
};
