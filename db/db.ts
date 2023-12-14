const { Client, Pool } = require('pg');

require('dotenv').config()

// Valoremly db backup
const pool = new Pool(
  {
    connectionString:process.env.COCKROACH_DB,
    max: 1000,
  }
  );

  // Handle pool errors
  pool.on('error', (err:any, client:any) => {
    console.error('Unexpected error on idle client', err);
  });


const bcrypt = require('bcryptjs');

  async function verifyUser(user:string, cb:Function) {

    try{

      const userData = await queryRequest(`SELECT * FROM accounts WHERE username = $1 AND active = true`, [user])

      return cb(null, userData[0])    
      
   
    }catch(err){
      return cb(err, null )
    }
    
  }
  
  async function verifyAccount(token:string){

    try{

      const account = await queryRequest(`SELECT verification FROM accounts WHERE verification = $1`, [token]);

      if(account.length > 0){

        const result = await queryRequest(`UPDATE accounts SET active = true, verification = null WHERE verification = $1`, [token]);

        return true;
      }else{
        return false;
      }
      
    }catch(err){
      console.log(err);
      return false;
    }

  }


  async function createAccount(username:string, password:string, email:string, verify:string){

    try{
      const userExists = await findUser(username);

      const emailExists = await queryRequest(`SELECT email FROM accounts WHERE email = $1`, [email]);

      if(userExists || emailExists.length > 0){
        return false;
      }else {

        let salt = await bcrypt.genSalt(10);
        let hash = await bcrypt.hash(password, salt);

        const userCreate =  await queryRequest(`INSERT INTO accounts(password, email, username, verification) VALUES($1, $2, $3, $4)`, [hash, email, username, verify])

        if(userCreate){
          let justCreated = await queryRequest(`SELECT id FROM accounts WHERE username = $1 AND email = $2`, [username, email])

          if(justCreated.length < 1){
              return false;
          }
          await queryRequest(`INSERT INTO user_info(account_id, item_n, deals_s, blocked, feedback, admin) VALUES($1, 0, 0, 0, 0, false)`, [justCreated[0].id])

          return true;
        }
      }
      
    }catch(err){
      console.log(err);
    }
  }



   const findUser = async (name:string) => {
    try{

      const result = await queryRequest(`SELECT username FROM accounts WHERE username = $1`, [name]);
      
      if(result.length > 0){
        return result;
      }else {
        return null;
      }

    }catch(err){
      console.log(err);
    }
  }
  
  async function getUserById(id:number){

    try{
    
      const result = await queryRequest(`SELECT * FROM accounts WHERE id = $1`, [id])
       
      return result;
        
    }catch(err){
      console.log(err)
    }
  }

  async function getEmailById(id:number){
    try{
      const result = await queryRequest(`SELECT email FROM accounts WHERE id = $1`, [id]);
      return result[0];
    }catch(err){
      console.log(err);
    }
  }

  async function multipliedEmailOrUsername(email:string, username:string){
    try{
      const emailExists = await queryRequest(`SELECT email FROM accounts WHERE email = $1`, [email]);
      const usernameExists = await queryRequest(`SELECT username FROM accounts WHERE username = $1`, [username]);

      return {emailExists: emailExists.length > 0, usernameExists: usernameExists.length > 0}
      
    }catch(err){
      console.log(err);
    }
  }
  

  

  async function getUsername(id:number){
    try{
      const result = await queryRequest(`SELECT username FROM accounts WHERE id = $1`, [id]);

      return result[0];
    }catch(err){
      console.log(err);
    }
  }

  async function getItemsByName(name:string, page:number) {
    try{
      const result = await queryRequest(`SELECT * FROM items WHERE name ILIKE $1 AND quantity = '1' LIMIT 12 OFFSET $2`,[`%${name}%`, page*12]);

      const countItems = await queryRequest(`SELECT COUNT(*) FROM items WHERE name ILIKE $1 AND quantity = '1'`,[`%${name}%`]);

      let total = {data:result, total: countItems[0].count }

      return total;
    }catch(err){
      console.log(err);
    }
  }


  async function getUserExtraInfo(acc_id:number){
    try{
      const result = await queryRequest(`SELECT * FROM user_info WHERE account_id = $1`, [acc_id]);
      return result;
    }catch(err){
      console.log(err);
    }
  }



  async function publishItem(name:string, price:number, category:string, description:string, owner:any, images:any){
    try{

      await queryRequest(`UPDATE user_info SET items_n = items_n + 1 WHERE account_id = $1`, [owner])

      const result = await queryRequest(`INSERT INTO items(name, price, category, description, owner, images, quantity) VALUES($1, $2, $3, $4 , $5 , $6 , 1)`
        ,[name, price, category, description, owner, images]);

      return result;
    }catch(err){
      console.log(err);
    }
  }

  async function getBundleItemsFromAcc(acc_id:number, items_ids:number[]){

    let total = [];
    try{

      for(let i = 0; i < items_ids.length; i++){
      const result = await queryRequest(`SELECT * FROM items WHERE owner = $1 AND id= $2`, [acc_id, items_ids[i]]);
      if(result.length < 1){
        continue;
      }
      total.push(result[0].id);
      }

      return total;
    }catch(err){
      console.log(err);
    }
  }
  async function getBundleItemsFromAccFull(acc_id:number, items_ids:number[]){

    let total = [];
    try{

      for(let i = 0; i < items_ids.length; i++){
      const result = await queryRequest(`SELECT * FROM items WHERE owner = $1 AND id= $2`, [acc_id, items_ids[i]]);
      if(result.length < 1){
        continue;
      }
      total.push(result[0]);
      }

      return total;
    }catch(err){
      console.log(err);
    }
  }


  async function deleteItem(id:number){
    try{

      const item = await queryRequest(`SELECT * FROM items WHERE id = $1`,[id]);

      if(item.length < 1){
        return "Item doesn't exist";
      }

      const result = await queryRequest(`DELETE FROM items WHERE id = $1`, [id]);
      return result;
    }catch(err){
      console.log(err);
    }
  }

  async function getItemsByOwner(acc_id:number){
    try{
      const result = await queryRequest(`SELECT * FROM items WHERE owner = $1`, [acc_id]);
      return result;
    }catch(err){
      console.log(err);
    }
  }
 

  
   async function getAllItems(page:number) {
    
    try{
    
        let items = await queryRequest(`SELECT * FROM items WHERE quantity = '1' LIMIT 12 OFFSET $1 `, [page*12]);

        let countItems = await queryRequest(`SELECT COUNT(*) FROM items WHERE quantity = '1'`, []);

        let result = {data:items, total: countItems[0].count}

        return result;
      
    }catch(err){
      console.log(err);
    }
  }

  async function pushNotification(accId:number, type:string, message:string, img:string | null){

    try{
        const newNotification = await queryRequest(`INSERT INTO notifications(type, message, acc_id, image) VALUES($1, $2, $3, $4)`, [type, message, accId, img]);

        return true;

    }catch(err){
      console.log(err);
    }
  }

  async function pushMessage(deal_id:number, sender:number, receiver:number, message:string){
    try{

        const newNotification = await queryRequest('INSERT INTO messages(sender, receiver, message, deal_id) VALUES($1, $2, $3, $4)',[sender, receiver, message, deal_id]
        );
        
        return true;

    }catch(err){
      console.log(err);
    }
  }

  async function getMessagesByDealId(deal_id:number, acc_id:number){
    try{

      const messages = await queryRequest(`SELECT * FROM messages WHERE deal_id = $1 AND (sender = $2 OR receiver = $3)`, [deal_id, acc_id, acc_id]);

      return messages;

  }catch(err){
    console.log(err);
  }
  }


  async function getMessagesByAcc(acc_id:number){
    try{

      const messages = await queryRequest(`SELECT * FROM messages WHERE receiver = $1`, [acc_id]);

      return messages;

  }catch(err){
    console.log(err);
  }
  }

  async function getNotifications(accId:number){

    try{
        const result = await queryRequest(`SELECT * FROM notifications WHERE acc_id = $1`, [accId]);

        return result;

    }catch(err){
      console.log(err)
    }

  }

  async function deleteAllNotifications(){

    try{

        const deleteAll = await queryRequest(`DELETE FROM notifications WHERE seen = true`, []);

    }catch(err){
      console.log(err);
    }
  }

  async function setSeenNotifications(accId:number){

    try{

        const result = await queryRequest(`UPDATE notifications SET seen = true WHERE acc_id = $1`, [accId]);

    }catch(err){
      console.log(err);
    }

  }


  async function orderCreate(userId:number, sessionReference:string) {

    try {
      const createOrder = await queryRequest(`INSERT INTO orders(account_id, payment_session) VALUES($1, $2)`, [userId, sessionReference]);

      return true;

    }catch(err){
      console.log(err)
    }

  }

  


  async function insertItems(cart:any, userId:number) {
    
    try {
      let orderId = await queryRequest(`SELECT MAX(id) as order_id FROM orders WHERE account_id = $1`, [userId]);

      let result = orderId[0];

      for (let x of cart){
        await queryRequest(`INSERT INTO order_items(order_id, product_id, quantity) VALUES ($1, $2 ,$3)`, [result.order_id, x.id, x.qty])
      }

      return true;
    }catch(err) {
      console.log(err);
    }
  }

  async function getDealsByAccId(id:number, completed = false, both = false) {
    try{
        let deal;
        if(completed){
          if(both){
            deal = await queryRequest(`SELECT * FROM deals WHERE (acc_id2 = $1 OR acc_id1 = $2) AND status = 'completed'`, [id, id]);
          }else{
            deal = await queryRequest(`SELECT * FROM deals WHERE acc_id2 = $1 AND status = 'completed'`, [id]);
          }
        }else{
          deal = await queryRequest(`SELECT * FROM deals WHERE acc_id2 = $1 AND status = 'pending'`, [id]);
        }

        deal = deal.map((ele:any) =>{ return {deal_id: ele.id, from: ele.acc_id1 }})

        return deal;

    } catch(err) {
      
      console.log(err);
      return false
        }
  }

  async function getDealsByAccIdFull(id:number) {
    try{
      
        let deal = await queryRequest(`SELECT * FROM deals WHERE (acc_id2 = $1 OR acc_id1 = $2) AND status = 'completed'`, [id, id]);
          
        return deal;

    } catch(err) {
      console.log(err);
        }
  }

  async function updateItemQuantity(id:number, quantity:number){
    try{

      let deal = await queryRequest(`UPDATE items SET quantity = $1 WHERE id = $2`, [quantity, id]);

      return true;

    }catch(err){
      throw new Error("something went wrong")
    }
  }

  async function getDealsTheAccOffered(id:number){
    try{

      let deal = await queryRequest(`SELECT * FROM deals WHERE acc_id1 = $1 AND status = 'pending'`, [id]);

      deal = deal.map((ele:any) =>{ return {deal_id: ele.id, from: ele.acc_id2 }})

      return deal;

    }catch(err){
      throw new Error("something went wrong")
    }
  }

  async function completeADeal(deal_id:number, acc_id:number){
    try{
      const verifyUSer = await queryRequest(`SELECT * FROM deals WHERE id = $1 AND acc_id2 = $2`, [deal_id, acc_id]);
      if(verifyUSer.length < 1){
        throw new Error('User not authorized');
      }

      const allItemsIdsInvolved = await queryRequest(`SELECT * FROM deals_items WHERE deal_id = $1`, [deal_id]);

      for(const item of allItemsIdsInvolved){
          await updateItemQuantity(item.item_id, 0);
      }

      let summedUpIds:number[] = [];

      for(const item of allItemsIdsInvolved){

        const locatedDealsWithItems = await queryRequest(`SELECT deal_id FROM deals_items WHERE item_id = $1 AND deal_id != $2`, [item.item_id, deal_id]);

        summedUpIds.concat(locatedDealsWithItems);

        await queryRequest(`DELETE FROM deals_items WHERE item_id = $1 AND deal_id != $2`, [item.item_id, deal_id]);
      }

      let filteredIds:number[] = [];

      summedUpIds.forEach((ele) => {
        if(!filteredIds.includes(ele)){
          filteredIds.push(ele);
        }
      });

      for(const item of filteredIds){
        await queryRequest(`DELETE FROM deals WHERE id = $1`, [item]);
      }


      // create a date to expire the deal, sum seconds equivalent to 14 days
      const todayDate = new Date().toLocaleString('en-US', {timeZone: 'Europe/London'});
      const today = new Date(todayDate);

      // 7 days to expire a completed deal
      let epochTime = Math.floor(today.getTime() / 1000) + (24 * 7 * 60 * 60) ;
      const result = await queryRequest(`UPDATE deals SET status = 'completed', expire = $1 WHERE id = $2 AND acc_id2 = $3`, [epochTime, deal_id, acc_id]);
      return result;
    }catch(err){
      console.log(err);
      return err;
    }
  }

  async function rejectDeal(deal_id:number, acc_id:number){
    try{
      const verifyUSer = await queryRequest(`SELECT * FROM deals WHERE id = $1 AND (acc_id2 = $2 OR acc_id1 = $3)`, [deal_id, acc_id, acc_id]);
      if(verifyUSer.length < 1){
        throw new Error('User not authorized');
      }

      await queryRequest(`DELETE FROM deals_items WHERE deal_id = $1`,[deal_id]);
      await queryRequest(`DELETE FROM deals WHERE id = $1`, [deal_id]);


      return 2;
    }catch(err){
      console.log(err);
      return err;
    }
  }

  async function deleteDeal(deal_id:number){
    try{
      const deal = await queryRequest(`SELECT * FROM deals WHERE id = $1`, [deal_id]);
      if(deal.length < 1){
        throw new Error('Deal does not exist');
      }

      await queryRequest(`DELETE FROM messages WHERE deal_id = $1`,[deal_id])
      await queryRequest(`DELETE FROM deals_items WHERE deal_id = $1`,[deal_id]);
      await queryRequest(`DELETE FROM deals WHERE id = $1`,[deal_id]);


      return 2;
    }catch(err){
      console.log(err);
      return err;
    }
  }

  async function deleteExpireDeals(){
    try{

      const newEpoch = new Date().getTime()/1000;

      const dealsExpired = await queryRequest(`SELECT id FROM deals WHERE expire < $1`, [newEpoch]);

      for(let i=0; i<dealsExpired.length;i++){

        await deleteDeal(dealsExpired[i])

      }


    }catch(err){
      console.log(err);
    }
  }

  

//Check this method aswell
  async function getDeals(id:any) {
    let items = [];
      try{
  
        for(let i = 0; i < id.length; i++){
          let y = id[i].from;
          let x = id[i].deal_id;
          let deal = await queryRequest(`SELECT deals_items.item_id, items.name, items.price, items.category, items.owner, items.images FROM deals_items INNER JOIN items ON deals_items.item_id = items.id WHERE deals_items.deal_id = $1`,[x]);
        
          if(deal.length < 1){
            continue;
          } else {
            items.push({deal_id: x , from: y,  items:deal});
          }}
        return items;

    } catch(err) {
      console.log(err);
        }

  }

  async function getSingleDeal(deal_id:number, acc_id:number ){

    try{

      const result = await queryRequest(`SELECT * FROM deals WHERE id = $1 AND (acc_id2 = $2 OR acc_id1 = $3)`, [deal_id, acc_id, acc_id]);

      return result;


    }catch(err){
      console.log(err);
    }
  }

  async function getDealById(deal_id:number){

    try{

      const result = await queryRequest(`SELECT * FROM deals WHERE id = $1`, [deal_id]);

      return result;


    }catch(err){
      console.log(err);
    }
  }

  async function getDealsOffered(id:any) {

    let items = [];
      try{
  
        for(let i = 0; i < id.length; i++){
          let x = id[i];
        let deal = await queryRequest(`SELECT item_id FROM deals_items INNER JOIN deals ON deals_items.deal_id = deals.id WHERE deals.acc_id2 = $1 `, [x]);
      
        if(deal.length < 1){
          continue;
        } else {
          items.push({deal_id: x ,items:deal});
        }}
        return items;

    } catch(err) {
            return false;
        }

  }



  async function verifyOwner(id:number, acc_id:number) {
    try{
      let result = await queryRequest(`SELECT * FROM items WHERE id = $1 AND owner = $2`,[id, acc_id]);
      if(result.length < 1){
        return false;
      } else {
        return true;
      }
    } catch(err) {
      console.log(err);
    }
  }

  async function verifyQuantity(id:number) {
    try{
      let result = await queryRequest(`SELECT * FROM items WHERE id = $1`, [id]);
      if(result.quantity == "0"){
        return false;
      } else {
        return true;
      }
    } catch(err) {
      console.log(err);
    }
  }



  async function getLastDeal(acc_1:number, acc_2:number) {

    try{
        let deal = await queryRequest(`SELECT id FROM deals WHERE acc_id1 = $1 AND acc_id2 = $2 ORDER BY id DESC LIMIT 1`,[acc_1, acc_2]);

        return deal;

    } catch(err) {
          console.log(err);
        }
  }



  async function createDeal(acc1:number, acc2:number) {
    try{
        let verify1 = await queryRequest(`SELECT * FROM accounts WHERE id = $1`,[acc1]);

        let verify2 = await queryRequest(`SELECT * FROM accounts WHERE id = $1`, [acc2]);

        if(verify1.length < 1 || verify2.length < 1){
            return false;
        }

        let deal = await queryRequest(`INSERT INTO deals(acc_id1, acc_id2, status) VALUES ($1, $2, 'pending')`, [acc1, acc2]);

        return true;

    } catch(err) {
      console.log(err);
        return false;
        
        }

  }

  async function addItemToDeal(dealId:number, accId:number, itemId:number) {
    try{
        let deal = await queryRequest(`INSERT INTO deals_items(deal_id, acc_id, item_id) VALUES ($1, $2, $3)`, [dealId, accId, itemId]);

        return deal;

    } catch(err) {
      console.log(err);
        }

  }

  async function insertItemsToDeal(dealId:number, itemsIds:number[], accId:number) {
    try{
        
        for (let i=0; i<itemsIds.length; i++){
            let itemId = itemsIds[i];
            await addItemToDeal(dealId, accId, itemId )
        }
        
        return true;

    } catch(err) {
            console.log(err);
            return false;
        }

  }
  

  
  async function getOrders(userId:number) {

    try {
      const result = await queryRequest(`SELECT * FROM order_items INNER JOIN orders ON order_items.order_id = orders.id WHERE orders.account_id = $1`, [userId]);

      return result;

    }catch(err) {
      console.log(err);
    }
  }
  


  async function getSingleItem(id:number) {

    try{
          const data = await queryRequest(`SELECT * FROM items WHERE id = $1 `, [id]);

          if(data.length < 1){
            throw new Error();
          }

          return data[0];

    }catch(err){
      throw new Error("no item");
    }
  }
  

async function queryRequest(inQuery:string, params:any[]) {
  try{

    const cliente = await pool.connect()
    const res = await cliente.query({text:inQuery, values: params});

    cliente.release();

    return res.rows;

  }catch(err){
    console.log(err);
  }
  finally{
  }
  
}



module.exports = {verifyUser, getSingleDeal, deleteExpireDeals, deleteAllNotifications, setSeenNotifications, verifyAccount, pushMessage, deleteDeal, getDealsByAccIdFull, getMessagesByAcc, getMessagesByDealId, pushNotification, getDealById, getNotifications, getUserById, verifyOwner, verifyQuantity, getAllItems, findUser, updateItemQuantity, createAccount, getSingleItem, insertItems, getOrders, getDealsTheAccOffered, getDealsByAccId, getDeals, createDeal, insertItemsToDeal,
  getItemsByOwner, getItemsByName, deleteItem, publishItem, getUserExtraInfo, getBundleItemsFromAccFull ,getBundleItemsFromAcc, getLastDeal, getUsername, multipliedEmailOrUsername, getEmailById, getDealsOffered, completeADeal, rejectDeal
};