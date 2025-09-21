# Smart Water Surveillance System

A comprehensive water monitoring and early warning system for disease outbreak prevention, featuring interactive mapping, hotspot detection, and educational content management.

![Water Monitoring System](https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1200&h=400&fit=crop)

## 🌟 Features

### 📍 **Interactive Mapping & Hotspot Detection**
- Real-time water quality monitoring with interactive maps
- Automatic hotspot detection using geospatial clustering algorithms
- Community reporting system for water quality issues
- Visual markers for contaminated water sources and health incidents

### 🚨 **Early Warning System**
- Automated notifications for disease outbreak alerts
- Real-time hotspot monitoring with severity assessment
- Browser notifications with audio alerts
- Rate limiting and notification management interface

### 📚 **Educational Content Management**
- Comprehensive library of water safety educational materials
- Support for articles, videos, image guides, interactive content, and checklists
- **Drag-and-drop content creation** - simply upload images/videos with titles
- Advanced search and filtering by category, type, and difficulty
- Progress tracking and bookmark system for users
- Admin panel for content management and publishing

### 📊 **Analytics & Reporting**
- Water quality trend analysis
- Disease outbreak pattern recognition
- Community health monitoring dashboard
- Exportable reports for health authorities

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** (v8 or higher)
- **MongoDB** (local or cloud instance)
- **Git**

### 1. Clone the Repository

```bash
git clone https://github.com/SammyBoy-09/Water-Monitoring.git
cd Water-Monitoring
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Create a `.env` file in the root directory:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/water-monitoring
# or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/water-monitoring

# Server Configuration
PORT=8080
NODE_ENV=development

# Optional: ThingsBoard Integration
TB_BASE_URL=your-thingsboard-url
TB_USERNAME=your-username
TB_PASSWORD=your-password

# Notification Settings
PING_MESSAGE=Water monitoring system is online
```

### 4. Start the Development Server

```bash
npm run dev
```

The application will be available at:
- **Local**: http://localhost:8080
- **Network**: http://[your-ip]:8080

## 📖 Usage Guide

### 🎓 Educational Module (New Feature!)

#### For End Users:
1. Navigate to **Education** in the main menu
2. Browse the **Library** to find water safety content
3. Use **search and filters** to find specific topics
4. Click any content card to read/watch detailed materials
5. **Bookmark** important content for later reference
6. Track your **reading progress** automatically

#### For Content Creators:
1. Click **"Quick Upload"** in the Educational Center
2. **Drag and drop** your images, videos, or documents
3. Add a **title and brief description**
4. Click **"Create Educational Content"** - that's it!

The system automatically:
- Detects content type (video/image guide/article)
- Sets appropriate categories and difficulty levels
- Generates learning objectives
- Makes content immediately available

#### For Administrators:
1. Toggle **"Admin Mode"** in the Educational Center
2. Access the **content management dashboard**
3. Create, edit, publish, and manage all educational content
4. View content analytics and user engagement metrics

### 🗺️ Interactive Mapping
1. Navigate to **Dashboard** to view the interactive map
2. Report water quality issues using **Community Reporting**
3. View **real-time markers** for contaminated sources
4. Monitor **hotspot alerts** for disease outbreak areas

### 📊 Analytics
1. Go to **Analytics** to view system insights
2. Monitor water quality trends and outbreak patterns
3. Export reports for health authorities

## 🏗️ Project Structure

```
Water-Monitoring/
├── client/                     # Frontend React application
│   ├── components/
│   │   ├── education/         # Educational module components
│   │   │   ├── EducationalLibrary.tsx    # Content browsing
│   │   │   ├── ContentViewer.tsx         # Content display
│   │   │   ├── ContentManagement.tsx     # Admin panel
│   │   │   └── QuickContentCreator.tsx   # Drag-drop uploader
│   │   ├── map/               # Mapping components
│   │   ├── notifications/     # Alert system
│   │   └── ui/               # Reusable UI components
│   ├── pages/                # Application pages
│   └── App.tsx              # Main application
├── server/                   # Backend Express server
│   ├── routes/              # API endpoints
│   │   ├── education.ts     # Educational content API
│   │   ├── hotspots.ts      # Hotspot detection API
│   │   └── markers.ts       # Map markers API
│   ├── data/               # Sample data
│   └── db.ts              # Database connection
├── shared/                 # Shared types and utilities
│   ├── types/             # TypeScript type definitions
│   └── utils/             # Shared utility functions
└── package.json
```

## 🛠️ Development

### Available Scripts

```bash
# Development server (frontend + backend)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test

# Format code
npm run format.fix

# Type checking
npm run typecheck
```

### Adding New Educational Content

#### Method 1: Quick Upload (Recommended)
1. Go to `/education` and click "Quick Upload"
2. Drag and drop your files
3. Fill in title and description
4. Click "Create Educational Content"

#### Method 2: Admin Panel
1. Enable "Admin Mode" in the Educational Center
2. Click "Create Content" for full control over all fields
3. Set categories, difficulty levels, learning objectives, etc.

#### Method 3: API Integration
```javascript
POST /api/education
{
  "title": "Water Safety Guide",
  "description": "Comprehensive water safety information",
  "category": "water_safety",
  "type": "article",
  "content": "<p>Your HTML content here</p>",
  "tags": ["safety", "water", "health"]
}
```

### Database Schema

The system uses MongoDB with collections for:
- `educational_content` - Educational materials
- `markers` - Map markers for water sources/incidents
- `hotspots` - Detected outbreak hotspots
- `user_progress` - Learning progress tracking
- `reports` - Community reports

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/water-monitoring` |
| `PORT` | Server port | `8080` |
| `NODE_ENV` | Environment mode | `development` |
| `PING_MESSAGE` | Health check message | `ping` |

### MongoDB Setup

#### Option 1: Local MongoDB
1. Install MongoDB locally
2. Start MongoDB service
3. Use default connection string

#### Option 2: MongoDB Atlas (Cloud)
1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a cluster and database
3. Get connection string and update `.env`

## 📱 API Documentation

### Educational Content API

#### Get All Content
```http
GET /api/education?category=water_safety&type=article&limit=20
```

#### Create Content
```http
POST /api/education
Content-Type: application/json

{
  "title": "Water Safety Basics",
  "description": "Learn fundamental water safety principles",
  "category": "water_safety",
  "type": "article",
  "content": "<h2>Safety Guidelines</h2><p>Content here...</p>"
}
```

#### Update Progress
```http
POST /api/education/{id}/progress
Content-Type: application/json

{
  "progress": 75,
  "status": "in_progress",
  "timeSpent": 300
}
```

### Hotspots API

#### Detect Hotspots
```http
POST /api/hotspots/detect
Content-Type: application/json

{
  "markers": [
    {"lat": 12.9716, "lng": 77.5946, "type": "contamination"},
    {"lat": 12.9726, "lng": 77.5956, "type": "health_incident"}
  ]
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Troubleshooting

### Common Issues

**Issue**: "Cannot connect to MongoDB"
**Solution**: Ensure MongoDB is running and connection string is correct in `.env`

**Issue**: "Educational content not loading"
**Solution**: Check browser console for API errors. Sample content should load automatically.

**Issue**: "Drag and drop not working"  
**Solution**: Ensure you're on the "Quick Upload" tab and files are supported formats (images, videos, documents).

**Issue**: "Maps not displaying"
**Solution**: Check browser console for Leaflet errors. Ensure internet connection for map tiles.

### Getting Help

- 📧 **Email**: [your-email@example.com]
- 🐛 **Issues**: [GitHub Issues](https://github.com/SammyBoy-09/Water-Monitoring/issues)
- 📖 **Documentation**: This README file

## 🎯 Roadmap

- [ ] Mobile app development
- [ ] Multi-language support for educational content
- [ ] Real-time chat support for emergency situations
- [ ] Integration with government health databases
- [ ] AI-powered content recommendations
- [ ] Offline mode for remote areas

---

**Built with ❤️ for community health and water safety**

*This system is designed to help communities monitor water quality, prevent disease outbreaks, and educate people about water safety practices.*