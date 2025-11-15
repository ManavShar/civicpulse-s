import { PoolClient } from "pg";
import { User, UserRole } from "../types/auth";
import { BaseRepository } from "../db/BaseRepository";
import db from "../db/connection";

/**
 * Repository for User data access
 */
export class UserRepository extends BaseRepository<User> {
  constructor() {
    super("users", "id");
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string, client?: PoolClient): Promise<User | null> {
    const query = `
      SELECT id, email, password_hash as "passwordHash", role, created_at as "createdAt", updated_at as "updatedAt"
      FROM users
      WHERE email = $1
    `;

    let rows: any[];
    if (client) {
      const result = await client.query(query, [email]);
      rows = result.rows;
    } else {
      rows = await db.query(query, [email]);
    }

    return rows[0] || null;
  }

  /**
   * Create a new user with email, password hash, and role
   */
  async createUser(
    email: string,
    passwordHash: string,
    role: UserRole,
    client?: PoolClient
  ): Promise<User> {
    const query = `
      INSERT INTO users (email, password_hash, role)
      VALUES ($1, $2, $3)
      RETURNING id, email, password_hash as "passwordHash", role, created_at as "createdAt", updated_at as "updatedAt"
    `;

    let rows: any[];
    if (client) {
      const result = await client.query(query, [email, passwordHash, role]);
      rows = result.rows;
    } else {
      rows = await db.query(query, [email, passwordHash, role]);
    }

    return rows[0];
  }

  /**
   * Update user password
   */
  async updatePassword(
    userId: string,
    passwordHash: string,
    client?: PoolClient
  ): Promise<void> {
    const query = `
      UPDATE users
      SET password_hash = $1, updated_at = NOW()
      WHERE id = $2
    `;

    if (client) {
      await client.query(query, [passwordHash, userId]);
    } else {
      await db.query(query, [passwordHash, userId]);
    }
  }

  /**
   * Update user role
   */
  async updateRole(
    userId: string,
    role: UserRole,
    client?: PoolClient
  ): Promise<void> {
    const query = `
      UPDATE users
      SET role = $1, updated_at = NOW()
      WHERE id = $2
    `;

    if (client) {
      await client.query(query, [role, userId]);
    } else {
      await db.query(query, [role, userId]);
    }
  }

  /**
   * List all users (without password hashes)
   */
  async listAllUsers(
    client?: PoolClient
  ): Promise<Omit<User, "passwordHash">[]> {
    const query = `
      SELECT id, email, role, created_at as "createdAt", updated_at as "updatedAt"
      FROM users
      ORDER BY created_at DESC
    `;

    let rows: any[];
    if (client) {
      const result = await client.query(query);
      rows = result.rows;
    } else {
      rows = await db.query(query);
    }

    return rows;
  }

  /**
   * Delete user by ID
   */
  async deleteUser(userId: string, client?: PoolClient): Promise<boolean> {
    const query = `DELETE FROM users WHERE id = $1 RETURNING id`;

    let rows: any[];
    if (client) {
      const result = await client.query(query, [userId]);
      rows = result.rows;
    } else {
      rows = await db.query(query, [userId]);
    }

    return rows.length > 0;
  }
}
