import type { Response } from "express";
import * as documentController from "./document";
import * as documentService from "../services/document.service";
import * as accessService from "../services/document-access.service";
import * as authUserUtils from "../utils/auth-user.utils";
import * as fileStorage from "../utils/file-storage";

jest.mock("../services/document.service");
jest.mock("../services/document-access.service");
jest.mock("../utils/auth-user.utils");
jest.mock("../utils/file-storage");

const mockedDocumentService = jest.mocked(documentService);
const mockedAccessService = jest.mocked(accessService);
const mockedAuthUserUtils = jest.mocked(authUserUtils);
const mockedFileStorage = jest.mocked(fileStorage);

const createResponse = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    download: jest.fn().mockReturnThis(),
  };

  return res as unknown as Response & {
    status: jest.Mock;
    json: jest.Mock;
    download: jest.Mock;
  };
};

describe("document controller", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("returns paginated documents for accessible users", async () => {
    const req = {
      user: { id: "actor-1" },
      query: { page: "2", pageSize: "5", search: "passport" },
    } as any;
    const res = createResponse();
    const actor = { id: "actor-1", isActive: true, role: { name: "Admin" } } as any;
    const serviceResult = {
      data: [{ id: "doc-1" }],
      pagination: { page: 2, pageSize: 5, total: 1, totalPages: 1 },
    };

    mockedAuthUserUtils.resolveAuthenticatedUser.mockResolvedValue(actor);
    mockedAccessService.getAccessibleDocumentUserIds.mockResolvedValue(null);
    mockedDocumentService.listDocuments.mockResolvedValue(serviceResult as any);

    await documentController.getAllDocuments(req, res);

    expect(mockedDocumentService.listDocuments).toHaveBeenCalledWith({
      accessibleUserIds: null,
      page: 2,
      pageSize: 5,
      search: "passport",
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(serviceResult);
  });

  it("blocks downloads when the actor cannot access the document", async () => {
    const req = {
      user: { id: "actor-1" },
      params: { id: "doc-1" },
    } as any;
    const res = createResponse();
    const actor = { id: "actor-1", isActive: true, role: { name: "Employee" } } as any;
    const document = {
      id: "doc-1",
      userId: "user-2",
      filePath: "C:/tmp/doc.pdf",
      originalFileName: "doc.pdf",
    } as any;

    mockedAuthUserUtils.resolveAuthenticatedUser.mockResolvedValue(actor);
    mockedDocumentService.getDocumentById.mockResolvedValue(document);
    mockedAccessService.canAccessDocument.mockResolvedValue(false);

    await documentController.downloadDocument(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: "Forbidden" });
    expect(res.download).not.toHaveBeenCalled();
  });

  it("downloads the file and logs the access when allowed", async () => {
    const req = {
      user: { id: "actor-1" },
      params: { id: "doc-1" },
    } as any;
    const res = createResponse();
    const actor = { id: "actor-1", isActive: true, role: { name: "Admin" } } as any;
    const document = {
      id: "doc-1",
      userId: "user-2",
      filePath: "C:/tmp/doc.pdf",
      originalFileName: "doc.pdf",
    } as any;

    mockedAuthUserUtils.resolveAuthenticatedUser.mockResolvedValue(actor);
    mockedDocumentService.getDocumentById.mockResolvedValue(document);
    mockedAccessService.canAccessDocument.mockResolvedValue(true);
    mockedFileStorage.localFileExists.mockResolvedValue(true);

    await documentController.downloadDocument(req, res);

    expect(mockedDocumentService.logDocumentDownload).toHaveBeenCalledWith(
      document,
      "actor-1"
    );
    expect(res.download).toHaveBeenCalledWith("C:/tmp/doc.pdf", "doc.pdf");
  });

  it("rejects review attempts from non-admin reviewers", async () => {
    const req = {
      user: { id: "actor-1" },
      params: { id: "doc-1" },
      body: { status: "Verified" },
    } as any;
    const res = createResponse();
    const actor = { id: "actor-1", isActive: true, role: { name: "Manager" } } as any;

    mockedAuthUserUtils.resolveAuthenticatedUser.mockResolvedValue(actor);
    mockedAccessService.canReviewDocuments.mockReturnValue(false);

    await documentController.reviewDocument(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: "Forbidden" });
    expect(mockedDocumentService.reviewDocument).not.toHaveBeenCalled();
  });
});
