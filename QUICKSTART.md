# ShopEZ - Quick Start Guide 🚀

## Prerequisites
- **Node.js** v18+ ([Download](https://nodejs.org))
- **MongoDB** ([Download Community Edition](https://www.mongodb.com/try/download/community))
- **npm** or **yarn** (comes with Node.js)

## ⚡ Quick Start

### 1. MongoDB Setup
Before starting the application, ensure MongoDB is running:

**Windows:**
```bash
# MongoDB is typically installed as a service and runs automatically
# Or start it manually:
mongod
```

**Mac (using Homebrew):**
```bash
brew services start mongodb-community
```

**Linux:**
```bash
sudo systemctl start mongod
```

### 2. Backend Setup

```bash
cd backend
npm install
npm run dev
```

The backend will start on `http://localhost:5000`

**Expected Output:**
```
Server running on port 5000 in development mode
MongoDB Connected: localhost
```

### 3. Frontend Setup (New Terminal)

```bash
cd frontend
npm install
npm start
```

The frontend will start on `http://localhost:3000` and open automatically.

## 🎯 First Time Setup

### Create Admin Account
1. Go to http://localhost:3000/register
2. Register with:
   - Name: Admin User
   - Email: admin@shopez.com
   - Password: admin123
   - Role: Seller

3. Once registered, manually update in MongoDB:
```javascript
// In MongoDB Atlas or local MongoDB:
db.users.updateOne(
  { email: "admin@shopez.com" },
  { $set: { role: "admin" } }
)
```

Or use the existing demo credentials:
- **Admin**: admin@shopez.com / admin123
- **User**: user@shopez.com / password123
- **Seller**: seller@shopez.com / seller123

## 📁 Directory Structure

```
shopez/
├── backend/          # Express.js API server
├── frontend/         # React.js web application
├── README.md         # Full documentation
└── start.sh          # Start script (Unix/Mac)
```

## 🔧 Available Commands

### Backend
```bash
cd backend
npm run dev        # Start with auto-reload (nodemon)
npm start         # Start production server
npm install       # Install dependencies
```

### Frontend
```bash
cd frontend
npm start         # Start development server
npm build         # Build for production
npm test          # Run tests
npm install       # Install dependencies
```

## 🌐 Access Points

| Component | URL | Purpose |
|-----------|-----|---------|
| Frontend | http://localhost:3000 | Web application |
| Backend API | http://localhost:5000 | REST API |
| MongoDB | localhost:27017 | Database |

## 📦 Key Features to Try

### 1. **Shopping**
- Browse products on home page
- Search and filter by category, price
- Add products to cart
- Proceed to checkout

### 2. **Order Management**
- Complete multi-step checkout
- Track orders in "My Orders"
- View order details and status

### 3. **Seller Features** (after changing role to seller)
- Go to `/seller/dashboard`
- Create new products
- View product performance
- Manage inventory

### 4. **Admin Features** (after changing role to admin)
- Go to `/admin/dashboard`
- View platform statistics
- Manage users
- Update order statuses

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill the process using port 5000 (backend)
# Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Mac/Linux:
lsof -ti:5000 | xargs kill -9
```

### MongoDB Connection Failed
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution:** Ensure MongoDB is running:
- Windows: Check Services or start `mongod`
- Mac: `brew services start mongodb-community`
- Linux: `sudo systemctl start mongod`

### Dependencies Not Installing
```bash
# Clear npm cache
npm cache clean --force

# Try installing again
npm install
```

### CORS Errors
- Ensure backend is running on port 5000
- Check `proxy` in frontend `package.json`
- Verify backend CORS configuration

## 📝 Environment Variables

### Backend (.env)
```
MONGO_URI=mongodb://localhost:27017/shopez
JWT_SECRET=your_secret_key_here
PORT=5000
NODE_ENV=development
```

### Frontend
No .env file needed. Backend URL is configured via `proxy` in package.json

## 🚀 Deployment

### Backend Deployment (Heroku/Railway)
1. Push code to GitHub
2. Connect to hosting platform
3. Set environment variables
4. Deploy

### Frontend Deployment (Vercel/Netlify)
1. Build: `npm run build`
2. Deploy the `build/` folder
3. Set API endpoint in environment

## 📚 Documentation

- [Full README.md](./README.md) - Complete project documentation
- [API Documentation](./API.md) - API endpoints reference
- [Database Schema](./DATABASE.md) - Database structure

## 💡 Tips

1. **Development**
   - Use browser DevTools (F12) to inspect network requests
   - Check browser Console for React errors
   - MongoDB Compass for database visualization

2. **Testing**
   - Create test accounts for different roles
   - Test checkout flow with test products
   - Verify order tracking

3. **Customization**
   - Update colors in `frontend/src/index.css`
   - Modify product categories in controllers
   - Add new fields to models as needed

## ✅ Checklist

- [ ] Node.js installed and working
- [ ] MongoDB installed and running
- [ ] Backend dependencies installed
- [ ] Frontend dependencies installed
- [ ] Backend server running (port 5000)
- [ ] Frontend server running (port 3000)
- [ ] Can access http://localhost:3000
- [ ] Can login/register
- [ ] Can browse products
- [ ] Can complete checkout

## 🆘 Still Having Issues?

1. Check console for detailed error messages
2. Verify all services are running
3. Clear browser cache (Ctrl+Shift+Delete)
4. Try in an incognito/private window
5. Restart both backend and frontend

## 📞 Support

For issues, check:
- [GitHub Issues](https://github.com/yourusername/shopez/issues)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/mern)
- Project documentation in README.md

---

**Happy Building! 🎉**
