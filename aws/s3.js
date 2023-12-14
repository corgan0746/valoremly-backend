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
const client_s3_1 = require("@aws-sdk/client-s3");
require('dotenv').config();
// @ts-ignore
const s3Client = new client_s3_1.S3Client({ region: process.env.AWS_REGION, credentials: { accessKeyId: process.env.AWS_ACCESS_KEY, secretAccessKey: process.env.AWS_SECRET_KEY } });
function uploadImage(img, id) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = yield s3Client.send(new client_s3_1.PutObjectCommand({
            Bucket: process.env.AWS_BUCKET,
            Key: id,
            Body: img,
            ContentType: 'image/jpeg'
        }));
    });
}
function deleteImage(imageId) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = yield s3Client.send(new client_s3_1.DeleteObjectCommand({ Bucket: process.env.AWS_BUCKET, Key: imageId }));
    });
}
module.exports = { uploadImage, deleteImage };
