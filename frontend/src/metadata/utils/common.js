export const getType = (value) => {
  return Object.prototype.toString.call(value).slice(8, -1);
};

export const base64ToFile = (data, fileName) => {
  const parts = data.split(';base64,');
  const contentType = parts[0].split(':')[1];
  const raw = window.atob(parts[1]);
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);

  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }

  const blob = new Blob([uInt8Array], { type: contentType });
  const file = new File([blob], fileName, { type: contentType });
  return file;
};

export const bytesToSize = (bytes) => {
  if (typeof(bytes) == 'undefined') return ' ';

  if (bytes < 0) return '--';
  const sizes = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];

  if (bytes === 0) return bytes + ' ' + sizes[0];

  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1000)), 10);
  if (i === 0) return bytes + ' ' + sizes[i];
  return (bytes / (1000 ** i)).toFixed(1) + ' ' + sizes[i];
};

/**
 * Check whether the given value is empty
 * @param {any} val
 * @returns bool
 */
export const isEmpty = (val) => {
  if (val === null || val === undefined) return true;
  if (val.length !== undefined) return val.length === 0;
  if (val instanceof Date) return false;
  if (typeof val === 'object') return Object.keys(val).length === 0;
  return false;
};

/**
 * Check whether the object is empty.
 * The true will be returned if the "obj" is invalid.
 * @param {object} obj
 * @returns bool
 */
export const isEmptyObject = (obj) => {
  let name;
  // eslint-disable-next-line
  for (name in obj) {
    return false;
  }
  return true;
};

export const debounce = (fn, delay, immediate) => {
  let timer = null;
  return (...params) => {
    if (timer) {
      clearTimeout(timer);
    }
    if (immediate && !timer) {
      fn.call(this, ...params);
    } else {
      timer = setTimeout(() => {
        timer = null;
        fn.call(this, ...params);
      }, delay);
    }
  };
};

export const throttle = (func, delay) => {
  let timer = null;
  let startTime = Date.now();
  return function () {
    let curTime = Date.now();
    let remaining = delay - (curTime - startTime);
    let context = this;
    let args = arguments;
    clearTimeout(timer);
    if (remaining <= 0) {
      func.apply(context, args);
      startTime = Date.now();
    } else {
      timer = setTimeout(func, remaining);
    }
  };
};

export const isRegExpression = (value) => {
  try {
    return !!new RegExp(value);
  } catch (e) {
    return false;
  }
};

export const getEventClassName = (e) => {
  // svg mouseEvent event.target.className is an object
  if (!e || !e.target) return '';
  return e.target.getAttribute('class') || '';
};

export const getTrimmedString = (value) => {
  return (typeof value === 'string') ? value.trim() : '';
};
