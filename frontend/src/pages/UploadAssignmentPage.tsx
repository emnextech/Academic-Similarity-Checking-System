import { ChangeEvent, FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { Card } from "../components/ui/Card";
import { uploadSubmissionsBulk } from "../services/submissionService";
import { BulkUploadResponse } from "../types";

const acceptedTypes = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
];

export function UploadAssignmentPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bulkResult, setBulkResult] = useState<BulkUploadResponse | null>(null);
  const navigate = useNavigate();

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files ? Array.from(event.target.files) : [];
    if (selected.length === 0) {
      setFiles([]);
      return;
    }

    const invalid = selected.find((file) => !acceptedTypes.includes(file.type));
    if (invalid) {
      setError("Only PDF and DOCX files are allowed.");
      setFiles([]);
      return;
    }

    setError(null);
    setBulkResult(null);
    setFiles(selected);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (files.length === 0) {
      setError("Please select at least one file.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await uploadSubmissionsBulk(files);
      setBulkResult(result);

      if (result.created.length === 1 && result.failed.length === 0) {
        navigate(`/result/${result.created[0].submissionId}`);
      }
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
          Upload one or many assignments in PDF or DOCX format for lecturer review and marking.
        </p>
      </div>

      <Card className="max-w-2xl">
        <form className="space-y-5" onSubmit={onSubmit}>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Assignment Files</label>
            <input
              type="file"
              accept=".pdf,.docx"
              multiple
              onChange={onFileChange}
              className="block w-full rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-600 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white hover:file:bg-brand-700"
            />
            <p className="mt-2 text-xs text-slate-500">Maximum file size: 25 MB</p>
          </div>

          {files.length > 0 ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <p className="mb-2 font-medium">Selected files: {files.length}</p>
              <div className="max-h-40 space-y-1 overflow-y-auto text-xs text-slate-600">
                {files.map((file) => (
                  <p key={file.name + file.size}>
                    {file.name} ({Math.round(file.size / 1024)} KB)
                  </p>
                ))}
              </div>
            </div>
          ) : null}

          {bulkResult ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <p>
                Processed: <span className="font-semibold">{bulkResult.total}</span> | Created:{" "}
                <span className="font-semibold text-emerald-700">{bulkResult.created.length}</span> | Failed:{" "}
                <span className="font-semibold text-red-600">{bulkResult.failed.length}</span>
              </p>
              {bulkResult.failed.length > 0 ? (
                <div className="mt-2 space-y-1 text-xs text-red-600">
                  {bulkResult.failed.map((item) => (
                    <p key={item.fileName}>
                      {item.fileName}: {item.reason}
                    </p>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isSubmitting ? "Processing..." : "Upload and Process"}
          </button>
        </form>
      </Card>
    </AppShell>
  );
}
