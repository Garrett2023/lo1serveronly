/**
 * examples.js
 * router for path: http://localhost:3000/examples/
 */

const express = require('express')
const router = express.Router()
// add packages that will handle the file uploads
// https://www.npmjs.com/package/multer#usage
const multer = require('multer');
// IMPORTANT: ensure you created the destination folder before using it below
const upload = multer({ //multer settings
    dest: 'public/uploads/',
    fileFilter: (req, file, callback) => {
        // check mime type starts with 'image/'
        if (file.mimetype.startsWith('image/')) {
            callback(null, true); // file mime type is allowed
        } else {
            // file not allowed, so return callback with new error message
            return callback(new Error('Only images are allowed'));
        }
    },
    limits: {
        // limit file size to 2MB -> 2*1024*1024
        fileSize: 2 * 1024 * 1024,
    }
});
//required package for file io
const fs = require('fs');

// require validator packages
const {body, query, validationResult} = require('express-validator');

// custom error formatter to help traverse the fields and error messages
const onlyMsgErrorFormatter = ({location, msg, param, value, nestedErrors}) => {
    return msg; // only return the message of the error
};


//TODO: code to handle GET request to the /examples/ path
/* GET content for path: http://localhost:3000/examples/ */
router.get('/', function (req, res, next) {
    // send content directly to the browser (not using a template) - this can be tedious
    res.send('<html><head><title>Examples Index</title> <link rel="stylesheet" href="/bw/quartz/bootstrap.css" /></head>' +
        '<body class="container"><h1>Examples</h1><ul>' +
        '<li><a href="/examples/simple-code/">Simple Server Code examples</a></li>' +
        '</ul></body>')
})

/* GET content for path: http://localhost:3000/examples/simple-code */
router.get('/simple-code', function (req, res, next) {
    // some simple logic to generate a random number from 0 to 5
    let rnd = Math.floor(Math.random() * 5);
// call the render function to open the simple-code template
// in the options send in as many parameters as you want
// the options parameters can then be used in the template using the moustache syntax i.e {{ variable }}
    res.render('simple-code', {
        title: 'Simple Server Code examples', // title used by the layout.hbs - appears at the top the page
        myName: 'Garrett Harden',
        myPosition: 'Student',
        randomNum: rnd, // use the random number generated above to display on the page
        randomIsEven: rnd % 2 === 0, // check if the random number is even and set a boolean variable
        names: ['Aaron', 'Betty', 'Carl', 'Debby', 'Eric', 'Frank', 'Garrett', 'Harry', 'Ivan', 'James', 'Kyle', 'Larry', 'Marry', 'Natalia', 'Oscar', 'Peter', 'Quinn', 'Ryan', 'Steve', 'Tim', 'Ursula', 'Vince', 'William', 'Xavier', 'Yashpal', 'Zane'] // arrays and objects can also be sent to the template
    })
})

/*// TODO: code to handle GET request to /examples/upload/ path
/!* GET content for path: http://localhost:3000/examples/upload *!/
router.get('/upload', (req, res, next) => {
    res.render('upload-files', {
        title: 'GET - Upload Form Example',
    });
});*/

/** **********************************
 * UPLOAD POST
 */
// POST submit form data to path : http://localhost:3000/examples/upload/
// BEST PRACTICE: specify the only fields the app will accept
// https://www.npmjs.com/package/multer#usage
router.post('/upload', upload.fields([// multer fields
        {name: 'file1', maxCount: 1},
        {name: 'file2', maxCount: 1},
        {name: 'pictures', maxCount: 3}, // part of Exercise solution
    ]),
    [// validation
        body('title1').trim().if((value, {req}) => req.files.file1)
            .notEmpty().withMessage('Title is required when uploading a file'),
        body('desc1').trim().if((value, {req}) => !req.files.file1)
            .isEmpty().withMessage('Description requires a file to be uploaded'),
        body('file1').custom((value, {req}) => {
            // check that file1 exists and is at leat 1KB
            if (req.files.file1 && req.files.file1[0].size < 1024) {
                throw new Error('Uploaded file must be at least 1KB in size');
            }
            // check if title is specified when no file is uploaded
            if (!req.files.file1 && req.body.title1.trim().length) {
                throw new Error('File is required when specifying a title');
            }
            return true; // Indicates the success of this synchronous custom validator
        }),


        body('title2').trim().if((value, {req}) => req.files.file2)
            .notEmpty().withMessage('Title is required when uploading a file'),
        body('desc2').trim().if((value, {req}) => !req.files.file2)
            .isEmpty().withMessage('Description requires a file to be uploaded'),
        body('file2').custom((value, {req}) => {
            // check that file2 exists and is at leat 2KB
            if (req.files.file2 && req.files.file2[0].size < 1024) {
                throw new Error('Uploaded file must be at least 1KB in size');
            }
            // check if title is specified when no file is uploaded
            if (!req.files.file2 && req.body.title2.trim().length) {
                throw new Error('File is required when specifying a title');
            }
            return true; // Indicates the success of this synchronous custom validator
        }),
    ],
    (req, res, next) => {
        // output file array info to console to see what is available
        console.log('uploaded files:\n');
        console.log(req.files);

        // check the req.query values for validation errors / violations
        const violations = validationResult(req);
        // OPTIONAL: inspect the violations in the terminal
        console.log('Violations:');
        console.log(violations);

        const errorMessages = violations.formatWith(onlyMsgErrorFormatter).mapped();

        // loop through the files object and then the nested arrays
        for (const [field, fileArray] of Object.entries(req.files)) {
            // OPTIONAL: inspect the objects in the terminal
            console.log('Field: ' + field + '\n');
            console.log(fileArray);
            // loop through the files in the array
            for (const tempFile of fileArray) {
                // OPTIONAL: again inspect the files in the terminal
                console.log('Temp File:\n');
                console.log(tempFile);

                /* Now that we have validation - we need to ensure that any fields that correspond to file fields
                ie( file1, title1, file2, title2, pictures) do not have errors/violations. If a field does have an
                error then we should remove/delete the corresponding uploaded file from the server
                if the field does not have an error then move the files as normal to the images folder
                */
                // if the is an error message for the file's fieldname
                if (tempFile.fieldname in errorMessages
                ) {
                    // Delete temporary uploaded file if there is an error in the filed name
                    fs.unlink(tempFile.path, (err) => {
                        if (err) throw err;
                        console.log('File removed at ' + tempFile.path);
                    });
                } else {
                    // call the move file function to move the file to  public/images folder
                    moveFile(tempFile, __dirname + '/../public/images/');
                }
            }
        }

        // declare variables to store the uploaded file information
        let file1;
        let file2;
        let pictures; // part of exercise 6 solution
        // check to see if the corresponding files were uploaded
        // otherwise use new object
        file1 = req.files['file1'] ? req.files['file1'][0] : {originalname: 'not uploaded'};
        file2 = req.files['file2'] ? req.files['file2'][0] : {originalname: 'not uploaded'};
        // if the pictures field has an error then do not list the uploaded picture files
        pictures = ('pictures' in errorMessages) ? [] : req.files.pictures; //**MAY NEED FIXING**

        res.render('upload-files', {
            title: 'POST - Upload Form Example',
            isSubmitted: true, // check to see if the file title is filled in />
            //ALWAYS MATCH THE :LEFT VALUE TO MAKE SURE THE NAME  IS SAME AS .hbs FILE!
            title1: req.body.title1,
            title2: req.body.title2,
            desc1: req.body.desc1,
            desc2: req.body.desc2,
            file1: file1,
            file2: file2,
            pictures: pictures, // part of exercise 6 solution
            err: errorMessages,
        });
    });

/** **********************************
 * UPLOAD GET
 */
// GET submit form data to path : http://localhost:3000/examples/upload/
// BEST PRACTICE: specify the only fields the app will accept
// https://www.npmjs.com/package/multer#usage
router.get('/upload', (req, res, next) => {
    res.render('upload-files', {
        title: 'GET - Upload Form Example',
    })
})

/** ***********************************
 * FORM POST
 */
// POST submit form data to path : http://localhost:3000/examples/form/
router.post('/form',
    [ // validation
        body('agreed').equals('yes').withMessage('You must agree to the terms and conditions'),
        body('email').trim().notEmpty().withMessage('Email is required').bail()
            .normalizeEmail().isEmail().withMessage('Email must be in a valid format'),
        body('pwd').isLength({min: 8, max: 25}).withMessage('The password must be 8 to 25 characters')
            .bail().isStrongPassword({minSymbols: 0}).withMessage('Password must contain lowercase, uppercase, and numbers'),

        body('phone').if(body('phone').notEmpty())
            .trim().isMobilePhone('en-US').withMessage('Phone must be a Canadian phone number. Example: (000) 000-0000 NOTE: this example is NOT a valid email'),
    ],
    function (req, res, next) {
        console.log('anything****************');
        // check the req.body values for validation errors / violations
        const violations = validationResult(req);
        // OPTIONAL: inspect the violations in the terminal
        console.log('Violations:');
        console.log(violations);

        // Format the error messages to be easier to traverse in handlebars
        const errorMessages = violations.formatWith(onlyMsgErrorFormatter).mapped();
        // OPTIONAL: inspect the mapped errors in the terminal
        console.log('Error Messages:');
        console.log(errorMessages);

        res.render('form-example', {
            title: 'POST - Simple Form Example',
            // check to see if checkbox is checked <input name="agreed" value="yes" />
            isSubmitted: req.body.agreed === 'yes',
            // example <input name="someName"> we use req.body.someName
            // to access the value
            submittedEmail: req.body.email, // <input name="email" /> .:req.body.email
            submittedPassword: req.body.pwd, // <input name="pwd" /> .:req.body.pwd
            submittedPhone: req.body.phone,
            submittedAgreed: req.body.agreed, // <input name="agreed"> .:req.body.agreed
            err: errorMessages,
        });
    });

/** *******************************
 * FORM GET
 */
// GET content for path: http://localhost:3000/examples/form/
router.get('/form', [ // validation
        query('agreed').if(query('agreed').exists()) // validate if agreed exists
            .equals('yes').withMessage('You must agree to the terms and conditions'),
        query('email').if(query('email').exists()).trim() // validate if email exists and remove white space
            .isEmail().withMessage('Email must be in a valid format'),
        query('pwd').if(query('pwd').exists()) // validate if pwd exists
            .isLength({min: 8, max: 25}).withMessage('The password must be 8 to 25 characters')
            .bail().isStrongPassword({minSymbols: 0}).withMessage('Password must contain lowercase, uppercase, and numbers'),
        query('phone').if(query('phone').exists()) // validate if phone exists
            .trim().isMobilePhone('en-US').withMessage('Phone must be a Canadian phone number. Example: (306) 551-0000'),
    ],
    function (req, res, next) {
        // check the req.query values for validation errors / violations
        const violations = validationResult(req);
        // OPTIONAL: inspect the violations in the terminal
        console.log('Violations:');
        console.log(violations);

        // Format the error messages to be easier to traverse in handlebars
        const errorMessages = violations.formatWith(onlyMsgErrorFormatter).mapped();
        // OPTIONAL: inspect the mapped errors in the terminal
        console.log('Error Messages:');
        console.log(errorMessages);

        res.render('form-example', {
            title: 'GET - Simple Form Example',
            isSubmitted: req.query.agreed === 'yes', // check to see if the agreed url param is 'yes -  http://localhost:3000/examples/form/?agreed=yes
            // example localhost/examples/form/?someName=someValue
            // then we use req.query.someName access the value of the URL parameter
            submittedEmail: req.query.email, // ./form/?email=t%40t.ca.: req.query.email
            submittedPassword: req.query.pwd, // ./form/?pwd=pa$$word .: req.query.pwd
            submittedAgreed: req.query.agreed, // ./form/?agree=yes .: req.query.agreed
            submittedPhone: req.query.phone, // ./form/?agree=yes .: req.query.agreed
            err: errorMessages,
        });
    });


/**
 * @param {MulterFileInfo} tempFile
 * @param {string} newPath
 */
function moveFile(tempFile, newPath) {
    // append the files filename and originalname to the path
    newPath += tempFile.filename + '-' + tempFile.originalname;
    fs.rename(tempFile.path, newPath,
        (err) => {
            // if there is a file system error just throw the error for now
            if (err) throw err;
            // OPTIONAL: inspect new path in terminal
            console.log('File moved to ' + newPath);
        });

}

//this line always comes LAST!
module.exports = router
