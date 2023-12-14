const express = require('express');
const multer = require('multer');

const itemRouter = express.Router();

const { createJob, createJobByEpoch } = require('../scheduled/actions');

const upload = multer();

const { v4: uuidv4 } = require('uuid');

const { verifyOwner, getSingleItem, getAllItems, orderCreate, pushMessage, deleteDeal, setSeenNotifications, getDealsByAccIdFull, getUsername, getMessagesByAcc, getMessagesByDealId, updateItemQuantity, getDealById, getUserById, getNotifications, verifyQuantity, insertItems, getBundleItemsFromAccFull, getDealsTheAccOffered, getSingleDeal, pushNotification, getItemsByName, getItemsByOwner, deleteItem, publishItem, createDeal, getBundleItemsFromAcc, getDeals, getLastDeal, insertItemsToDeal, getDealsOffered, getDealsByAccId, completeADeal, rejectDeal  } = require('../db/db');
const { jwtAuth } = require('../config/jwtAuth');
const { uploadImage, deleteImage } = require('../aws/s3')

itemRouter.param('itemid', (req, res, next, id) => {
    const itemid = id;
    req.itemid = itemid;
    next()
})

itemRouter.get('/getAllItems', (req, res, next) => {
    
        getAllItems().then((response) => {
            res.send(response);
        })

})


itemRouter.get('/getDealsOffered', jwtAuth, async (req, res) => {

    if(!req.user){
        res.status(401).send('Unauthorized');
        return;
    }

        const acc_id = req.user;
    try{

        const DealsOfferedIds = await getDealsByAccId(acc_id);

        if(DealsOfferedIds.length < 1){
            res.status(200).send([]);
            return;
        }
        let result = await getDeals(DealsOfferedIds);
        res.status(200).send(result);
        return;

    }catch(err){
        console.log(err);
        res.status(401).send('something went wrong');
        return;
    }
})

itemRouter.get('/getDealsAccountSent', jwtAuth, async (req, res) => {
    if(!req.user){
        res.status(401).send('Unauthorized');
        return;
    }
    const acc_id = req.user;
    try{
        const DealsOfferedIds = await getDealsTheAccOffered(acc_id);
        if(DealsOfferedIds.length < 1){
            res.status(200).send([]);
            return;
        }
        let result = await getDeals(DealsOfferedIds); 
        res.status(200).send(result);
        return;
    }catch(err){
        console.log(err);
        res.status(401).send('something went wrong');
        return;
    }

});


itemRouter.get('/getDealsSealed', jwtAuth, async (req, res) => {

    if(!req.user){
        res.status(401).send('Unauthorized');
        return;
    }
    const acc_id = req.user;
    try{
        const DealsOfferedIds = await getDealsByAccId(acc_id, true, true);

        if(DealsOfferedIds.length < 0){
            res.status(200).send([]);
            return;
        }
        let result = await getDeals(DealsOfferedIds);
        res.status(200).send(result);
        return;
    }catch(err){
        console.log(err);
        res.status(500).send('something went wrong');
        return;
    }
})

itemRouter.get('/getDealsSealedNoItems', jwtAuth, async (req, res) => {

    if(!req.user){
        res.status(401).send('Unauthorized');
        return;
    }
    const acc_id = req.user;
    try{

        const deals = await getDealsByAccIdFull(acc_id);

        let myUsername  = await getUsername(acc_id);
        myUsername = myUsername.username;

        let usernames = [];
        let result = []

        for(let deal of deals){
            if(deal.acc_id1 != acc_id){
                let indx = usernames.indexOf(deal.acc_id1);
                if( indx !== -1){
                    deal.acc_id1 = usernames[indx];
                    deal.acc_id2 = myUsername;
                    result.push(deal);
                }else{
                    const username = await getUsername(deal.acc_id1);
                    usernames.push(username.username);
                    deal.acc_id1 = username.username;
                    deal.acc_id2 = myUsername;
                    result.push(deal);
                }
            }else{
                let indx = usernames.indexOf(deal.acc_id2);
                if( indx !== -1){
                    deal.acc_id2 = usernames[indx];
                    deal.acc_id1 = myUsername;
                    result.push(deal);
                }else{
                    const username = await getUsername(deal.acc_id2);
                    usernames.push(username.username);
                    deal.acc_id2 = username.username;
                    deal.acc_id1 = myUsername;
                    result.push(deal);
                }
            }
        }

        res.status(200).send(result);
        return;

    }catch(err){
        console.log(err);
        res.status(500).send('something went wrong');
        return;
    }
})

itemRouter.post('/acceptDeal', jwtAuth, async (req, res) => {

    if(!req.user){
        res.status(401).send('Unauthorized');
        return;
    }

    const deal_id = req.body.deal_id;
    const acc_id = req.user;

    try{
        await completeADeal(deal_id, acc_id);
        const deal = await getDealById(deal_id);
        createJobByEpoch(Number(deal[0].expire), deleteDeal , deal_id)

        const user = await getUserById(req.user);
        const message = `The user ${user[0].username} just accepted your offer!`
        let newNotification = await pushNotification(deal[0].acc_id1, '/account?offer-accepted', message, null  );

        const newMessage = await pushMessage(deal_id, acc_id, deal[0].acc_id1,'');

        res.status(200).send({message:'Deal Accepted', csrf:req.csrf});

    }catch(err){
        console.log(err);
    }
})

itemRouter.post('/rejectDeal', jwtAuth, async (req, res) => {

    if(!req.user){
        res.status(401).send('Unauthorized');
        return;
    }

    const deal_id = req.body.deal_id;
    const acc_id = req.user;

    try{
        let deal = await getSingleDeal(deal_id, acc_id);
        let result = await rejectDeal(deal_id, acc_id);

        if(result === 2){
            if(deal[0].acc_id1 == acc_id ){
                res.status(200).send({message:'Deal Rejected', csrf:req.csrf});
                return;
            }else{
                const user = await getUserById(req.user);
                const message = `The user ${user[0].username} rejected your offer`
                let not = await pushNotification(deal[0].acc_id1, `/user/${acc_id}`, message, null);
                res.status(200).send({message:'Deal Rejected', csrf:req.csrf});
                return;
            }
        }

    }catch(err){
        console.log(err);
        res.status(500).send('something went wrong');
        return;
    }
})

itemRouter.get('/notifications', jwtAuth, async (req, res) => {

    if(!req.user) {res.status(401).send('Unauthorized'); return;}
    const seen = req.query.seen;
    try{
        if(seen){
            await setSeenNotifications(req.user)
        }
        const notifications = await getNotifications(req.user);
        res.status(200).send(notifications);
        return;

    }catch(err) {
        console.log(err);
        res.status(500).json({message:'something went wrong'}); 
        return;
    }

});

itemRouter.get('/messages/:deal', jwtAuth, async (req, res) => {
    if(!req.user) {res.status(401).send('Unauthorized'); return;}

    const deal_id = req.params.deal;
    try{
        const messages = await getMessagesByDealId( deal_id ,req.user);
        if(messages.length < 1){
            res.status(200).send([]);
            return;
        }

        let myUsername  = await getUsername(req.user);
        myUsername = myUsername.username;
        let my_user_id = req.user; 

        let otherUserId = (req.user == messages[0].sender)? messages[0].receiver : messages[0].sender; 
        let otherUser = await getUsername(otherUserId);
        res.status(200).send({[my_user_id] : myUsername, [otherUserId] : otherUser.username ,messages:messages});
        return;

    }catch(err) {
        console.log(err);
        res.status(500).json({message:'something went wrong'}); 
        return;
    }
});

itemRouter.get('/messagesByAccount', jwtAuth, async (req, res) => {

    if(!req.user) {res.status(401).send('Unauthorized'); return;}

    try{
        const messages = await getMessagesByAcc(req.user);
        res.status(200).send(messages);
        return;

    }catch(err) {
        console.log(err);
        res.status(500).json({message:'something went wrong'}); 
        return;
    }
});

itemRouter.post('/postMessage/:deal', jwtAuth, async (req, res) => {

    if(!req.user) {
        res.status(401).send('Unauthorized');
        return;
    }
    const {message} = req.body;
    try{
        let deal = await getDealById(req.params.deal);
        deal = deal[0];
        let otherUser = (deal.acc_id1 !== req.user)? deal.acc_id1: deal.acc_id2;
        const newMessage = await pushMessage(deal.id, req.user, otherUser, message);
        res.status(200).send({message:"message Sent", csrf:req.csrf});
        return;

    }catch(err) {
        console.log(err);
        res.status(500).json({message:'something went wrong'}); 
        return;
    }
});





itemRouter.post('/addItem', jwtAuth, upload.single('image'), async (req, res) => {

    if(!req.user) {res.status(401).send('Unauthorized'); return;}
    
    const owner = req.user;
    const {name, price, category, description} = req.body;

    if(name.length > 30){
        res.status(400).json({message: 'Name must be 30 characters long', csrf:req.csrf }); return;
    }
    
    let image = req.file;
    if(image.mimetype != 'image/webp'){
        image = null;
    }

    if(image.size > 1000000){
        res.status(400).json({message: 'Images cannot exceed 1Mb', csrf:req.csrf }); return;
    }
    
    if( !name || !price || !category || !description ) {res.status(400).json({message: 'One or more fields missing', csrf:req.csrf }); return;}
    if(isNaN(price) || price < 0) {res.status(400).json({message:'Price value is incorrect', csrf:req.csrf}); return;}

    let imgId = (image)? uuidv4(): null;

    if(image){
        const arrayBuffer = image.buffer;
        uploadImage(arrayBuffer, imgId);
    }

    try{
        await publishItem(name, price, category, description, owner, imgId);
        res.status(200).send({message: "Item published", csrf:req.csrf});

    }catch(err) {
        console.log(err);
        res.status(400).json({message:'Price value is incorrect', csrf:req.csrf}); 
        return;
    }
})
//

itemRouter.get('/search/:term', async (req, res, next) => {

    const page = req.query.page || 0;
    const search = req.params.term;
    try{
        const result = await getItemsByName(search, page);
        res.send(result);
    }catch(err){
        console.log(err);
    }

})

itemRouter.post('/search/:term', async (req, res, next) => {

    const page = req.query.page || 0 ;
    const search = req.params.term;
    try{
        const result = await getItemsByName(search, page);
        res.send(result);
        return;
    }catch(err){
        console.log(err);
    }

})

itemRouter.get('/ownerItems/:id', async (req, res) => {

    const id = req.params.id;
    try{
        let result = await getItemsByOwner(id);
        res.send(result);
    } catch(err){
        console.log(err);
    }

})

itemRouter.get('/sessionItems', jwtAuth, async (req, res) => {
    if(req?.user === undefined) { res.status(401).send('Unauthorized'); return}

    try{
    let result = await getItemsByOwner(req.user);
    res.status(200).send(result);
    return;

    }catch(err){
        console.log(err);
        res.status(500).json({message: 'error creating deal'}); 
        return;
    }
})

//Need fix on item not available
itemRouter.post('/createDeal', jwtAuth, async (req, res) => {

    if(!req.user) {res.status(401).send('Unauthorized');
    return}

    if(req.user === req.body.acc_2) {res.status(401).send("You can't make a deal with yourself");
    return}

    const { acc_2, other_items, your_items} = req.body;
    const acc_1 = req.user;
    try{

        let yourItemsFull = await getBundleItemsFromAccFull(acc_1, your_items);
        let OtheritemsFull = await getBundleItemsFromAccFull(acc_2, other_items);

        OtheritemsFull.forEach(element => {
            if(element.quantity < 1){
                res.status(400).json({message: 'Item is not available', csrf: req.csrf}); return
            }
        });

        yourItemsFull.forEach(element => {
            if(element.quantity < 1){
                res.status(400).json({message: 'Item is not available', csrf: req.csrf}); return
            }
        });

        let yourItems = await getBundleItemsFromAcc(acc_1, your_items);

        let Otheritems = await getBundleItemsFromAcc(acc_2, other_items);
        let deal = await createDeal(acc_1, acc_2);
        if(!deal){ res.status(500).json({message: 'error creating deal'}); return};
        let currentDeal = await getLastDeal(acc_1, acc_2);

        let dealId = currentDeal[0].id;

        let pushingOtherItems = await insertItemsToDeal(dealId, Otheritems, acc_2);
        if(!pushingOtherItems){ res.status(500).json({message: 'error creating deal'}); return};

        let pushingYourItems = await insertItemsToDeal(dealId, yourItems, acc_1);
        if(!pushingYourItems){ res.status(500).json({message: 'error creating deal'}); return};

        const user = await getUserById(req.user);
        const message = `The user ${user[0].username} sent you an offer`

        let pushNewNotification = await pushNotification(acc_2, '/account?offer-received', message, null  );

        res.status(200).json({message: 'deal created', csrf:req.csrf});
        return

    } catch(err){
        console.log(err)
        res.status(500).json({message: 'error creating deal'});
    }
})


itemRouter.post('/deleteItem/:id', jwtAuth, async (req, res) => {

    if(!req.user) {res.status(401).json({message:'Unauthorized'});
    return}

    const id = req.params.id;
    const verify = await verifyOwner(id, req.user); 
    const verifyQuantityNumber = await verifyQuantity(id);
    const item = await getSingleItem(id);

    if(!verifyQuantityNumber){res.status(401).json({message:"Can't delete Item that is included in an ongoing transaction"}); return;}

    try{
        if(!verify) {res.status(401).json({message:'Unauthorized'}); return;}

        if(item.images){
            deleteImage(item.images)
        }
        
        let result = await deleteItem(id);

        res.status(200).send({message:'Item Deleted', csrf: req.csrf});
        return

    }catch(err){
        console.log(err);
        res.status(500).json({message:'Error deleting item'});
    }


})

itemRouter.get('/ping', jwtAuth, (req, res ,next) => {
    res.status(200).send({message: "Valid session"});
    return ;
})

itemRouter.get('/:itemid', async (req, res, next) => {
    
    let idI = req.params.itemid;

    try{
        const result = await getSingleItem(idI);
        res.status(200).send(result);
        return;
    }catch(err){
        console.log(err);
            res.status(400).json({message:'No item found'});
    }

})



module.exports = itemRouter;