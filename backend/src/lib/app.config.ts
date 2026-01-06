import dotenv from "dotenv"

dotenv.config()

export const config = {
  NODE_ENV:  process.env.NODE_ENV as string,
  APP_ORIGIN: process.env.APP_ORIGIN!,
  PORT: process.env.PORT!,
  BASE_PATH: process.env.BASE_PATH!,
  DATABASE_URL:process.env.DATABASE_URL,
}