const functions = require("firebase-functions");
const nodemailer = require('nodemailer');
const smtpTransport = require('nodemailer-smtp-transport');
const cors = require('cors')({ origin: true });
const admin = require('firebase-admin');
const fs = require('fs');
const Busboy = require('busboy');
admin.initializeApp({
    credential: admin.credential.applicationDefault()
});
let transporter = nodemailer.createTransport({
    host: 'smtp.hostinger.com',
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
        user: 'noreply@wecarrybags.co.uk', // replace with your actual email address
        pass: 'Launch289@' // replace with your actual password
    }
});

exports.emailSend = functions.https.onRequest((request, response) => {
    cors(request, response, () => {
        const { to, subject, text, html } = request.body;
        let mailOptions = {
            from: '"Wecarrybags" <noreply@wecarrybags.co.uk>', // sender address
            to,
            subject,
            text,
            html
        };
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                response.status(500).send(error);
            } else {
                response.send("Email send successfully");
            }
        });
    });
});

let transporterAttachment = nodemailer.createTransport(smtpTransport({
    host: 'smtp.hostinger.com',
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
        user: 'noreply@wecarrybags.co.uk',
        pass: 'Launch289@'
    }
}));
exports.sendEmailWithAttachment = functions.https.onRequest((req, res) => {
    cors(req, res, () => {
        let fileToUpload;
        let body = {}
        const busboy = new Busboy({
            headers: req.headers,
            limits: {
                fileSize: 10 * 1024 * 1024,
            }
        });
        busboy.on('field', (key, value) => {
            body[key] = value
        });
        busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
            const tempFilePath = `/tmp/${filename}`;
            fileToUpload = {
                filename: filename,
                path: tempFilePath,
                contentType: mimetype
            };
            file.pipe(fs.createWriteStream(tempFilePath));
        });
        busboy.on('finish', () => {
            let mailOptions = {
                from: '"Wecarrybags" <noreply@wecarrybags.co.uk>', // sender address
                to: body.to,
                subject: body.subject,
                html: body.html,
                attachments: [
                    {
                        filename: fileToUpload.filename,
                        path: fileToUpload.path,
                        contentType: fileToUpload.contentType
                    }
                ]
            };
            transporterAttachment.sendMail(mailOptions, function (error, info) {
                if (error) {
                    res.status(500).send(error);
                } else {
                    res.send("Email send successfully");
                }
            });
        })
        busboy.end(req.rawBody);
    });
});