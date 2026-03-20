import { ChangeEvent, FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { Card } from "../components/ui/Card";
import { uploadSubmission } from "../services/submissionService";

const acceptedTypes = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
];

export function UploadAssignmentPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] ?? null;
    if (!selected) {
      setFile(null);
      return;
    }

    if (!acceptedTypes.includes(selected.type)) {
      setError("Only PDF and DOCX files are allowed.");
      setFile(null);
      return;
    }

    setError(null);
    setFile(selected);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setError("Please select a file.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await uploadSubmission(file);
      navigate(`/result/${result.submissionId}`);
    } catch (uploadError: unknown) {
      setError("Upload failed. Please check the file and try again.");
      console.error(uploadError);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AppShell>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-slate-900">Upload Assignment</h2>
        <p className="mt-1 text-sm text-slate-500">
          Upload a student assignment in PDF or DOCX format for similarity analysis.
        </p>
      </div>

      <Card className="max-w-2xl">
        <form className="space-y-5" onSubmit={onSubmit}>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Document File</label>
            <input
              type="file"
              accept=".pdf,.docx"
              onChange={onFileChange}
              className="block w-full rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-600 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white hover:file:bg-brand-700"
            />
            <p className="mt-2 text-xs text-slate-500">Maximum file size: 25 MB</p>
          </div>

          {file ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              Selected: <span className="font-medium">{file.name}</span> ({Math.round(file.size / 1024)} KB)
            </div>
          ) : null}

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isSubmitting ? "Analyzing..." : "Upload and Analyze"}
          </button>
        </form>
      </Card>
    </AppShell>
  );
}
