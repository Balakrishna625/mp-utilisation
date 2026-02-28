/**
 * Script to update quarter values in existing database records
 * Run with: npx ts-node scripts/update-quarters.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// New Financial Year Quarter Mapping
const QUARTER_MAPPING: { [month: string]: string } = {
  'Jul': 'Q1', 'Aug': 'Q1', 'Sep': 'Q1',
  'Oct': 'Q2', 'Nov': 'Q2', 'Dec': 'Q2',
  'Jan': 'Q3', 'Feb': 'Q3', 'Mar': 'Q3',
  'Apr': 'Q4', 'May': 'Q4', 'Jun': 'Q4',
}

async function updateQuarters() {
  console.log('🔄 Starting quarter update...\n')

  try {
    // Get all monthly utilization records
    const records = await prisma.monthlyUtilization.findMany()
    
    console.log(`📊 Found ${records.length} records to update\n`)
    
    let updatedCount = 0
    let skippedCount = 0
    
    for (const record of records) {
      const correctQuarter = QUARTER_MAPPING[record.month]
      
      if (!correctQuarter) {
        console.log(`⚠️  Unknown month: ${record.month} for record ${record.id}`)
        skippedCount++
        continue
      }
      
      if (record.quarter !== correctQuarter) {
        console.log(`✏️  Updating ${record.name} - ${record.month} ${record.financialYear}: ${record.quarter} → ${correctQuarter}`)
        
        await prisma.monthlyUtilization.update({
          where: { id: record.id },
          data: { quarter: correctQuarter }
        })
        
        updatedCount++
      } else {
        skippedCount++
      }
    }
    
    console.log(`\n✅ Update complete!`)
    console.log(`   Updated: ${updatedCount} records`)
    console.log(`   Skipped: ${skippedCount} records (already correct)`)
    
  } catch (error) {
    console.error('❌ Error updating quarters:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

updateQuarters()
  .then(() => {
    console.log('\n🎉 All done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error)
    process.exit(1)
  })
