# Monthly Data Upload System Guide

## Overview
This system allows managers to upload monthly utilization data organized by Financial Years (FY) and Quarters (FQ). The data is automatically organized and made available to both managers and individual users.

## Financial Year Structure
- **Financial Year runs from July to June**
- FY25 = July 2024 to June 2025
- FY26 = July 2025 to June 2026

### Quarter Mapping
- **FQ1**: July, August, September
- **FQ2**: October, November, December
- **FQ3**: January, February, March
- **FQ4**: April, May, June

## How to Upload Monthly Data

### For Managers:
1. **Navigate to "Monthly Data Upload"** from the sidebar
2. **Select the month and year** for the data you're uploading
3. **Choose your Excel/CSV file** with the utilization data
4. **Click "Upload Data"**

The system will:
- Automatically determine the Financial Year (e.g., FY25)
- Automatically determine the Quarter (e.g., FQ1)
- Organize the data hierarchically
- Merge with existing data (won't overwrite, will update)

### Expected Excel/CSV Format:
The file should contain these columns:
- **Name** (required) - Employee name
- **Email** - Employee email address
- **Title** - Job title
- **Target Hours** - Target hours for the month
- **Project** - Project hours logged
- **PMN** - PMN hours
- **Utilization** - Utilization percentage (can be decimal or percentage)
- **Fringe Impact** - Fringe impact
- **Fringe** - Fringe hours
- **W/Presales** - With presales hours
- **Mentor** - Mentor name (optional)

> **Note:** Column names are flexible - the system recognizes variations like "Target Hours", "target_hours", "TARGET HOURS", etc.

## Data Storage Structure

Data is stored hierarchically:
```
Financial Year (FY25)
  └── Quarter (FQ1)
      └── Month (Jul)
          └── Employee Records[]
```

## How Dashboards Use This Data

### Individual Dashboard:
- Shows employee's own monthly data
- Historical trends (weekly/monthly/quarterly/yearly)
- Month-on-month comparisons
- Achievement tracking

### Manager Dashboard:
- Overview of all employees
- Team utilization trends
- Mentee analytics
- Financial year and quarter summaries

## Accessing the Data Programmatically

### Using the Storage Service:
```typescript
import { monthlyDataStorage } from '@/lib/monthlyDataStorage'

// Get all data for an employee
const employeeData = monthlyDataStorage.getEmployeeData('Employee Name')

// Get specific month data
const monthData = monthlyDataStorage.getMonthData('FY25', 'FQ1', 'Jul')

// Get all financial years
const years = monthlyDataStorage.getAvailableFinancialYears()
```

### Using the Data Adapter:
```typescript
import { monthlyDataAdapter } from '@/lib/monthlyDataAdapter'

// Get historical data in dashboard format
const historicalData = monthlyDataAdapter.getEmployeeHistoricalData('Employee Name')

// Get current month data
const currentData = monthlyDataAdapter.getCurrentMonthData('Employee Name')

// Get comparison data
const comparison = monthlyDataAdapter.getComparisonData('Employee Name')
```

## Features

### Manager Upload Page:
- ✅ Month and year selection
- ✅ Financial year and quarter auto-calculation
- ✅ File upload with validation
- ✅ Preview of existing data organized by FY/Quarter/Month
- ✅ Upload status notifications
- ✅ Data merging (new uploads update existing data)

### Data Management:
- ✅ Hierarchical storage (FY → Quarter → Month)
- ✅ Data persistence in localStorage
- ✅ Automatic organization
- ✅ Metadata tracking (last updated, file name, record count)

### Integration:
- ✅ Works with existing individual dashboards
- ✅ Works with manager dashboards
- ✅ Compatible with historical data views
- ✅ Seamless month-on-month comparisons

## Accessing the Upload Page

**Manager access only:** The upload page is accessible via the sidebar:
- Menu item: "Monthly Data Upload"
- URL: `/manager/monthly-upload`

## Data Visibility

### Managers:
- Can upload data for any month
- Can view all employees' data
- Can see complete FY/Quarter/Month hierarchy

### Individual Users:
- Can view their own monthly data
- Can see their mentees' data
- Historical trends and comparisons
- Achievement tracking based on monthly performance

## Example Workflow

1. **Manager logs in** (ajaykumar@presidio.com)
2. **Navigates to "Monthly Data Upload"**
3. **Selects**: Month = Jul, Year = 2024
   - System shows: FY25, FQ1
4. **Uploads Excel file** with July 2024 utilization data
5. **System processes** and stores data under FY25 → FQ1 → Jul
6. **Individual users** can now see their July 2024 data in their dashboards
7. **Repeat for August, September**, etc.

## Tips

- Upload data month by month for accurate historical tracking
- Ensure employee names in Excel match those in the system
- The system handles various column name formats automatically
- Data is stored in browser localStorage - backed up regularly
- Use the "Existing Data" panel to verify uploads

## Future Enhancements

- [ ] Bulk upload (multiple months at once)
- [ ] CSV export by FY/Quarter
- [ ] Data backup/restore functionality
- [ ] Excel template download
- [ ] Comparison reports across quarters
- [ ] Automated email notifications on data upload

## Support

For issues or questions:
- Check the upload status messages
- Verify Excel file format matches requirements
- Ensure employee names are consistent
- Contact system administrator if problems persist
