# Individual Dashboard Data Flow

## How Monthly Uploaded Data Appears in Individual Views

### Data Upload Flow (Manager)
```
Manager uploads monthly data
    ↓
Data stored: FY25 → FQ1 → Jul → [Employee Records]
    ↓
Event triggered: 'monthlyDataUpdated'
    ↓
Individual dashboards automatically refresh
```

### Data Retrieval Flow (Individual User)

#### 1. **My Dashboard** (`/individual`)
When an individual user logs in:
1. System checks if monthly data exists
2. If YES:
   - Loads current month data for the user
   - Loads historical data (weekly/monthly/quarterly/yearly)
   - Shows real uploaded data from manager
3. If NO:
   - Falls back to regular one-time upload data
   - Shows mock historical data for demo

**What the individual sees:**
- ✅ Their current utilization from latest monthly upload
- ✅ Historical trends from all monthly uploads
- ✅ Month-on-month comparisons (real data)
- ✅ Achievement badges based on actual performance
- ✅ Performance gauge with real values
- ✅ Charts showing actual historical trends

#### 2. **My Mentee Dashboard** (`/individual/mentees`)
When viewing mentees:
1. System checks if monthly data exists
2. If YES:
   - Loads all employees from monthly data
   - Filters to show only their mentees
   - Loads historical data for each mentee
3. If NO:
   - Falls back to regular upload data
   - Shows mock historical data

**What the individual sees:**
- ✅ All their mentees from uploaded data
- ✅ Each mentee's current utilization
- ✅ Expandable cards with full analytics per mentee
- ✅ Historical trends for each mentee
- ✅ Real month-on-month comparisons

### Time Period Views

Individual users can select different time periods:

| View | Data Shown |
|------|------------|
| **Weekly** | Last 8 months (treated as weeks for granularity) |
| **Monthly** | Last 6 months of uploaded data |
| **Quarterly** | Last 4 quarters with aggregated data |
| **Yearly** | Last 3 financial years with aggregated data |

### Real vs Mock Data

**With Monthly Uploads (✅ Recommended):**
- Shows REAL data from manager uploads
- Historical trends are ACTUAL performance
- Comparisons are based on REAL month-to-month changes
- Achievement badges reflect ACTUAL milestones

**Without Monthly Uploads (Fallback):**
- Shows current one-time upload data
- Historical data is MOCK/SIMULATED for demo
- Used only when manager hasn't uploaded monthly data

### Data Refresh

Individual dashboards automatically refresh when:
- ✅ Manager uploads new monthly data
- ✅ Regular utilization data is updated
- ✅ User navigates between pages
- ✅ Page is refreshed manually

### What Individual Users Can See

#### From Their Own Data:
- Current utilization percentage
- Project hours vs target hours
- PMN hours
- Fringe impact and presales hours
- Historical performance over time
- Trends (up/down/stable)
- Achievement badges earned
- Performance comparisons

#### From Their Mentees' Data:
- List of all mentees
- Each mentee's utilization
- Mentee performance trends
- Historical data for each mentee
- Comparison metrics
- Achievement tracking for mentees

### Privacy & Data Filtering

**Individual users can ONLY see:**
- ✅ Their own data
- ✅ Their mentees' data (if they are a mentor)

**Individual users CANNOT see:**
- ❌ Other employees' data (unless they are mentees)
- ❌ Manager-level analytics
- ❌ Team-wide comparisons
- ❌ Upload controls

### Example Scenario

**Scenario:** Manager uploads data for July, August, September 2024

**For Individual User (Balakrishna Cherukuri):**

1. **Logs into "My Dashboard"**
   - Sees current utilization from September 2024 (latest upload)
   - Selects "Monthly" view
   - Chart shows: Jul → Aug → Sep utilization trend (REAL data)
   - Month-on-month comparison: Sep vs Aug (REAL numbers)

2. **Navigates to "My Mentee Dashboard"**
   - Sees list of mentees from September data
   - Clicks on a mentee to expand
   - Views mentee's Jul → Aug → Sep trend (REAL data)
   - Compares mentee's performance across months

3. **Switches to "Quarterly" view**
   - System aggregates Jul, Aug, Sep into FQ1 2024
   - Shows FQ1 average utilization
   - Displays quarter-level trends

### Benefits for Individual Users

1. **Real-time Insights** - See actual performance, not estimates
2. **Historical Tracking** - Track progress over months/quarters/years
3. **Goal Setting** - Understand trends to set realistic goals
4. **Self-improvement** - Identify patterns and areas to improve
5. **Mentee Monitoring** - Track and support mentees effectively
6. **Achievement Recognition** - Earn badges for real milestones

### Manager's Responsibility

For individual users to see real data, managers must:
1. Upload monthly data regularly (every month)
2. Ensure employee names match exactly
3. Include mentor relationships in uploads
4. Upload data promptly after month-end

### Data Sources Priority

The system uses this priority order:
1. **Monthly uploaded data** (highest priority - real data)
2. **One-time upload data** (fallback - current snapshot)
3. **Mock historical data** (last resort - demo only)

### Technical Details

**Data Adapter:**
- Converts monthly hierarchical data to dashboard format
- Aggregates quarters and years from monthly data
- Calculates averages and trends
- Provides seamless integration

**Storage:**
- Monthly data stored in localStorage: `mp-monthly-utilization-data`
- Individual dashboards read from this storage
- Automatic refresh on data updates

**Event System:**
- `monthlyDataUpdated` - Fired when manager uploads monthly data
- `utilizationDataUpdated` - Fired when regular data is updated
- Individual dashboards listen and auto-refresh

---

## Summary

✅ **Individual users see REAL uploaded monthly data**  
✅ **Historical trends show ACTUAL performance**  
✅ **Automatic refresh when manager uploads new data**  
✅ **Privacy: Only see own data + mentees' data**  
✅ **Multiple time period views (weekly/monthly/quarterly/yearly)**  
✅ **Seamless fallback if monthly data not available**

This creates a comprehensive, data-driven experience for individual users to track their performance and support their mentees! 🎯
