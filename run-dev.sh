#!/bin/bash
export DATABASE_URL="postgresql://postgres:dev_password_123@localhost:5433/ai_sales_db?schema=public"
npx prisma db push --skip-generate && npm run dev
