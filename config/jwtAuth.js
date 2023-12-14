
const jwt = require('jsonwebtoken');
require('dotenv').config();

const NodeCache = require( "node-cache" );
const myCache = new NodeCache({useClones:false});
const { v4: uuidv4 } = require('uuid');

const bcrypt = require('bcryptjs');

const db = require('../db/db');

const jwtAuth =  (req, res, next) => {
        
        const token = req.headers['authorization'];
        const token2 = token && token.split(' ')[1];
        if (token2 == null) {
            return res.status(401).send('Access denied. No token provided.');
        }
        const reqCsrf = req.headers['csrf'];
        if (reqCsrf == null) {
            console.log('no token')
            return res.status(401).send('Access denied. No token provided.');
        }


        try {


            jwt.verify(token2, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
                if(err) {
                    console.log(err, 'err')
                    throw new Error(err.message);
                }
            req.user = decoded.user;
            const csrfStored = myCache.get(req.user);

            if(reqCsrf === csrfStored){
                if(req.method.toString() == "GET"){
                    next();
                }else{
                    const newCsrf = uuidv4();
                    myCache.set( req.user, newCsrf, 60 * 3);
                    req.csrf = newCsrf;
                    next();
                }
            }else{
                return res.status(401).send('Unauthorized');
            }
            
            });
        } catch (err) {
            if(req.user){
                myCache.del(req.user);
            }
            res.status(401).send('Invalid token');
        }
    };


const jwtLogin = async (req, res, next) => {

    const {username, password} = req.body;

    if(!(username && password)) {
        throw new Error('fields are missing');
    }

    let token;
    let data;

    await db.verifyUser(username, async (err, user) => {

        const matchedPassword = await bcrypt.compare(password , user?.password);

        if(err) {
            throw new Error(err.message);
        }
        if(!user){
            throw new Error('No user');
        }
        if(!matchedPassword) {
            throw new Error('Password not matched');
        }
        token = jwt.sign({user:user.id}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '10m'});
        const csrf = uuidv4();
        data = {token: token, username: user.username, id: user.id, csrf:csrf};
        myCache.set(user.id, csrf , 60 *10);

    })
    return data;
}

const jwtLogout = (req, res, next) => {

        if(req.user){
            myCache.del(req.user);
        }
        return res.status(200).json({message: "Logged out"});

}



module.exports = {jwtAuth, jwtLogin, jwtLogout};