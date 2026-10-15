import { execSync } from 'child_process'

console.log('🚀 Running Netlify deploy preparation...')

if (process.env.DATABASE_URL) {
  console.log('✓ DATABASE_URL detected. Synchronizing database schema with remote Postgres...')
  try {
    execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' })
    console.log('✓ Database schema synchronized successfully!')
  } catch (err) {
    console.error('⚠️ Warning: Prisma db push encountered an issue:', err.message)
    console.error('Make sure your DATABASE_URL is accessible and valid.')
  }
} else {
  console.log('⚠️ Notice: No DATABASE_URL environment variable found.')
  console.log('Please configure DATABASE_URL in Netlify Site settings > Environment variables.')
}
