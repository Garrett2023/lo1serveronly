const express = require('express');
const router = express.Router();
/* eslint-disable max-len */

/** ***********************
 * GET Set Cookie
 */
router.get('/cookie', (req, res, next)=>{
    res.render('set-cookie', {
        title: 'GET - Set Cookie',
        activeCookies: req.cookies, // cookies sent to the server
    });
});


/** ***********************
 * POST Set Cookie
 */
router.post('/cookie', (req, res, next)=>{
    // set some standard cookie options
    const cookieOptions = {
        path: req.baseUrl,
        sameSite: 'lax',
        httpOnly: req.body.hide && req.body.hide ==='yes', // setting httpOnly to true hides the cookie from Javascript in the browser
    };

    // did the user click the Clear all Cookies button
    if (req.body.clear && req.body.clear ==='clear') {
        console.log(req.cookies);
        // loop thorough all the cookies and TRY to remove all cookies
        for (const cookieName in req.cookies) {
            // clearCookie is very strict - will only clear the cookie if name AND options are the same
            // it seems to ignore the expiry date when checking the cookie options
            res.clearCookie(cookieName, cookieOptions);
        }
    } else {

        cookieOptions.maxAge = 1000 * req.body.expiry; // value in milliseconds

        // set the cookie with the name the value and the options
        // server sends a Set-cookie header instructing the browser save the cookie locally
        res.cookie(req.body.name, req.body.value, cookieOptions);
    }

    res.render('set-cookie', {
        title: 'POST - Set Cookie',
        activeCookies: req.cookies, // cookies sent to the server
        postedValues: req.body,
    });
});

module.exports = router;