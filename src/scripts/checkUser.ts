import "reflect-metadata";
import { AppDataSource } from "../config/data-source";
import { User } from "../entities/User";

async function run() {
  try {
    await AppDataSource.initialize();
    const userRepo = AppDataSource.getRepository(User);

    const byEmail = await userRepo.findOne({ where: { email: 'admin@ngenux.com' }, relations: ['role', 'roles', 'tenant'] });
    const byUsername = await userRepo.findOne({ where: { username: 'ADMINNGENUX' }, relations: ['role', 'roles', 'tenant'] });

    console.log('Lookup by email:', !!byEmail);
    if (byEmail) console.log(JSON.stringify({ id: byEmail.id, email: byEmail.email, username: byEmail.username, tenantId: byEmail.tenantId, role: byEmail.role?.name, isActive: byEmail.isActive }, null, 2));

    console.log('Lookup by username:', !!byUsername);
    if (byUsername) console.log(JSON.stringify({ id: byUsername.id, email: byUsername.email, username: byUsername.username, tenantId: byUsername.tenantId, role: byUsername.role?.name, isActive: byUsername.isActive }, null, 2));

    await AppDataSource.destroy();
  } catch (err) {
    console.error('Error querying DB:', err);
    process.exit(1);
  }
}

run();
