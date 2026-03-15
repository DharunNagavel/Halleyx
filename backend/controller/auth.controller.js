import pool from "../db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import redis from "../redis.js";
import aj from "../arcjet.js";
import { JWT_SECRET } from "../config/env.js";

export const Signup = async (req, res) => {
  try {
    const decision = await aj.protect(req);
    if (decision.isDenied()) {
      return res.json({
        message: "Request blocked by Arcjet",
      });
    }
    const { name, email, password } = req.body;
    const userExists = await pool.query("SELECT * FROM users WHERE email=$1", [
      email,
    ]);
    if (userExists.rows.length > 0) {
      return res.json({
        message: "User already exists",
      });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await pool.query(
      "INSERT INTO users(name,email,password) VALUES($1,$2,$3) RETURNING *",
      [name, email, hashedPassword],
    );
    const token = jwt.sign({ id: newUser.rows[0].id }, JWT_SECRET, {
      expiresIn: "1h",
    });
    res.json({
      message: "User registered successfully",
      token,
    });
  } catch (error) {
    res.json({
      message: "Server error",
      error: error.message,
    });
  }
};

export const Sigin = async (req, res) => {
  try {
    const decision = await aj.protect(req);
    if (decision.isDenied()) {
      return res.json({
        message: "Request blocked by Arcjet",
      });
    }
    const { email, password } = req.body;
    const user = await pool.query("SELECT * FROM users WHERE email=$1", [
      email,
    ]);
    if (user.rows.length === 0) {
      return res.json({
        message: "Invalid email or password",
      });
    }
    const validPassword = await bcrypt.compare(password, user.rows[0].password);
    if (!validPassword) {
      return res.json({
        message: "Invalid email or password",
      });
    }
    const token = jwt.sign({ id: user.rows[0].id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    res.json({
      message: "Login successful",
      token,
    });
  } catch (error) {
    res.json({
      message: "Server error",
      error: error.message,
    });
  }
};
