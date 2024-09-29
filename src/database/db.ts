import { Client } from "pg";
import dotenv from "dotenv"
dotenv.config()

const client = new Client({
  host:process.env.DB_HOST,
  user: process.env.DB_USER,
  port: 5432,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
})

export default client
