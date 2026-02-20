#!/bin/sh
echo "Running prisma db push..."
npx prisma db push --accept-data-loss
echo "Starting server..."
node dist/index.js
