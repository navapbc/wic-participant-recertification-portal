#!/bin/bash
npx --loglevel=verbose prisma migrate deploy
npx --loglevel=verbose prisma db seed
npx --loglevel=verbose remix-serve build/
