const ORDER = {
  none: 0,
  info: 1,
  low: 2,
  medium: 3,
  high: 4,
  critical: 5
};

export const VALID_SEVERITIES = Object.keys(ORDER);

export function severityPassesThreshold(severity, threshold) {
  return ORDER[severity] >= ORDER[threshold];
}
