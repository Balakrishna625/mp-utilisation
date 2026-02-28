# How to Prepare Excel File for Monthly Upload

## Quick Start Guide

### Step 1: Prepare Your Excel File

Your Excel file should have the following columns (in any order):

| Name | Title | Target Hours | Project | PMN | Utilization | Fringe Impact | Fringe | W/Presales | Mentor |
|------|-------|--------------|---------|-----|-------------|---------------|--------|------------|--------|
| Gayathri Natarajan | Architect | 184 | 260 | - | 141.30% | 0.00% | - | 141.30% | - |
| Indrajit Mahajan | Senior Project Manager | 184 | 258.5 | - | 141.03% | -8.70% | 15 | 141.03% | Azeemushan Ali |

### Column Requirements:

#### Required Columns:
- **Name**: Employee full name (MUST match exactly with employee name in system)

#### Important Columns:
- **Title**: Job title/position
- **Target Hours**: Target hours for the month (usually 184)
- **Project**: Actual project hours logged
- **PMN**: PMN hours
- **Utilization**: Utilization percentage

#### Optional Columns:
- **Email**: Employee email address
- **Fringe Impact**: Fringe impact value
- **Fringe**: Fringe hours
- **W/Presales** or **W/Presales**: Hours with presales
- **Mentor**: Name of employee's mentor (for mentee tracking)

### Step 2: Format Your Data

#### Utilization Percentage:
Can be in any of these formats:
- `141.30%` (with percentage sign)
- `141.30` (as number)
- `1.413` (as decimal - will be auto-converted to 141.3%)

#### Numbers:
- Use numbers for hours: `184`, `260`, `258.5`
- Decimals are supported: `258.5`
- Empty cells are okay (will default to 0)

#### Names:
- **Important**: Employee names MUST match existing records
- Use full names: "Balakrishna Cherukuri" not "Bala"
- Be consistent with spacing and spelling

### Step 3: Upload Process

1. **Login as Manager** (ajaykumar@presidio.com)
2. **Go to "Monthly Data Upload"** in sidebar
3. **Select Month**: Choose the month your data represents (e.g., "Jul", "Aug")
4. **Select Year**: Choose the year (e.g., 2024, 2025)
5. **System shows**: 
   - Financial Year (e.g., FY25)
   - Quarter (e.g., FQ1)
6. **Upload File**: Choose your Excel/CSV file
7. **Click "Upload Data"**
8. **Verify Success**: Check the success message for record count

### Example: Uploading July 2024 Data

**Scenario**: You have July 2024 utilization data

**Steps**:
1. Select Month: `Jul`
2. Select Year: `2024`
3. System calculates: `FY25` (since Jul 2024 is in FY25) and `FQ1`
4. Upload your file
5. Data is stored under: FY25 → FQ1 → Jul

### Example: Uploading January 2025 Data

**Scenario**: You have January 2025 utilization data

**Steps**:
1. Select Month: `Jan`
2. Select Year: `2025`
3. System calculates: `FY25` (since Jan 2025 is in FY25) and `FQ3`
4. Upload your file
5. Data is stored under: FY25 → FQ3 → Jan

## Sample Excel Template

Here's a minimal template you can use:

```
Name                    | Title              | Target Hours | Project | Utilization | Mentor
Balakrishna Cherukuri   | Senior Engineer    | 184          | 176     | 95.65%      | Ajaykumar
Indrajit Mahajan        | Senior PM          | 184          | 259     | 141.03%     | 
Gayathri Natarajan      | Architect          | 184          | 260     | 141.30%     |
```

## Common Issues & Solutions

### Issue: "No valid records found"
**Solution**: 
- Make sure "Name" column exists and has values
- Check that names are not empty
- Verify Excel file is not corrupted

### Issue: Wrong Financial Year showing
**Solution**:
- Double-check the year you selected
- Remember: FY runs July to June
- Jul-Dec 2024 = FY25
- Jan-Jun 2025 = FY25

### Issue: Data not showing in individual dashboard
**Solution**:
- Verify employee name in Excel EXACTLY matches their name in the system
- Check spelling, spaces, and capitalization
- Upload was successful (check for success message)

### Issue: Utilization showing as very small number
**Solution**:
- If your Excel has "1.413" and it shows as "1.41%", it means Excel stored it as decimal
- Re-format in Excel or enter as "141.3%" with percentage sign

## Multiple Months Upload

To upload multiple months:

1. **Upload July 2024**
   - Month: Jul, Year: 2024
   - Upload file → Data stored in FY25/FQ1/Jul

2. **Upload August 2024**
   - Month: Aug, Year: 2024
   - Upload file → Data stored in FY25/FQ1/Aug

3. **Upload September 2024**
   - Month: Sep, Year: 2024
   - Upload file → Data stored in FY25/FQ1/Sep

**Result**: FQ1 of FY25 now has complete data (Jul, Aug, Sep)

## Viewing Uploaded Data

### As Manager:
- Navigate to "Monthly Data Upload"
- Scroll to "Existing Data" section
- See all uploaded FY → Quarter → Months
- Numbers in parentheses show record count

### As Individual:
- Navigate to "My Dashboard"
- Select time period (Monthly, Quarterly, Yearly)
- View your historical utilization data
- See month-on-month comparisons

## Best Practices

✅ **DO**:
- Upload data month by month as it becomes available
- Keep employee names consistent
- Verify upload success messages
- Check "Existing Data" panel after upload

❌ **DON'T**:
- Don't change employee names between uploads
- Don't skip required columns (Name)
- Don't mix different months in one file
- Don't upload same month twice (it will overwrite)

## Need Help?

1. Check the success/error message after upload
2. Verify your Excel format matches the template
3. Test with a small file (2-3 employees) first
4. Contact system administrator if issues persist

## Financial Year Reference

| Month | Calendar Year | Financial Year | Quarter |
|-------|---------------|----------------|---------|
| Jul   | 2024          | FY25           | FQ1     |
| Aug   | 2024          | FY25           | FQ1     |
| Sep   | 2024          | FY25           | FQ1     |
| Oct   | 2024          | FY25           | FQ2     |
| Nov   | 2024          | FY25           | FQ2     |
| Dec   | 2024          | FY25           | FQ2     |
| Jan   | 2025          | FY25           | FQ3     |
| Feb   | 2025          | FY25           | FQ3     |
| Mar   | 2025          | FY25           | FQ3     |
| Apr   | 2025          | FY25           | FQ4     |
| May   | 2025          | FY25           | FQ4     |
| Jun   | 2025          | FY25           | FQ4     |
| Jul   | 2025          | FY26           | FQ1     |

---

**Ready to upload?** Go to "Monthly Data Upload" in the sidebar!
