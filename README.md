# MP Utilisation - Employee Time Tracking System

A modern, enterprise-level employee utilization tracking application built with Next.js, TypeScript, and Tailwind CSS.

## Features

- 📊 **Dashboard Views**: Weekly, Monthly, Quarterly, and Annual views
- 📤 **CSV Upload**: Easy data import with drag-and-drop functionality
- 📈 **Analytics**: Real-time charts and visualizations using Recharts
- 🔍 **Search & Filter**: Powerful data filtering capabilities
- 📱 **Responsive Design**: Works seamlessly on all devices
- 🎨 **Dark Theme**: Professional dark-themed UI with custom color coding
- 📥 **Export**: Export data to CSV format

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Icons**: Lucide React
- **CSV Parsing**: PapaParse

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd mp-utilisation
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
mp-utilisation/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── upload/        # CSV upload endpoint
│   │   └── utilization/   # Data retrieval endpoint
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── Dashboard.tsx      # Main dashboard
│   ├── Sidebar.tsx        # Navigation sidebar
│   ├── CSVUpload.tsx      # CSV upload modal
│   ├── UtilizationTable.tsx   # Data table
│   └── UtilizationCharts.tsx  # Charts and graphs
├── types/                 # TypeScript type definitions
│   └── utilization.ts     # Data models
├── public/                # Static assets
├── tailwind.config.ts     # Tailwind configuration
├── tsconfig.json          # TypeScript configuration
└── package.json           # Dependencies
```

## CSV Format

Upload CSV or Excel files with the following columns:

- **Name**: Employee name
- **Title**: Job title/position
- **Target Hours**: Expected billable hours
- **Project**: Actual project hours worked
- **PMN**: PMN hours
- **Utilization**: Utilization percentage
- **Fringe Impact**: Fringe impact percentage
- **Fringe**: Fringe hours
- **W/Presales**: With presales percentage

### Example Excel Format:
```
Name                    | Title           | Target Hours | Project | PMN | Utilization | Fringe Impact | Fringe | W/Presales
Azeemushan Ali         | Lead Engineer   | 528          | 544     | 0   | 103.03%     | -6.06%        | 32     | 103.03%
Gokula Krishnan K S    | Senior Engineer | 528          | 531     | 0   | 100.57%     | -16.29%       | 86     | 100.57%
```

## Data Storage

### Browser Storage (Current Implementation)
The application currently uses **localStorage** for temporary data storage:
- Data persists across browser sessions
- Stored locally on your device
- No server-side database required
- Easy to clear using the "Clear Data" button

### How It Works
1. **Upload**: When you upload a CSV/Excel file, the API parses it
2. **Transform**: Data is normalized and validated
3. **Store**: Stored in browser's localStorage
4. **Display**: Dashboard reads from localStorage and displays charts/tables

### Testing Your Data
Open browser console and run:
```javascript
window.testDataParsing()
```
This will validate your uploaded data and show statistics.

### Data Persistence
- ✅ Data persists after page refresh
- ✅ Data persists after browser restart
- ❌ Data is device-specific (not synced across devices)
- ❌ Clearing browser data will remove your uploads

## Future Enhancements - Database Integration

The application is ready for database integration. To connect to a database:

- Database integration (PostgreSQL/MongoDB)
- User authentication and authorization
- Advanced filtering and reporting
- Email notifications
- Team management
- Historical data comparison
- Custom report generation

## Database Setup (TODO)

The application is ready for database integration. You can connect:
- PostgreSQL
- MongoDB
- MySQL
- Any other database of your choice

Update the API routes in `app/api/` to connect to your database.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is proprietary and confidential.
