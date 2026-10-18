require('dotenv').config();
const express    = require('express');
const bodyParser = require('body-parser');
const cors       = require('cors');
const cookieParser = require('cookie-parser');
const path         = require('path');  
const app        = express();


app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(express.json());

app.use(cors({
  // origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
  
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], 
  allowedHeaders: ['Content-Type', 'Authorization']     
}));

app.options('*', cors());
app.use(cookieParser());
// Serve static files. Uploaded gallery images have unique, immutable filenames
// (user_<id>_<timestamp>_<size>.<ext>), so they can be cached aggressively by
// browsers/CDN for far fewer repeat requests. (#2 perf: long-lived caching)
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '365d',
  immutable: true
}));

const routes = require('./routes');
app.use('/api', routes);

const port = process.env.PORT || 9012;
app.listen(port, () => {
  console.log(`✅ Server running on port ${port}`);
});