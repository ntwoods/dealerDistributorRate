import { AnimatePresence, motion } from "framer-motion";
import { LoaderCircle, UploadCloud, X, Trash2, FileText } from "lucide-react";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";

function fileKey(file) {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

export default function AddDealerModal({ open, onClose, onSubmit }) {
  const [dealerName, setDealerName] = useState("");
  const [station, setStation] = useState("");
  const [marketingPerson, setMarketingPerson] = useState("");
  const [items, setItems] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const files = useMemo(() => items.map((item) => item.file), [items]);

  const resetState = () => {
    setDealerName("");
    setStation("");
    setMarketingPerson("");
    setItems([]);
    setDragging(false);
    setSubmitting(false);
  };

  const handleClose = (force = false) => {
    if (submitting && !force) {
      return;
    }
    resetState();
    onClose();
  };

  const addFiles = (incoming) => {
    if (!incoming?.length) {
      return;
    }
    setItems((previous) => {
      const existingKeys = new Set(previous.map((item) => fileKey(item.file)));
      const next = [...previous];
      incoming.forEach((file) => {
        const key = fileKey(file);
        if (!existingKeys.has(key)) {
          next.push({ file, status: "queued", progress: 0, error: "" });
        }
      });
      return next;
    });
  };

  const onDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    const dropped = Array.from(event.dataTransfer.files || []);
    addFiles(dropped);
  };

  const removeFile = (index) => {
    if (submitting) {
      return;
    }
    setItems((previous) => previous.filter((_, itemIndex) => itemIndex !== index));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payload = {
      dealerName: dealerName.trim(),
      station: station.trim(),
      marketingPerson: marketingPerson.trim(),
      files,
    };

    if (!payload.dealerName || !payload.station || !payload.marketingPerson) {
      toast.error("Dealer name, station, and marketing person are required.");
      return;
    }

    if (!payload.files.length) {
      toast.error("Please upload at least one document.");
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit({
        ...payload,
        onFileProgress: (index, update) => {
          setItems((previous) =>
            previous.map((item, itemIndex) => {
              if (itemIndex !== index) {
                return item;
              }
              return {
                ...item,
                status: update.status || item.status,
                progress:
                  typeof update.progress === "number"
                    ? update.progress
                    : item.progress,
                error: update.error || "",
              };
            })
          );
        },
      });
      toast.success("Dealer documents saved successfully.");
      handleClose(true);
    } catch (error) {
      toast.error(error?.message || "Failed to save dealer documents.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 px-4 py-7 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.form
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-soft"
            onClick={(event) => event.stopPropagation()}
            onSubmit={handleSubmit}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h3 className="font-display text-xl font-bold text-slate-900">Add New Dealer Docs</h3>
                <p className="mt-1 text-sm text-slate-600">Upload files and upsert dealer record in Google Sheets.</p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1 text-sm">
                  <span className="font-medium text-slate-700">Dealer Name *</span>
                  <input
                    value={dealerName}
                    onChange={(event) => setDealerName(event.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none ring-brand-200 transition focus:ring"
                    placeholder="Dealer name"
                    required
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="font-medium text-slate-700">Station *</span>
                  <input
                    value={station}
                    onChange={(event) => setStation(event.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none ring-brand-200 transition focus:ring"
                    placeholder="Station"
                    required
                  />
                </label>
              </div>

              <label className="space-y-1 text-sm">
                <span className="font-medium text-slate-700">Marketing Person Name *</span>
                <input
                  value={marketingPerson}
                  onChange={(event) => setMarketingPerson(event.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none ring-brand-200 transition focus:ring"
                  placeholder="Marketing person"
                  required
                />
              </label>

              <div
                onDragOver={(event) => {
                  event.preventDefault();
                  if (!submitting) {
                    setDragging(true);
                  }
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                className={`rounded-2xl border-2 border-dashed p-6 text-center transition ${
                  dragging ? "border-brand-500 bg-brand-50" : "border-slate-300 bg-slate-50"
                }`}
              >
                <UploadCloud className="mx-auto h-8 w-8 text-brand-700" />
                <p className="mt-3 text-sm font-medium text-slate-700">Drag & drop documents here</p>
                <p className="mt-1 text-xs text-slate-500">Any file type is supported. Multiple files allowed.</p>
                <label className="mt-4 inline-flex cursor-pointer items-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-brand-700 shadow-sm ring-1 ring-brand-200 hover:bg-brand-50">
                  Browse files
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(event) => addFiles(Array.from(event.target.files || []))}
                    disabled={submitting}
                  />
                </label>
              </div>

              <div className="max-h-[180px] space-y-2 overflow-auto pr-1 scrollbar-thin">
                {items.map((item, index) => (
                  <div key={fileKey(item.file)} className="rounded-xl border border-slate-200 bg-white p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="inline-flex items-center gap-2 text-sm font-medium text-slate-800">
                          <FileText className="h-4 w-4 text-brand-700" />
                          <span className="truncate">{item.file.name}</span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          {(item.file.size / 1024).toFixed(1)} KB • {item.status}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        disabled={submitting}
                        className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-rose-600 disabled:opacity-40"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-2 h-1.5 rounded-full bg-slate-100">
                      <div
                        className={`h-1.5 rounded-full transition-all ${
                          item.status === "error" ? "bg-rose-500" : "bg-brand-500"
                        }`}
                        style={{ width: `${Math.max(0, Math.min(100, item.progress || 0))}%` }}
                      />
                    </div>
                    {item.error && <p className="mt-1 text-xs text-rose-600">{item.error}</p>}
                  </div>
                ))}
                {!items.length && (
                  <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-sm text-slate-500">
                    No files selected yet.
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={submitting}
                className="inline-flex h-10 items-center rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-70"
              >
                {submitting && <LoaderCircle className="h-4 w-4 animate-spin" />}
                {submitting ? "Saving..." : "Submit"}
              </button>
            </div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

