const nodeScheduler = require("node-schedule");
const { deleteAllNotifications, deleteExpireDeals } = require('../db/db')

  export const createJob = (days:number = 0, hours:number = 0, minutes:number = 0, cb:Function|null) => {

    const todayDate = new Date().toLocaleString('en-US', {timeZone: 'Europe/London'});
    const today = new Date(todayDate);
    let epochTime = Math.floor(today.getTime() / 1000);
    epochTime += (days * 60 * 60 * 60) + (hours * 60 * 60) + (minutes * 60);
    const resultDate = new Date(epochTime * 1000);
    const params = {cb, created: new Date().toLocaleString('en-US', {timeZone: 'Europe/London'})}

    const job = nodeScheduler.scheduleJob(resultDate, function(){
      if(params?.cb){
        params.cb();
      }
      job.cancel();
    }.bind(params));

  }

  export const createJobByEpoch = (epochTime:number, cb:Function|null, deal_id:number) => {

    const resultDate = new Date(epochTime * 1000);
    const params = {deal_id:deal_id ,cb:cb, created: new Date().toLocaleString('en-US', {timeZone: 'Europe/London'})}
    const job = nodeScheduler.scheduleJob(resultDate, function(){
      if(params?.cb){
        params.cb(params.deal_id);
      }
      job.cancel();
    }.bind(params));

  }

  export const createRoutineJob = async () => {

    const rule = new nodeScheduler.RecurrenceRule();
    rule.hour = 4;
    rule.minute = 0;
    rule.tz = 'Europe/London';

    const job = await nodeScheduler.scheduleJob(rule, async function(){
      await deleteAllNotifications();
      await deleteExpireDeals();
    });

  }

