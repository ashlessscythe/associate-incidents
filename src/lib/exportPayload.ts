export function omitFiles<T extends { files?: unknown }>(item: T): Omit<T, "files"> {
  const payload = { ...item };
  delete payload.files;
  return payload;
}
