// src/server/actions.ts
export async function getAuth() {
  return { userId: null };
}

export async function upload({ bufferOrBase64, fileName }: { bufferOrBase64: string; fileName: string }) {
  return `uploaded/${fileName}`;
}
