"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const { Client, Pool } = require('pg');
require('dotenv').config();
// Valoremly db backup
const pool = new Pool({
    connectionString: process.env.COCKROACH_DB,
    max: 1000,
});
// Handle pool errors
pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err);
});
const bcrypt = require('bcryptjs');
function verifyUser(user, cb) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const userData = yield queryRequest(`SELECT * FROM accounts WHERE username = $1 AND active = true`, [user]);
            return cb(null, userData[0]);
        }
        catch (err) {
            return cb(err, null);
        }
    });
}
function verifyAccount(token) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const account = yield queryRequest(`SELECT verification FROM accounts WHERE verification = $1`, [token]);
            if (account.length > 0) {
                const result = yield queryRequest(`UPDATE accounts SET active = true, verification = null WHERE verification = $1`, [token]);
                return true;
            }
            else {
                return false;
            }
        }
        catch (err) {
            console.log(err);
            return false;
        }
    });
}
function createAccount(username, password, email, verify) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const userExists = yield findUser(username);
            const emailExists = yield queryRequest(`SELECT email FROM accounts WHERE email = $1`, [email]);
            if (userExists || emailExists.length > 0) {
                return false;
            }
            else {
                let salt = yield bcrypt.genSalt(10);
                let hash = yield bcrypt.hash(password, salt);
                const userCreate = yield queryRequest(`INSERT INTO accounts(password, email, username, verification) VALUES($1, $2, $3, $4)`, [hash, email, username, verify]);
                if (userCreate) {
                    let justCreated = yield queryRequest(`SELECT id FROM accounts WHERE username = $1 AND email = $2`, [username, email]);
                    if (justCreated.length < 1) {
                        return false;
                    }
                    yield queryRequest(`INSERT INTO user_info(account_id, item_n, deals_s, blocked, feedback, admin) VALUES($1, 0, 0, 0, 0, false)`, [justCreated[0].id]);
                    return true;
                }
            }
        }
        catch (err) {
            console.log(err);
        }
    });
}
const findUser = (name) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield queryRequest(`SELECT username FROM accounts WHERE username = $1`, [name]);
        if (result.length > 0) {
            return result;
        }
        else {
            return null;
        }
    }
    catch (err) {
        console.log(err);
    }
});
function getUserById(id) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const result = yield queryRequest(`SELECT * FROM accounts WHERE id = $1`, [id]);
            return result;
        }
        catch (err) {
            console.log(err);
        }
    });
}
function getEmailById(id) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const result = yield queryRequest(`SELECT email FROM accounts WHERE id = $1`, [id]);
            return result[0];
        }
        catch (err) {
            console.log(err);
        }
    });
}
function multipliedEmailOrUsername(email, username) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const emailExists = yield queryRequest(`SELECT email FROM accounts WHERE email = $1`, [email]);
            const usernameExists = yield queryRequest(`SELECT username FROM accounts WHERE username = $1`, [username]);
            return { emailExists: emailExists.length > 0, usernameExists: usernameExists.length > 0 };
        }
        catch (err) {
            console.log(err);
        }
    });
}
function getUsername(id) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const result = yield queryRequest(`SELECT username FROM accounts WHERE id = $1`, [id]);
            return result[0];
        }
        catch (err) {
            console.log(err);
        }
    });
}
function getItemsByName(name, page) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const result = yield queryRequest(`SELECT * FROM items WHERE name ILIKE $1 AND quantity = '1' LIMIT 12 OFFSET $2`, [`%${name}%`, page * 12]);
            const countItems = yield queryRequest(`SELECT COUNT(*) FROM items WHERE name ILIKE $1 AND quantity = '1'`, [`%${name}%`]);
            let total = { data: result, total: countItems[0].count };
            return total;
        }
        catch (err) {
            console.log(err);
        }
    });
}
function getUserExtraInfo(acc_id) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const result = yield queryRequest(`SELECT * FROM user_info WHERE account_id = $1`, [acc_id]);
            return result;
        }
        catch (err) {
            console.log(err);
        }
    });
}
function publishItem(name, price, category, description, owner, images) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield queryRequest(`UPDATE user_info SET items_n = items_n + 1 WHERE account_id = $1`, [owner]);
            const result = yield queryRequest(`INSERT INTO items(name, price, category, description, owner, images, quantity) VALUES($1, $2, $3, $4 , $5 , $6 , 1)`, [name, price, category, description, owner, images]);
            return result;
        }
        catch (err) {
            console.log(err);
        }
    });
}
function getBundleItemsFromAcc(acc_id, items_ids) {
    return __awaiter(this, void 0, void 0, function* () {
        let total = [];
        try {
            for (let i = 0; i < items_ids.length; i++) {
                const result = yield queryRequest(`SELECT * FROM items WHERE owner = $1 AND id= $2`, [acc_id, items_ids[i]]);
                if (result.length < 1) {
                    continue;
                }
                total.push(result[0].id);
            }
            return total;
        }
        catch (err) {
            console.log(err);
        }
    });
}
function getBundleItemsFromAccFull(acc_id, items_ids) {
    return __awaiter(this, void 0, void 0, function* () {
        let total = [];
        try {
            for (let i = 0; i < items_ids.length; i++) {
                const result = yield queryRequest(`SELECT * FROM items WHERE owner = $1 AND id= $2`, [acc_id, items_ids[i]]);
                if (result.length < 1) {
                    continue;
                }
                total.push(result[0]);
            }
            return total;
        }
        catch (err) {
            console.log(err);
        }
    });
}
function deleteItem(id) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const item = yield queryRequest(`SELECT * FROM items WHERE id = $1`, [id]);
            if (item.length < 1) {
                return "Item doesn't exist";
            }
            const result = yield queryRequest(`DELETE FROM items WHERE id = $1`, [id]);
            return result;
        }
        catch (err) {
            console.log(err);
        }
    });
}
function getItemsByOwner(acc_id) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const result = yield queryRequest(`SELECT * FROM items WHERE owner = $1`, [acc_id]);
            return result;
        }
        catch (err) {
            console.log(err);
        }
    });
}
function getAllItems(page) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let items = yield queryRequest(`SELECT * FROM items WHERE quantity = '1' LIMIT 12 OFFSET $1 `, [page * 12]);
            let countItems = yield queryRequest(`SELECT COUNT(*) FROM items WHERE quantity = '1'`, []);
            let result = { data: items, total: countItems[0].count };
            return result;
        }
        catch (err) {
            console.log(err);
        }
    });
}
function pushNotification(accId, type, message, img) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const newNotification = yield queryRequest(`INSERT INTO notifications(type, message, acc_id, image) VALUES($1, $2, $3, $4)`, [type, message, accId, img]);
            return true;
        }
        catch (err) {
            console.log(err);
        }
    });
}
function pushMessage(deal_id, sender, receiver, message) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const newNotification = yield queryRequest('INSERT INTO messages(sender, receiver, message, deal_id) VALUES($1, $2, $3, $4)', [sender, receiver, message, deal_id]);
            return true;
        }
        catch (err) {
            console.log(err);
        }
    });
}
function getMessagesByDealId(deal_id, acc_id) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const messages = yield queryRequest(`SELECT * FROM messages WHERE deal_id = $1 AND (sender = $2 OR receiver = $3)`, [deal_id, acc_id, acc_id]);
            return messages;
        }
        catch (err) {
            console.log(err);
        }
    });
}
function getMessagesByAcc(acc_id) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const messages = yield queryRequest(`SELECT * FROM messages WHERE receiver = $1`, [acc_id]);
            return messages;
        }
        catch (err) {
            console.log(err);
        }
    });
}
function getNotifications(accId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const result = yield queryRequest(`SELECT * FROM notifications WHERE acc_id = $1`, [accId]);
            return result;
        }
        catch (err) {
            console.log(err);
        }
    });
}
function deleteAllNotifications() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const deleteAll = yield queryRequest(`DELETE FROM notifications WHERE seen = true`, []);
        }
        catch (err) {
            console.log(err);
        }
    });
}
function setSeenNotifications(accId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const result = yield queryRequest(`UPDATE notifications SET seen = true WHERE acc_id = $1`, [accId]);
        }
        catch (err) {
            console.log(err);
        }
    });
}
function orderCreate(userId, sessionReference) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const createOrder = yield queryRequest(`INSERT INTO orders(account_id, payment_session) VALUES($1, $2)`, [userId, sessionReference]);
            return true;
        }
        catch (err) {
            console.log(err);
        }
    });
}
function insertItems(cart, userId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let orderId = yield queryRequest(`SELECT MAX(id) as order_id FROM orders WHERE account_id = $1`, [userId]);
            let result = orderId[0];
            for (let x of cart) {
                yield queryRequest(`INSERT INTO order_items(order_id, product_id, quantity) VALUES ($1, $2 ,$3)`, [result.order_id, x.id, x.qty]);
            }
            return true;
        }
        catch (err) {
            console.log(err);
        }
    });
}
function getDealsByAccId(id, completed = false, both = false) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let deal;
            if (completed) {
                if (both) {
                    deal = yield queryRequest(`SELECT * FROM deals WHERE (acc_id2 = $1 OR acc_id1 = $2) AND status = 'completed'`, [id, id]);
                }
                else {
                    deal = yield queryRequest(`SELECT * FROM deals WHERE acc_id2 = $1 AND status = 'completed'`, [id]);
                }
            }
            else {
                deal = yield queryRequest(`SELECT * FROM deals WHERE acc_id2 = $1 AND status = 'pending'`, [id]);
            }
            deal = deal.map((ele) => { return { deal_id: ele.id, from: ele.acc_id1 }; });
            return deal;
        }
        catch (err) {
            console.log(err);
            return false;
        }
    });
}
function getDealsByAccIdFull(id) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let deal = yield queryRequest(`SELECT * FROM deals WHERE (acc_id2 = $1 OR acc_id1 = $2) AND status = 'completed'`, [id, id]);
            return deal;
        }
        catch (err) {
            console.log(err);
        }
    });
}
function updateItemQuantity(id, quantity) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let deal = yield queryRequest(`UPDATE items SET quantity = $1 WHERE id = $2`, [quantity, id]);
            return true;
        }
        catch (err) {
            throw new Error("something went wrong");
        }
    });
}
function getDealsTheAccOffered(id) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let deal = yield queryRequest(`SELECT * FROM deals WHERE acc_id1 = $1 AND status = 'pending'`, [id]);
            deal = deal.map((ele) => { return { deal_id: ele.id, from: ele.acc_id2 }; });
            return deal;
        }
        catch (err) {
            throw new Error("something went wrong");
        }
    });
}
function completeADeal(deal_id, acc_id) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const verifyUSer = yield queryRequest(`SELECT * FROM deals WHERE id = $1 AND acc_id2 = $2`, [deal_id, acc_id]);
            if (verifyUSer.length < 1) {
                throw new Error('User not authorized');
            }
            const allItemsIdsInvolved = yield queryRequest(`SELECT * FROM deals_items WHERE deal_id = $1`, [deal_id]);
            for (const item of allItemsIdsInvolved) {
                yield updateItemQuantity(item.item_id, 0);
            }
            let summedUpIds = [];
            for (const item of allItemsIdsInvolved) {
                const locatedDealsWithItems = yield queryRequest(`SELECT deal_id FROM deals_items WHERE item_id = $1 AND deal_id != $2`, [item.item_id, deal_id]);
                summedUpIds.concat(locatedDealsWithItems);
                yield queryRequest(`DELETE FROM deals_items WHERE item_id = $1 AND deal_id != $2`, [item.item_id, deal_id]);
            }
            let filteredIds = [];
            summedUpIds.forEach((ele) => {
                if (!filteredIds.includes(ele)) {
                    filteredIds.push(ele);
                }
            });
            for (const item of filteredIds) {
                yield queryRequest(`DELETE FROM deals WHERE id = $1`, [item]);
            }
            // create a date to expire the deal, sum seconds equivalent to 14 days
            const todayDate = new Date().toLocaleString('en-US', { timeZone: 'Europe/London' });
            const today = new Date(todayDate);
            // 7 days to expire a completed deal
            let epochTime = Math.floor(today.getTime() / 1000) + (24 * 7 * 60 * 60);
            const result = yield queryRequest(`UPDATE deals SET status = 'completed', expire = $1 WHERE id = $2 AND acc_id2 = $3`, [epochTime, deal_id, acc_id]);
            return result;
        }
        catch (err) {
            console.log(err);
            return err;
        }
    });
}
function rejectDeal(deal_id, acc_id) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const verifyUSer = yield queryRequest(`SELECT * FROM deals WHERE id = $1 AND (acc_id2 = $2 OR acc_id1 = $3)`, [deal_id, acc_id, acc_id]);
            if (verifyUSer.length < 1) {
                throw new Error('User not authorized');
            }
            yield queryRequest(`DELETE FROM deals_items WHERE deal_id = $1`, [deal_id]);
            yield queryRequest(`DELETE FROM deals WHERE id = $1`, [deal_id]);
            return 2;
        }
        catch (err) {
            console.log(err);
            return err;
        }
    });
}
function deleteDeal(deal_id) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const deal = yield queryRequest(`SELECT * FROM deals WHERE id = $1`, [deal_id]);
            if (deal.length < 1) {
                throw new Error('Deal does not exist');
            }
            yield queryRequest(`DELETE FROM messages WHERE deal_id = $1`, [deal_id]);
            yield queryRequest(`DELETE FROM deals_items WHERE deal_id = $1`, [deal_id]);
            yield queryRequest(`DELETE FROM deals WHERE id = $1`, [deal_id]);
            return 2;
        }
        catch (err) {
            console.log(err);
            return err;
        }
    });
}
function deleteExpireDeals() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const newEpoch = new Date().getTime() / 1000;
            const dealsExpired = yield queryRequest(`SELECT id FROM deals WHERE expire < $1`, [newEpoch]);
            for (let i = 0; i < dealsExpired.length; i++) {
                yield deleteDeal(dealsExpired[i]);
            }
        }
        catch (err) {
            console.log(err);
        }
    });
}
//Check this method aswell
function getDeals(id) {
    return __awaiter(this, void 0, void 0, function* () {
        let items = [];
        try {
            for (let i = 0; i < id.length; i++) {
                let y = id[i].from;
                let x = id[i].deal_id;
                let deal = yield queryRequest(`SELECT deals_items.item_id, items.name, items.price, items.category, items.owner, items.images FROM deals_items INNER JOIN items ON deals_items.item_id = items.id WHERE deals_items.deal_id = $1`, [x]);
                if (deal.length < 1) {
                    continue;
                }
                else {
                    items.push({ deal_id: x, from: y, items: deal });
                }
            }
            return items;
        }
        catch (err) {
            console.log(err);
        }
    });
}
function getSingleDeal(deal_id, acc_id) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const result = yield queryRequest(`SELECT * FROM deals WHERE id = $1 AND (acc_id2 = $2 OR acc_id1 = $3)`, [deal_id, acc_id, acc_id]);
            return result;
        }
        catch (err) {
            console.log(err);
        }
    });
}
function getDealById(deal_id) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const result = yield queryRequest(`SELECT * FROM deals WHERE id = $1`, [deal_id]);
            return result;
        }
        catch (err) {
            console.log(err);
        }
    });
}
function getDealsOffered(id) {
    return __awaiter(this, void 0, void 0, function* () {
        let items = [];
        try {
            for (let i = 0; i < id.length; i++) {
                let x = id[i];
                let deal = yield queryRequest(`SELECT item_id FROM deals_items INNER JOIN deals ON deals_items.deal_id = deals.id WHERE deals.acc_id2 = $1 `, [x]);
                if (deal.length < 1) {
                    continue;
                }
                else {
                    items.push({ deal_id: x, items: deal });
                }
            }
            return items;
        }
        catch (err) {
            return false;
        }
    });
}
function verifyOwner(id, acc_id) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let result = yield queryRequest(`SELECT * FROM items WHERE id = $1 AND owner = $2`, [id, acc_id]);
            if (result.length < 1) {
                return false;
            }
            else {
                return true;
            }
        }
        catch (err) {
            console.log(err);
        }
    });
}
function verifyQuantity(id) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let result = yield queryRequest(`SELECT * FROM items WHERE id = $1`, [id]);
            if (result.quantity == "0") {
                return false;
            }
            else {
                return true;
            }
        }
        catch (err) {
            console.log(err);
        }
    });
}
function getLastDeal(acc_1, acc_2) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let deal = yield queryRequest(`SELECT id FROM deals WHERE acc_id1 = $1 AND acc_id2 = $2 ORDER BY id DESC LIMIT 1`, [acc_1, acc_2]);
            return deal;
        }
        catch (err) {
            console.log(err);
        }
    });
}
function createDeal(acc1, acc2) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let verify1 = yield queryRequest(`SELECT * FROM accounts WHERE id = $1`, [acc1]);
            let verify2 = yield queryRequest(`SELECT * FROM accounts WHERE id = $1`, [acc2]);
            if (verify1.length < 1 || verify2.length < 1) {
                return false;
            }
            let deal = yield queryRequest(`INSERT INTO deals(acc_id1, acc_id2, status) VALUES ($1, $2, 'pending')`, [acc1, acc2]);
            return true;
        }
        catch (err) {
            console.log(err);
            return false;
        }
    });
}
function addItemToDeal(dealId, accId, itemId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let deal = yield queryRequest(`INSERT INTO deals_items(deal_id, acc_id, item_id) VALUES ($1, $2, $3)`, [dealId, accId, itemId]);
            return deal;
        }
        catch (err) {
            console.log(err);
        }
    });
}
function insertItemsToDeal(dealId, itemsIds, accId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            for (let i = 0; i < itemsIds.length; i++) {
                let itemId = itemsIds[i];
                yield addItemToDeal(dealId, accId, itemId);
            }
            return true;
        }
        catch (err) {
            console.log(err);
            return false;
        }
    });
}
function getOrders(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const result = yield queryRequest(`SELECT * FROM order_items INNER JOIN orders ON order_items.order_id = orders.id WHERE orders.account_id = $1`, [userId]);
            return result;
        }
        catch (err) {
            console.log(err);
        }
    });
}
function getSingleItem(id) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const data = yield queryRequest(`SELECT * FROM items WHERE id = $1 `, [id]);
            if (data.length < 1) {
                throw new Error();
            }
            return data[0];
        }
        catch (err) {
            throw new Error("no item");
        }
    });
}
function queryRequest(inQuery, params) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const cliente = yield pool.connect();
            const res = yield cliente.query({ text: inQuery, values: params });
            cliente.release();
            return res.rows;
        }
        catch (err) {
            console.log(err);
        }
        finally {
        }
    });
}
module.exports = { verifyUser, getSingleDeal, deleteExpireDeals, deleteAllNotifications, setSeenNotifications, verifyAccount, pushMessage, deleteDeal, getDealsByAccIdFull, getMessagesByAcc, getMessagesByDealId, pushNotification, getDealById, getNotifications, getUserById, verifyOwner, verifyQuantity, getAllItems, findUser, updateItemQuantity, createAccount, getSingleItem, insertItems, getOrders, getDealsTheAccOffered, getDealsByAccId, getDeals, createDeal, insertItemsToDeal,
    getItemsByOwner, getItemsByName, deleteItem, publishItem, getUserExtraInfo, getBundleItemsFromAccFull, getBundleItemsFromAcc, getLastDeal, getUsername, multipliedEmailOrUsername, getEmailById, getDealsOffered, completeADeal, rejectDeal
};
