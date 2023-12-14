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
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRoutineJob = exports.createJobByEpoch = exports.createJob = void 0;
const nodeScheduler = require("node-schedule");
const { deleteAllNotifications, deleteExpireDeals } = require('../db/db');
const createJob = (days = 0, hours = 0, minutes = 0, cb) => {
    const todayDate = new Date().toLocaleString('en-US', { timeZone: 'Europe/London' });
    const today = new Date(todayDate);
    let epochTime = Math.floor(today.getTime() / 1000);
    epochTime += (days * 60 * 60 * 60) + (hours * 60 * 60) + (minutes * 60);
    const resultDate = new Date(epochTime * 1000);
    const params = { cb, created: new Date().toLocaleString('en-US', { timeZone: 'Europe/London' }) };
    const job = nodeScheduler.scheduleJob(resultDate, function () {
        if (params === null || params === void 0 ? void 0 : params.cb) {
            params.cb();
        }
        job.cancel();
    }.bind(params));
};
exports.createJob = createJob;
const createJobByEpoch = (epochTime, cb, deal_id) => {
    const resultDate = new Date(epochTime * 1000);
    const params = { deal_id: deal_id, cb: cb, created: new Date().toLocaleString('en-US', { timeZone: 'Europe/London' }) };
    const job = nodeScheduler.scheduleJob(resultDate, function () {
        if (params === null || params === void 0 ? void 0 : params.cb) {
            params.cb(params.deal_id);
        }
        job.cancel();
    }.bind(params));
};
exports.createJobByEpoch = createJobByEpoch;
const createRoutineJob = () => __awaiter(void 0, void 0, void 0, function* () {
    const rule = new nodeScheduler.RecurrenceRule();
    rule.hour = 4;
    rule.minute = 0;
    rule.tz = 'Europe/London';
    const job = yield nodeScheduler.scheduleJob(rule, function () {
        return __awaiter(this, void 0, void 0, function* () {
            yield deleteAllNotifications();
            yield deleteExpireDeals();
        });
    });
});
exports.createRoutineJob = createRoutineJob;
