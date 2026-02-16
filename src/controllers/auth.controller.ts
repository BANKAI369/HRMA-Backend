import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { userService } from "../services/user.service";

const SECRET = "mysecret";

export const login = (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = userService.findByEmail(email);

  if (!user) {
    return res.status(401).json({ message: "User not found" });
  }

  if (user.password !== password) {
    return res.status(401).json({ message: "Invalid password" });
  }

  const token = jwt.sign(
    { id: user.id, role: user.role },
    SECRET,
    { expiresIn: "1h" }
  );

  res.json({ token });
};
