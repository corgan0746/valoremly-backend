const express = require('express');

require('dotenv').config();

const {createAccount, getOrders, getUsername, multipliedEmailOrUsername, verifyAccount, getEmailById, getUserExtraInfo, queryRequest} = require('../db/db');
const {jwtAuth, jwtLogin, jwtLogout } = require('../config/jwtAuth'); 

var MailChecker = require('mailchecker');

const userRouter = express.Router();
const nodemailer = require("nodemailer");

const crypto = require('crypto');

const transporter = nodemailer.createTransport({
    host: 'smtp-mail.outlook.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASSWORD
    },
    requireTLS: true,
    tls: {
      rejectUnauthorized: true, // Set to true in production
    },
  });


userRouter.post('/register', async (req, res, next) => {
    const {username, email, password} = req.body;
    
    if(!(username && email && password)) {

        res.status(404).json({message: 'Error fields are missing'});
        return;
    }

    if(password.length < 7 || password.length > 20){
        res.status(404).json({message: 'password must be 7 to 20 characters long'});
        return;
    }

    if (!(/[A-Z]/.test(password))) {
        res.status(404).json({message: "password must contain atleast 1 uppercase character"});
        return;
      }

    if (!(/\d/.test(password))) {
        res.status(404).json({message: "password must contain atleast 1 number character"});
        return;
      }

    if (!(/[^A-Za-z0-9]/.test(password))) {
        res.status(404).json({message: "password must contain atleast 1 special character"});
        return;
      }



    try{

        const verification = generateVerificationToken();

        const result = await createAccount(username, password, email, verification);

        if(result === false){
            res.status(500).json({message: 'Error creating account'});
            return;
        }

        const html = `<h1>Please verify the account with the following link</h1>
              <p>verify account</p>
              <a target='_blank' href="https://valoremly.co.uk?token=${verification}">Verify</a>`;

        const mailOptions = {
            from: process.env.EMAIL,
            to: email,
            subject: 'Account Verification',
            html: html
        };

        transporter.sendMail(mailOptions
            , (error, info) => {
                if (error) {
                    console.log(error)
                    res.status(500).json({message: 'Error creating account'});
                    return;
                } else {
                res.status(200).json({message: 'Please verify account with the link sent to your email'});
                return;
                }
            }
            );


    

    }catch(err){
        res.status(500).json({message: 'Error creating account'});
        return;
    }
    
    


});

userRouter.get('/userSession', jwtAuth, async (req, res) => {
    
    if(!req.user){
        res.send('guest');
    }else{
        res.send(req.session.data.username);
    }
})

userRouter.get('/getEmailFromSession', jwtAuth, async (req, res) => {
        if(req.user){
            let email = await getEmailById(req.user);
            res.send(email);
        }
})

userRouter.get('/getUsername/:id', async (req, res) => {

     let username = await getUsername(req.params.id);

     if(username === false){
            res.status(500).send('Error');
     }
     res.status(200).send(username);

})

userRouter.post('/preregister', async (req, res, next) => {

    try{

    const {username, email} = req.body;
    if(!username || !email){
        res.status(403).json({message: 'Both fields must have a value'});
        return;
    }
    let result = await multipliedEmailOrUsername(email, username);

    if(!MailChecker.isValid(email)){
        res.status(400).json({message: 'Email is not properly formated'})
        return;
      }

    if(result.emailExists){
        res.status(403).json({message: 'Error email already registered'});
        return;
    }
    else if(result.usernameExists){
        res.status(403).json({message: 'Error username already registered'});
        return;
    }else{
        res.status(200).json({message: 'success'});
        return;
    }
    }catch(err){
        res.status(500).json({message: 'Error'});
        return;
    }

})

userRouter.post('/login',(req,res, next) => {

    jwtLogin(req, res, next).then(async (data) => {
        let email = await getEmailById(data.id);
        res.status(200).send({message: 'login successful', token: data.token, username: data.username, user_id: data.id, csrf:data.csrf, email: email});
        return;
    }).catch((err) => {
        res.status(400).send({message: "Wrong credentials" });
        return;
    })
});

userRouter.post('/logout', jwtAuth, jwtLogout);

userRouter.get('/isSession', jwtAuth, async (req, res) => {
    if(req.user){
        let thisUser = await getUsername(req.user);
        res.json({username: thisUser.username ,user_id:req.user});
    }else{
        res.json({username:'guest', user_id: 0});
    }});


userRouter.get('/verify', async (req, res, next) => {

    try{
        if(!req.query.token){
            res.status(400).send({message: "something went wrong" });
            return;
        }

        const result = await verifyAccount(req.query.token);

            const htmlContent = `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 100vh;
                    margin: 0;
                    }

                    .container {
                    text-align: center;
                    }

                    .square {
                    width: 100px;
                    height: 100px;
                    background-color: #3498db;
                    color: #fff;
                    line-height: 100px;
                    }

                    .message {
                    margin-top: 20px;
                    }

                    .login-button {
                    display: inline-block;
                    padding: 10px 20px;
                    background-color: #2ecc71;
                    color: #fff;
                    text-decoration: none;
                    margin-top: 20px;
                    }
                </style>
                </head>
                <body>
                <div class="container">
                    <div class="square">Account Verified</div>
                    <p class="message">Your account has been successfully verified.</p>
                    <a href="https://valoremly.co.uk" class="login-button">Login</a>
                </div>
                </body>
                </html>
            `;

            res.header('Content-Type', 'text/html');

            res.status(200).send(htmlContent);
            return;
    }catch(err){
        res.status(500).send({message: "Something went wrong" });
        return
    }

})


function generateVerificationToken() {
    return crypto.randomBytes(32).toString('hex');
  }

module.exports = userRouter;