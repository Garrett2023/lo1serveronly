/**
 * secure.js
 * router for the secure/ path examples
 */
/* eslint-disable max-len */

const express = require('express');
const router = express.Router();

// require fs package to do some file IO (move uploaded files)
const fs = require('fs');

// require a module to generate and decode JWT
const jwt = require('jsonwebtoken');

// BEST PRACTICE: is to store the secret in an environment variable or file
// the line below is bad practice but good enough for an example
const secret ='6ImRhc2hib2FyZCIsImlhdCI6MTYzMjMwNTA1OX0.iaVBoA0v3cVdK5PzLQs8A4XAdvCNb';

// require passport and configure to use the JWT scheme
// remember passport can use over 500 different schemes to authenticate
// https://www.passportjs.org/packages/passport-jwt/
const passport = require('passport');
// declare alias for the JWT Strategy
const JwtStrategy = require('passport-jwt').Strategy;
// declare alias for Extractor - because we are not using the default Authenticate Header for the token
const ExtractJwt = require('passport-jwt').ExtractJwt; // set of pre-defined extractors - where to get the token

// configure passport to use JWT
passport.use( new JwtStrategy({
// look the token in the URL or BODY specifically the access_token parameter
            jwtFromRequest: ExtractJwt.fromExtractors([
                ExtractJwt.fromUrlQueryParameter('access_token'),
                ExtractJwt.fromBodyField('access_token'),
            ]),
            // specify the public key we need to decrypt the token
            secretOrKey: fs.readFileSync('es256public.pem'), // get file buffer of binary file data
            algorithm: 'ES256',
        },
        (payload, done)=>{ // verify handler
                           // ensure the role is allowed
            if (!['admin', 'employee', 'client'].includes(payload.role)) {
                // specify that the role is invalid
                return done(null, false, {message: 'Specified role is not allowed'} );
            }
            // ensure the scope is allowed
            if (!['dashboard', 'profile', 'booking'].includes(payload.scope)) {
                // specify that the scope is invalid
                return done(null, false, {message: 'Specified scope is not allowed'} );
            }
            // return a success notification to the passport process
            // normally we would use the payload to search a database then pass along a user object
            // - but for new we are passing along the payload from the JWT
            return done(null, payload);
        }),
);


/** ******************************
 * LOGIN GET
 */
router.get('/', function(req, res, next) {
    res.render('secure-login', {
        title: 'GET LOGIN FORM',
        // submittedEmail: req.body.email,
        // submittedPassword: req.body.password,
        submittedEmail: 'admin@t.ca', // hard code an email to save on typing it all the time
        submittedPassword: '123456Pw', // hard code a password to save on typing it all the time
    });
});


/** ******************************
 * LOGIN POST
 */
router.post('/', function(req, res, next) {
    const payload = determineAccess(req);
    if (payload.role) {
        // redirect to the appropriate webpage for the user
        res.redirect('/secure/'+ payload.scope + '/?access_token=' + encodeJWT(payload));
    } else {
        // show error messages - let the user try again
        res.render('secure-login', {
            title: 'POST LOGIN FORM',
            isSubmitted: true,
            err: {email: 'Email is not recognized', pwd: 'Password is not recognized'},
            submittedEmail: req.body.email,
            submittedPassword: req.body.pwd,
        });
    }
});


/** **************************
 * GET Dashboard Profile Booking
 */
router.get([
    '/dashboard', '/profile', '/booking',
], (req, res, next)=>{
// get the current scope from the request path (remove the slashes from /dashboard/)
    const scope = req.path.replace(/^\/+|\/+$/g, '');
    // check the user has access to the current scope
    const decoded = checkJWT(req.query['access_token'], scope);

    if (decoded.redirectURL) {
        // show the error on the login page
        res.redirect(decoded.redirectURL);
    } else {
        // display the webpage with title and token payload
        res.render('secure-generic', {
            title: scope.toUpperCase(),
            token: req.query['access_token'],
            payload: decoded,
            action: req.baseUrl + req.path,
        });
    }
} );


/** **************************
 * POST Dashboard Profile Booking
 */
router.post([
    '/dashboard', '/profile', '/booking',
], (req, res, next)=>{
    // console.log(req.path);
    const scope = req.path.replace(/^\/+|\/+$/g, '');
    // check the user has access to the current scope
    const decoded = checkJWT(req.body['access_token'], scope);

    if (decoded.redirectURL) {
        // show the error on the login page
        res.redirect(decoded.redirectURL);
    } else {
        // display the webpage with title and token payload
        res.render('secure-generic', {
            title: 'POST' + scope.toUpperCase(),
            token: req.body['access_token'],
            payload: decoded,
        });
    }
} );


/** ******************************
 * GET PASSPORT - http://localhost:3000/secure/passport
 */
router.get('/passport', passport.authenticate('jwt', {
        session: false, // be default passport stores the data in a session - but not for us in this example
        failureRedirect: '/secure/?err=jwt+not+verified', // catch all unauthorized error action
    }),
    (req, res, next)=>{
        // when inside the handler function we can perform additional authorization
        // passport has expose a new req.currentUser property which contains the token payload becaue that is what we
        // passed along in the passport.use function

        // Example check that user is an admin or employee
        if (!['admin', 'employee'].includes(req.currentUser.role)) {
            res.redirect('/secure/?err=insufficient+permissions');
        } else {
            res.render('secure-generic', {
                title: 'GET - PASSPORT',
                token: req.query['access_token'],
                payload: req.currentUser,
                action: req.baseUrl+req.path, // result '/secure/passport/'
            });
        }
    });


/** *******************************
 * POST PASSPORT
 */
// POST content for path: http://localhost:3000/secure/passport/
router.post('/passport', passport.authenticate('jwt', {
        session: false,
        failureRedirect: '/secure/?err=jwt+expired',
    }),
    (req, res, next)=>{

        if (!['admin', 'employee'].includes(req.currentUser.role)) {
            res.redirect('/secure/?err=insufficient+permissions');
        } else {
            res.render('secure-generic', {
                title: 'POST - PASSPORT',
                token: req.body['access_token'],
                payload: req.currentUser,
            });
        }
    });


//---------------------------------------------------------------------------------//

/**
 * Determine role and scope from email and password
 * @param {Request} req
 * @return {{role: null, scope: null}}
 */
const determineAccess = (req)=> {
    const payload = {role: null, scope: null};
    // authenicate password
    if (req.body.pwd === '123456Pw') {
        // authenticate email
        switch (req.body.email.toLowerCase()) {
            case 'admin@t.ca':
                payload.role = 'admin';
                payload.scope = 'dashboard'; // webpage they have access to
                break;
            case 'work@t.ca':
                payload.role = 'employee';
                payload.scope = 'profile';
                break;
            case 'client@t.ca':
                payload.role = 'client';
                payload.scope = 'booking';
                break;
            default:
            // do nothing
            //     break;
        }
    }
    return payload;
};

/**
 * generate at JWT from the payload and options
 * @param {{role: '', scope: ''}} payload
 * @return {String} token
 */
const encodeJWT = (payload)=>{
    // get a private key stored in a file
    const privateKey = fs.readFileSync('es256private.key'); // gets file buffer with binary file content

    // use private key to encrypt the token with ES256 encoding scheme
    const token = jwt.sign(payload, privateKey, {algorithm: 'ES256', expiresIn: '30s',} );
    return token;
};

/**
 * Check the payload role and scope and compare to the current scope path
 * @param {String} token
 * @param {String} scope
 * @return {{scope}}
 */
const checkJWT = (token, scope)=>{
    let decoded;
    try {

        // get a public key stored in a file
        const cert = fs.readFileSync('es256public.pem'); // get file buffer of binary file data
        // use public key to decrypt the token with ES256 scheme
        decoded = jwt.verify(token, cert, {algorithm: 'ES256',
        } );

        // check that the scope in the token matches the scope passed in as a param
        if (!decoded.role || decoded.role != 'admin') { // this allows admin user to go to any page
            if (!decoded.scope || decoded.scope != scope) throw new Error('scope is not permitted');
        }
    } catch (err) {
        console.log(`JWT Error:\n ${err}`);
        // redirect back to login page and specify the error message in the query string
        decoded = {redirectURL: '/secure/?err=' + err.message};
    }
    return decoded;
};


module.exports = router;
