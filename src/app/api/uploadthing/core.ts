import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

export const ourFileRouter = {
  // CSV files for founder analysis
  csvUploader: f({
    "text/csv": { maxFileSize: "4MB", maxFileCount: 1 },
  })
    .onUploadComplete(async ({ file }) => {
      console.log("CSV upload complete:", file.url);
      return { uploadedBy: "user" };
    }),

  // Documents (CSV, Excel, TXT only)
  documentUploader: f({
    "text/csv": { maxFileSize: "4MB", maxFileCount: 1 },
    "application/vnd.ms-excel": { maxFileSize: "4MB", maxFileCount: 1 },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": { maxFileSize: "4MB", maxFileCount: 1 },
    "text/plain": { maxFileSize: "4MB", maxFileCount: 1 },
  })
    .onUploadComplete(async ({ file }) => {
      console.log("Document upload complete:", file.url);
      return { uploadedBy: "user" };
    }),

} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
