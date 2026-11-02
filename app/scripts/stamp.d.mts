/** The first 12 hex digits of the sha256 of the files, in the order of their names. */
export function worldStamp(files: { name: string; data: string | Uint8Array }[]): string;
