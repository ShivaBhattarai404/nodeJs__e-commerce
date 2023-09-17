const express = require('express');
const { mongoose } = require('mongoose');
const session = require('express-session')
const mongodbStore = require('connect-mongodb-session')(session)
const bodyParser = require('body-parser');
const path = require('path');
const csrfProtection = require('csurf')()
const flash = require('connect-flash')
const multer = require('multer')

const errorController = require('./controllers/error');
const User = require('./models/user');

const app = express();
// const MONGODB_URI = 'mongodb+srv://shiva:kerwani123@cluster0.i8wdij1.mongodb.net/shop'
const MONGODB_URI = 'mongodb+srv://shiva:kerwani12345@cluster0.ugfyt7l.mongodb.net/'
const store = new mongodbStore({
    uri: MONGODB_URI,
    collection: 'sessions'
});

app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const auth = require('./routes/auth');

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images')
    },
    filename: (req, file, cb) => {
        cb(null, new Date().toISOString().replace(/:/g, '-')+ '-' +file.originalname)
    }
})
const fileFilter = (req, file, cb) => {
    if(file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg'){
        cb(null, true)
    }
    else{
        cb(null, false)
    }
}
app.use(bodyParser.urlencoded({ extended: false }));
app.use(multer({storage: fileStorage, fileFilter: fileFilter}).single('image'))
app.use('/images', express.static(path.join(__dirname, 'images')))
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({ secret: 'My secret', resave: false, saveUninitialized: false, store: store }))
app.use(csrfProtection)
app.use(flash())

app.use((req, res, next) => {
    res.locals.isAuthenticated = req.session.isAuthenticated
    res.locals.csrfToken = req.csrfToken()
    if (!req.session.user)return next()
    User.findById(req.session.user._id)
    .then((user) => {
        if (!user)return next()
        req.user = user
        next()
    })
    .catch(err => next(err));
})
app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(auth);
app.get('/500',errorController.get500);
app.use(errorController.get404);
app.use((error, req, res, next) => {
    console.log(error)
    res.status(500).render('500', { pageTitle: 'Error', path: '/500', isAuthenticated: false, error: null})
})

mongoose.connect(MONGODB_URI)
    .then((result) => {
        app.listen(3000)
    })
    .catch((err) => {
        console.log(err);
    });
