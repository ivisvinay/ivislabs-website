# IVIS LABS Website

A modern, responsive website for IVIS LABS Private Limited built with React and Tailwind CSS, inspired by the Infosys website design.

## Features

- 🎨 **Multi-colored sections** with gradient backgrounds
- 🚀 **Animated components** using Framer Motion
- 💬 **AI-powered chat widget** for customer engagement
- 📱 **Fully responsive design** for all devices
- 🎯 **Product demos** with interactive showcases
- 🎓 **EdTech platform** integration
- 📝 **Blog system** for content management
- 🔍 **Visual search** demonstrations

## Technologies Used

- **React** - JavaScript library for building user interfaces
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation library for React
- **React Router** - Navigation and routing
- **React Icons** - Icon library
- **Expletus Sans** - Custom font for branding

## Setup Instructions

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create environment file:**
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` and add your API credentials:
   ```
   REACT_APP_API_BASE_URL=your-api-url
   REACT_APP_API_KEY=your-api-key
   REACT_APP_FILE_ID=your-file-id
   ```

3. **Start development server:**
   ```bash
   npm start
   ```
   The app will open at http://localhost:3000

4. **Build for production:**
   ```bash
   npm run build
   ```

## Project Structure

```
ivislabs-website/
├── public/
│   └── index.html
├── src/
│   ├── components/          # Reusable components
│   │   ├── Navbar.js
│   │   ├── Footer.js
│   │   ├── ChatWidget.js
│   │   ├── HeroSection.js
│   │   └── ...
│   ├── pages/              # Page components
│   │   ├── Home.js
│   │   ├── Services.js
│   │   ├── Products.js
│   │   ├── Contact.js
│   │   └── ...
│   ├── services/           # API services
│   │   └── aiService.js
│   ├── App.js             # Main app component
│   ├── index.js           # Entry point
│   └── index.css          # Global styles
├── package.json
├── tailwind.config.js
└── README.md
```

## Key Features

### 1. **Dynamic Hero Section**
- Rotating slides with different themes
- Animated particles and wave patterns
- Call-to-action buttons

### 2. **Services Showcase**
- Computer Vision Solutions
- Visual Search & Product Recognition
- Smart Monitoring Systems
- AR/VR Solutions
- AI Integration & Consulting

### 3. **Product Demonstrations**
- Visual Search Engine
- Machine Shop Monitor
- Entry-Exit System
- Sereno Platform
- AR Pharmacy Search

### 4. **EdTech Platform**
- PULSE educational solutions
- CodeIdea for engineering colleges
- PulseAI for K-12 schools
- Pulse Academy training programs

### 5. **Chat Integration**
- AI-powered assistant
- Real-time responses
- Company information queries
- Product/service inquiries

## Deployment

### Cloudflare Pages

1. Build the project:
   ```bash
   npm run build
   ```

2. Deploy to Cloudflare Pages:
   - Connect your GitHub repository
   - Set build command: `npm run build`
   - Set build output directory: `build`
   - Add environment variables in Cloudflare dashboard

### Custom Domain

Configure your domain in Cloudflare:
- Add CNAME record pointing to your Cloudflare Pages URL
- Enable SSL/TLS encryption
- Configure page rules as needed

## Contact Information

- **Email:** contact@ivislabs.com
- **Phone:** +91 6364411444
- **EdTech:** +91 9449963312
- **LinkedIn:** https://www.linkedin.com/company/ivislabs
- **Instagram:** @ivislabs
- **Location:** Mysuru, Karnataka, India

## Future Enhancements

- [ ] Blog CMS integration
- [ ] Advanced product demos
- [ ] Client portal
- [ ] Multi-language support
- [ ] Analytics dashboard
- [ ] Enhanced chat AI capabilities

## License

© 2024 IVIS LABS Private Limited. All rights reserved.

---

Built with ❤️ by IVIS LABS - Intelligent Vision Labs# ivislabs-website
