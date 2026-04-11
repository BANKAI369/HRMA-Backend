import { Column, Entity } from "typeorm";
import { BaseEntity } from "./base.entity";

@Entity("document_types")
export class DocumentType extends BaseEntity {
  @Column({ unique: true })
  name: string;

  @Column({ type: "text" })
  description: string;

  @Column({ default: true })
  isActive: boolean;
}
