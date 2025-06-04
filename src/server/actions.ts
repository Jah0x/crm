// src/server/actions.ts
export async function getAuth() {
  return { userId: null };
}

export async function upload({ bufferOrBase64, fileName }: { bufferOrBase64: string; fileName: string }) {
  // Имитируем сохранение файла
  void bufferOrBase64;
  return `uploaded/${fileName}`;
}
