import { create } from "zustand"

// EXAMPLE
type ReportStore = {
  reportId: string
  setReportId: (reportId: string) => void
}

export const useReportStore = create<ReportStore>((set) => ({
  reportId: "",
  setReportId: (reportId) => set(() => ({ reportId: reportId })),
}))
