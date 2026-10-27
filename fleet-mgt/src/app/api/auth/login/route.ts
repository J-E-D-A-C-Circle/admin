import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { RowDataPacket } from 'mysql2';
import { pool } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secure-dvla-fleet-jwt-secret-key-2026';

interface UserRow extends RowDataPacket {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  name: string;
  role: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const username = String(body?.username ?? '').trim();
    const password = String(body?.password ?? '');

    if (!username || !password) {
      return NextResponse.json({ message: 'Username and password are required' }, { status: 400 });
    }

    const [rows] = await pool.query<UserRow[]>(
      'SELECT id, username, email, password_hash, name, role FROM users WHERE username = ? OR email = ? LIMIT 1',
      [username, username]
    );
    const user = rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return NextResponse.json({ message: 'Invalid username or password' }, { status: 401 });
    }

    const token = jwt.sign(
      { sub: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return NextResponse.json({
      token,
      userId: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
