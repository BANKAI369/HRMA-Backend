import { User } from "../models/user.model";

class UserService {
  private users: User[] = [
    {
      id: 1,
      name: "Admin",
      email: "admin@test.com",
      password: "1234",
      role: "admin",
    },
    {
      id: 2,
      name: "Sameer",
      email: "user@test.com",
      password: "1234",
      role: "user",
    },
  ];

  getAll() {
    return this.users;
  }

  findByEmail(email: string) {
    return this.users.find((u) => u.email === email);
  }
}

export const userService = new UserService();
