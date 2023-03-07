#!/bin/bash
npx prisma migrate deploy
npx prisma db seed
npx remix-serve build/
