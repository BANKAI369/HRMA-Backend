declare namespace Express {
  namespace Multer {
    interface File {
      originalname: string;
      mimetype: string;
      filename: string;
      path: string;
      size: number;
    }
  }

  interface Request {
    file?: Multer.File;
    files?:
      | Multer.File[]
      | {
          [fieldname: string]: Multer.File[];
        };
  }
}

declare module "multer" {
  import type { Request, RequestHandler } from "express";

  declare function multer(options?: multer.Options): multer.Multer;

  declare namespace multer {
    interface File extends Express.Multer.File {}

    type DestinationCallback = (
      error: Error | null,
      destination: string
    ) => void;

    type FilenameCallback = (
      error: Error | null,
      filename: string
    ) => void;

    type FileFilterCallback = (
      error: Error | null,
      acceptFile?: boolean
    ) => void;

    interface DiskStorageOptions {
      destination?: (
        req: Request,
        file: File,
        callback: DestinationCallback
      ) => void;
      filename?: (
        req: Request,
        file: File,
        callback: FilenameCallback
      ) => void;
    }

    interface Options {
      storage?: unknown;
      fileFilter?: (
        req: Request,
        file: File,
        callback: FileFilterCallback
      ) => void;
      limits?: {
        fileSize?: number;
      };
    }

    interface Multer {
      single(fieldName: string): RequestHandler;
      array(fieldName: string, maxCount?: number): RequestHandler;
      fields(
        fields: Array<{ name: string; maxCount?: number }>
      ): RequestHandler;
      none(): RequestHandler;
      any(): RequestHandler;
    }

    function diskStorage(options: DiskStorageOptions): unknown;
  }

  export default multer;
}
