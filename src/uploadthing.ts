import { createUploadthing, type FileRouter } from "uploadthing/express";

const f = createUploadthing();

export const uploadRouter = {
  fileUploader: f({
    pdf: {
      maxFileSize: "1MB",
      maxFileCount: 4,
    },
    "application/vnd.ms-excel": {
        maxFileSize: "1MB",
        maxFileCount: 1,
      },
    },
).onUploadComplete((data) => {
    console.log("upload completed", data);
  }),
} satisfies FileRouter;

export type OurFileRouter = typeof uploadRouter;
