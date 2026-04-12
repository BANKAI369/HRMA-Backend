import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { BaseEntity } from "./base.entity";
import { User } from "./User";
import { DocumentType } from "./DocumentTypes";
import { DocumentStatus } from "../utils/document-status.enum";

@Entity("documents")
export class Document extends BaseEntity {
  @Column({ name: "user_id", type: "uuid" })
  userId: string;

  @ManyToOne(() => User, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;

  @Column({ name: "document_type_id", type: "uuid" })
  documentTypeId: string;

  @ManyToOne(() => DocumentType, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "document_type_id" })
  documentType: DocumentType;

  @Column({ name: "file_name" })
  fileName: string;

  @Column({ name: "original_file_name" })
  originalFileName: string;

  @Column({ name: "file_path" })
  filePath: string;

  @Column({ name: "mime_type" })
  mimeType: string;

  @Column({ name: "file_size", type: "bigint" })
  fileSize: number;

  @Column({
    type: "enum",
    enum: DocumentStatus,
    default: DocumentStatus.PENDING,
  })
  status: DocumentStatus;

  @Column({ nullable: true, type: "text" })
  remarks?: string;

  @Column({ name: "verified_by", nullable: true, type: "uuid" })
  verifiedBy?: string;

  @Column({ name: "verified_at", type: "timestamptz", nullable: true })
  verifiedAt?: Date;
}
