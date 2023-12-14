const express = require('express');
const app = express();
const cors = require('cors');
const db = require('./db/db');
const { createRoutineJob } = require('./scheduled/actions');

const corsConfig = {
    origin: ["///origins///" ],
    credentials: true,
  }

createRoutineJob();

app.enable("trust proxy");
app.set("trust proxy", 1);
const PORT = process.env.PORT || 4001;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));

app.use(cors(corsConfig))

app.use(require('./routes/RouterIndex'));

app.get('/', async (req,res, next) => {
    
    try{
        let itemsFetch = await db.getAllItems(req.query.page);
        res.status(200).send(itemsFetch);
        return;

    }catch(err){
        console.log(err)
    }
})

app.listen(PORT, () => {
    console.log(`server listening on port: ${PORT}`);
})
