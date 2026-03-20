import fs from "fs/promises";
import mammoth from "mammoth";
import pdfParse from "pdf-parse";
import { HttpError } from "../utils/httpError";

export async function extractTextFromFile(filePath: string, mimeType: string) {
  if (mimeType === "application/pdf") {
    const fileBuffer = await fs.readFile(filePath);
    const parsed = await pdfParse(fileBuffer);
    return parsed.text ?? "";
  }

  if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    const docx = await mammoth.extractRawText({ path: filePath });
    return docx.value ?? "";
  }

  throw new HttpError(400, "Unsupported file type");
}
