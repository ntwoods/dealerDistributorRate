import { AnimatePresence, motion } from "framer-motion";
import { ExternalLink, FileText, X } from "lucide-react";

function buildDocs(dealer) {
  if (!dealer) {
    return [];
  }
  const ids = dealer.fileIds || [];
  const names = dealer.fileNames || [];
  return ids.map((id, index) => ({
    id,
    name: names[index] || `Document ${index + 1}`,
    href: `https://drive.google.com/file/d/${id}/view`,
  }));
}

export default function DocsModal({ open, onClose, dealer }) {
  const docs = buildDocs(dealer);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-8 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-soft"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h3 className="font-display text-xl font-bold text-slate-900">Rate Documents</h3>
                <p className="mt-1 text-sm text-slate-600">
                  {dealer?.dealerName || "Unknown Dealer"} • {dealer?.station || "-"}
                </p>
              </div>
              <button onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[60vh] space-y-3 overflow-auto p-5 scrollbar-thin">
              {docs.length > 0 ? (
                docs.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
                  >
                    <div className="mr-3 flex min-w-0 items-center gap-2">
                      <FileText className="h-4 w-4 text-brand-700" />
                      <p className="truncate text-sm font-medium text-slate-800">{doc.name}</p>
                    </div>
                    <a
                      href={doc.href}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-800"
                    >
                      Open
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-600">
                  No document uploaded
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

