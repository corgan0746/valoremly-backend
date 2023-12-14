import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, S3ClientConfig} from "@aws-sdk/client-s3";

require('dotenv').config();

// @ts-ignore
const s3Client = new S3Client({ region: process.env.AWS_REGION , credentials:{ accessKeyId:process.env.AWS_ACCESS_KEY , secretAccessKey: process.env.AWS_SECRET_KEY }});



async function uploadImage(img:any, id:string){

    const result = await s3Client.send(
        new PutObjectCommand({
          Bucket: process.env.AWS_BUCKET,
          Key: id,
          Body: img,
          ContentType: 'image/jpeg'
        })
      );
} 

async function deleteImage(imageId:string){

    const result = await s3Client.send(
        new DeleteObjectCommand({ Bucket: process.env.AWS_BUCKET , Key: imageId })
      );

}


module.exports = { uploadImage, deleteImage }