export const removeUndefinedFields = <T>(value: T): T => {
  if (Array.isArray(value)) {
    return value.map(removeUndefinedFields) as T;
  }

  if (value && typeof value === "object" && value.constructor === Object) {
    return Object.entries(value as Record<string, unknown>).reduce<
      Record<string, unknown>
    >((cleanValue, [key, nestedValue]) => {
      if (nestedValue !== undefined) {
        cleanValue[key] = removeUndefinedFields(nestedValue);
      }

      return cleanValue;
    }, {}) as T;
  }

  return value;
};
