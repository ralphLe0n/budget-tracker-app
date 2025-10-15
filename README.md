# Budget Tracker App

A modern, feature-rich budget tracking application built with React, Tailwind CSS, and Recharts.

## Features

- 📊 **Dashboard** - View income, expenses, and balance at a glance
- 📈 **Interactive Charts** - Pie chart, line chart, and bar chart visualizations
- 🏷️ **Categories** - Create and manage budget categories
- 🔄 **Recurring Transactions** - Set up automatic recurring income/expenses
- 🔍 **Filters** - Filter transactions by date range and category
- 💰 **Budget Tracking** - Monitor spending against budget limits

## Tech Stack

- **React** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Recharts** - Data visualization
- **Lucide React** - Icons

## Local Development

### Prerequisites

- Node.js 16+ installed
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd budget-tracker-app
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open your browser to `http://localhost:5173`

## Building for Production

```bash
npm run build
```

The built files will be in the `dist` folder.

## Deployment to Vercel

### Option 1: Via Vercel Dashboard (Recommended)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Vercel will auto-detect it's a Vite project
6. Click "Deploy"

### Option 2: Via Vercel CLI

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

## Customizing Colors

All colors are centralized in the `THEME` object at the top of `src/App.jsx`. 

To change the color scheme, simply edit these values:

```javascript
const THEME = {
  primary: '#3b82f6',    // Blue - change to your preferred color
  success: '#10b981',    // Green
  danger: '#ef4444',     // Red
  warning: '#f59e0b',    // Orange
  // ... etc
};
```

## Project Structure

```
budget-tracker-app/
├── src/
│   ├── App.jsx          # Main application component
│   ├── main.jsx         # React entry point
│   └── index.css        # Global styles
├── index.html           # HTML template
├── package.json         # Dependencies
├── vite.config.js       # Vite configuration
├── tailwind.config.js   # Tailwind configuration
└── postcss.config.js    # PostCSS configuration
```

## Future Enhancements

- [ ] Supabase integration for data persistence
- [ ] User authentication
- [ ] Export data to CSV/PDF
- [ ] Mobile app version
- [ ] Dark mode toggle

## License

MIT
