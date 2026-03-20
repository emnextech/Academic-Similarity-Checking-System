import jwt from "jsonwebtoken";
import { UserRole } from "@prisma/client";
import { env } from "../config/env";

type TokenPayload = {
  sub: string;
  email: string;
  role: UserRole;
};

export function signAccessToken(payload: { id: string; email: string; role: UserRole }) {
  return jwt.sign(
    {
      sub: payload.id,
      email: payload.email,
      role: payload.role
    },
    env.JWT_SECRET,
    { expiresIn: "12h" }
  );
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
}
