/* EXPRESS SETUP */
const express = require('express');
const app  = express();

app.use(express.static(__dirname));

const bodyParser = require ('body-parser'); //used to parse the request body that
                                            //Passport uses to authenticate the user
const expressSession = require('express-session')({ //save the session cookie.
    secret: 'secret',
    resave: false,
    saveUninitialized: false,
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use(expressSession);

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`App listening on port ${port}`));


/*PASSPORT SETUP*/
const passport = require('passport');

app.use(passport.initialize());
app.use(passport.session()); 


/*MONGOOSE SETUP*/
const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

//connect to database
mongoose.connect('mongodb://localhost/MyDatabase',
    {useNewUrlParser: true, useUnifiedTopology: true}
);

const Schema = mongoose.Schema;
//define data structure
const UserDetail = new Schema({
    username: String,
    password: String
});

UserDetail.plugin(passportLocalMongoose); //add plugin to UserDetail schema

const UserDetails = mongoose.model('userInfo', UserDetail, 'userInfo'); //Create model for UserDetail Schema


/*PASSPORT LOCAL AUTHENTICATION*/
passport.use(UserDetails.createStrategy());

passport.serializeUser(UserDetails.serializeUser());
passport.deserializeUser(UserDetails.deserializeUser());



/*ROUTES*/

const connectEnsureLogin = require('connect-ensure-login'); //to ensure a user is logged in.  If a request is
                                                            //received that is unauthenticated, the request will be 
                                                            //redirected to a login page. We’ll use this to guard our routes.
app.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err){
            return next(err);
        }
        if (!user){
            return res.redirect('/login?info=' + info);
        }
        req.logIn(user, function(err){
            if(err){
                return next(err);
            }
            return res.redirect('/');
        });
    })(req, res, next);
});

app.get('/login', (req,res) => {
    res.sendFile('html/login.html', {root: __dirname})
});

app.get('/', connectEnsureLogin.ensureLoggedIn(), (req, res) => { //validating the session to make sure you’re allowed to look at that route.
    res.sendFile('html/index.html', {root: __dirname});
})

app.get('/private', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
    res.sendFile('html/private.html', {root: __dirname});
})

app.get('/user', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
    res.send({user: req.user});
})

app.get('/logout', (req,res) => {
    req.logout(),
    res.sendFile('html/login.html', {root: __dirname})
});


/*REGISTER SOME USERS*/ 
UserDetails.register({username: 'paul', active: false}, 'paul');
UserDetails.register({username: 'joy', active: false}, 'joy');
UserDetails.register({username: 'ray', active: false}, 'ray');


 