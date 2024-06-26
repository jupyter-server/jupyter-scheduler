export const convertTaskTimeoutHoursToSeconds = (
  time: string | undefined
): string | undefined => {
  let output: string | undefined;

  if (time) {
    output = (parseInt(time) * 60 * 60).toString();
  }

  return output;
};

export const convertTaskTimeoutSecondsToHours = (
  time: string | undefined
): string | undefined => {
  let output: string | undefined;

  if (time) {
    output = (parseInt(time) / 60 / 60).toString();
  }

  return output;
};
