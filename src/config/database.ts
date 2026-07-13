import { AppDataSource } from "./data-source";

export async function initializeDatabase() {
  if (!AppDataSource.isInitialized) {
    try {
      await AppDataSource.initialize();
    } catch (error: any) {
      const host = process.env.DB_HOST || "127.0.0.1";
      const port = Number(process.env.DB_PORT || 5432);
      const database = process.env.DB_NAME || "NEST";

      if (error?.code === "ECONNREFUSED" || error?.name === "AggregateError") {
        console.error(
          `PostgreSQL is not reachable at ${host}:${port} for database "${database}". ` +
            "Start the local PostgreSQL service or update DB_HOST/DB_PORT before running the backend."
        );
      }

      throw error;
    }
  }

  await AppDataSource.runMigrations();
}
