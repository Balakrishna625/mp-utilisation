# Weekly & Monthly Upload Feature

## Overview
The MP Utilization application now supports both **Monthly** and **Weekly** data uploads. The system automatically calculates and groups data by Financial Year, Quarter, and Month based on the date range you provide.

## How It Works

### 1. Period Types
- **Monthly**: Upload data for an entire month (e.g., July 2025)
- **Weekly**: Upload data for a specific week (e.g., Week 1 of July 2025)

### 2. Automatic Grouping
When you upload data, the system automatically:
- ✅ Calculates the **Financial Year** (FY) based on April-March cycle
- ✅ Determines the **Financial Quarter** (FQ1-FQ4)
- ✅ Assigns the appropriate **Month** name
- ✅ Groups weekly data under the correct month

### 3. Financial Year Calculation
India Financial Year: **April 1 - March 31**

| Month Range | Quarter | Example |
|-------------|---------|---------|
| Apr - Jun   | FQ1     | Apr 2025 = FY26 FQ1 |
| Jul - Sep   | FQ2     | Aug 2025 = FY26 FQ2 |
| Oct - Dec   | FQ3     | Nov 2025 = FY26 FQ3 |
| Jan - Mar   | FQ4     | Feb 2026 = FY26 FQ4 |

## Upload Process

### Step-by-Step Guide

1. **Navigate to Upload Page**
   - Go to the "Upload Data" page

2. **Select Period Type**
   - Choose either "Monthly" or "Weekly"

3. **Select Date Range**
   - **From Date**: Start date of the period
   - **To Date**: End date of the period

4. **Upload File**
   - Click "Choose a file"
   - Select your CSV/Excel file
   - Click "Upload"

### Example: Monthly Upload
```
Period Type: Monthly
From Date: 2025-07-01
To Date: 2025-07-31

Result:
- Financial Year: FY26
- Quarter: FQ2
- Month: Jul
```

### Example: Weekly Upload
```
Period Type: Weekly
From Date: 2025-07-01
To Date: 2025-07-07

Result:
- Financial Year: FY26
- Quarter: FQ2
- Month: Jul (Week 1)
```

### Example: Multiple Weeks
You can upload multiple weeks separately, and they'll all be grouped under the same month:

**Week 1:**
```
From: 2025-07-01, To: 2025-07-07 → Month: Jul
```

**Week 2:**
```
From: 2025-07-08, To: 2025-07-14 → Month: Jul
```

Both weeks will appear under **FY26 > FQ2 > Jul**

## Data Storage

### Database Schema
The system stores the following for each upload:

```typescript
{
  periodType: "monthly" | "weekly",
  fromDate: "2025-07-01",
  toDate: "2025-07-31",
  financialYear: "FY26",
  quarter: "FQ2",
  month: "Jul",
  monthNumber: 7,
  // ... employee utilization data
}
```

### Querying Data
You can filter data by:
- Financial Year (e.g., "FY26")
- Quarter (e.g., "FQ2")
- Month (e.g., "Jul")
- Date Range (fromDate to toDate)
- Period Type ("monthly" or "weekly")

## API Changes

### Upload Endpoint
**POST /api/upload**

New form data fields:
```typescript
{
  file: File,
  periodType: "monthly" | "weekly",
  fromDate: "2025-07-01",
  toDate: "2025-07-31"
}
```

Response includes period information:
```json
{
  "success": true,
  "data": [...],
  "periodInfo": {
    "periodType": "weekly",
    "fromDate": "2025-07-01",
    "toDate": "2025-07-07",
    "financialYear": "FY26",
    "quarter": "FQ2",
    "month": "Jul",
    "monthNumber": 7
  }
}
```

## Date Utilities

### Available Functions
Located in `lib/dateUtils.ts`:

```typescript
// Get financial year for a date
getFinancialYear(new Date('2025-07-15')) // Returns "FY26"

// Get financial quarter
getFinancialQuarter(new Date('2025-07-15')) // Returns "FQ2"

// Get month name
getMonthName(new Date('2025-07-15')) // Returns "Jul"

// Calculate complete period info
calculatePeriodInfo(fromDate, toDate)
// Returns: { financialYear, quarter, month, monthNumber, ... }
```

## Validation Rules

### Date Range Validation
- ✅ From Date must be before or equal to To Date
- ✅ Both dates are required for utilization uploads
- ✅ Dates must be in valid format (YYYY-MM-DD)

### Period Type Validation
- ✅ Must be either "monthly" or "weekly"
- ✅ Defaults to "monthly" if not specified

## Migration from Old Data

### Backward Compatibility
- ✅ Old monthly data remains accessible
- ✅ New fields have default values (periodType = "monthly")
- ✅ Existing dashboards continue to work

### Updating Old Data
Old records without date ranges will:
- Use the first day of the month as `fromDate`
- Use the last day of the month as `toDate`
- Have `periodType = "monthly"`

## Dashboard Integration

### Viewing Weekly Data
Weekly data appears grouped under the appropriate month in all dashboards:

```
FY26
  └─ FQ2
      └─ Jul
          ├─ Week 1 (Jul 1-7)
          ├─ Week 2 (Jul 8-14)
          ├─ Week 3 (Jul 15-21)
          └─ Week 4 (Jul 22-31)
```

### Filtering Options
You can filter by:
1. **Show All** - Monthly + Weekly data combined
2. **Monthly Only** - Only monthly uploads
3. **Weekly Only** - Only weekly uploads
4. **Date Range** - Specific date range

## Benefits

### For Users
✅ **Flexibility** - Upload data weekly or monthly based on availability
✅ **Accuracy** - Track utilization at finer granularity with weekly uploads
✅ **Automatic Grouping** - No manual FY/Quarter/Month entry needed
✅ **Historical Tracking** - Compare weekly trends over time

### For Management
✅ **Better Insights** - See utilization patterns at weekly level
✅ **Real-time Tracking** - Upload data more frequently
✅ **Trend Analysis** - Identify weekly variations in team utilization

## Technical Details

### Database Changes
Added to `monthly_utilization` table:
- `periodType` (String, default: "monthly")
- `fromDate` (DateTime)
- `toDate` (DateTime)

### Indexes
New indexes for performance:
- `periodType` - Fast filtering by period type
- `fromDate, toDate` - Fast date range queries

### API Changes
All utilization APIs now support:
- Period type filtering
- Date range filtering
- Automatic FY/Quarter/Month calculation

## Troubleshooting

### Common Issues

**Issue**: "Please select both From Date and To Date"
- **Solution**: Ensure you've selected dates in both date pickers

**Issue**: "From Date must be before or equal to To Date"
- **Solution**: Check that your From Date is not after your To Date

**Issue**: Wrong Financial Year assigned
- **Solution**: Remember FY runs April-March, not January-December

## Future Enhancements

Potential future features:
- 📊 Daily uploads (coming soon)
- 📈 Automatic week number calculation
- 🔄 Bulk upload for multiple weeks
- 📅 Calendar view for selecting date ranges
- 📱 Mobile-friendly date pickers

## Support

For questions or issues:
1. Check this documentation
2. Review the upload validation messages
3. Verify your date range is correct
4. Ensure file format matches requirements

---

**Last Updated**: February 25, 2026
**Version**: 2.0
