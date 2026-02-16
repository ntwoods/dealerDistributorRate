import { motion } from "framer-motion";
import { Plus, RefreshCcw, LoaderCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import AddDealerModal from "../components/AddDealerModal";
import DealerTable from "../components/DealerTable";
import DocsModal from "../components/DocsModal";
import TopBar from "../components/TopBar";
import { uploadFilesWithConcurrency } from "../lib/driveApi";
import { fetchDealerDocs, upsertDealerDocs } from "../lib/sheetsApi";

const SHEET_ID = import.meta.env.VITE_SHEET_ID;
const DRIVE_FOLDER_ID = import.meta.env.VITE_DRIVE_FOLDER_ID;

function normalizeSessionError(error) {
  const message = error?.message || "";
  if (message.toLowerCase().includes("unauthorized") || message.includes("401")) {
    return "Session expired. Please login again.";
  }
  return message || "Something went wrong. Please try again.";
}

export default function Dashboard({ session, onLogout, onSessionInvalid }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reloading, setReloading] = useState(false);
  const [docsTarget, setDocsTarget] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const loadRecords = useCallback(
    async (silent = false) => {
      if (!silent) {
        setLoading(true);
      } else {
        setReloading(true);
      }
      try {
        const data = await fetchDealerDocs({ accessToken: session.accessToken, sheetId: SHEET_ID });
        setRecords(data);
      } catch (error) {
        const message = normalizeSessionError(error);
        toast.error(message);
        if (message.includes("Session expired")) {
          onSessionInvalid();
        }
      } finally {
        setLoading(false);
        setReloading(false);
      }
    },
    [session.accessToken, onSessionInvalid]
  );

  useEffect(() => {
    if (!SHEET_ID || !DRIVE_FOLDER_ID) {
      toast.error("Sheet ID or Drive folder ID is not configured.");
      return;
    }
    loadRecords();
  }, [loadRecords]);

  const handleSubmitNewDocs = async ({ dealerName, station, marketingPerson, files, onFileProgress }) => {
    if (!session?.accessToken) {
      throw new Error("Missing access token. Please login again.");
    }

    const uploads = await uploadFilesWithConcurrency({
      files,
      accessToken: session.accessToken,
      folderId: DRIVE_FOLDER_ID,
      concurrency: 3,
      onProgress: onFileProgress,
    });

    await upsertDealerDocs({
      accessToken: session.accessToken,
      sheetId: SHEET_ID,
      dealerName,
      station,
      marketingPerson,
      newFiles: uploads,
      email: session.email,
    });

    await loadRecords(true);
  };

  const totalDocs = useMemo(
    () => records.reduce((acc, record) => acc + (record.fileIds?.length || 0), 0),
    [records]
  );

  return (
    <div className="min-h-screen px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <TopBar userEmail={session.email} onLogout={onLogout} />

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08 }}
          className="rounded-3xl border border-white/70 bg-white/80 p-5 shadow-soft backdrop-blur sm:p-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-700">Overview</p>
              <h2 className="font-display text-2xl font-bold text-slate-900">Dealer Records</h2>
              <p className="text-sm text-slate-600">Total uploaded documents: {totalDocs}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => loadRecords(true)}
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-brand-200 bg-white px-4 text-sm font-semibold text-brand-700 transition hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-70"
                disabled={reloading || loading}
              >
                {reloading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                Refresh
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white transition hover:bg-brand-700"
              >
                <Plus className="h-4 w-4" />
                ADD NEW DEALER DOCS
              </button>
            </div>
          </div>

          <div className="mt-6">
            {loading ? (
              <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-brand-200 bg-brand-50/50 text-brand-700">
                <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />
                Loading dealer data...
              </div>
            ) : (
              <DealerTable data={records} onViewDocs={setDocsTarget} />
            )}
          </div>
        </motion.section>
      </div>

      <AddDealerModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleSubmitNewDocs}
      />

      <DocsModal
        open={Boolean(docsTarget)}
        onClose={() => setDocsTarget(null)}
        dealer={docsTarget}
      />
    </div>
  );
}

