var express = require('express');
var router = express.Router();
var config = require('./config.json');
var signatureVerification = require('./helpers/signatureCreation');
var enums = require('./helpers/enums');
const crypto = require('crypto');

router.get('/index' , (req, res, next)=>{
    // console.log("index get hit");
    console.log(req.body);
    res.render('checkout',{ 
        postUrl: config.paths[config.enviornment].cashfreePayUrl
    });
});

router.post('/result',(req, res, next)=>{
    console.log("merchantHosted result hit");
    console.log(req.body);

    const txnTypes = enums.transactionStatusEnum;
    console.log(txnTypes);
    try{
    switch(req.body.txStatus){
        case txnTypes.cancelled: {
            //buisness logic if payment was cancelled
            return res.status(200).render('result',{data:{
                status: "failed",
                message: "transaction was cancelled by user",
            }});
        }
        case txnTypes.failed: {
            //buisness logic if payment failed
            const signature = req.body.signature;
            // const signature = signatureVerification.signatureRequest1(req.body,config.secretKey);
            const derivedSignature = signatureVerification.signatureResponse1(req.body, config.secretKey);
            if(derivedSignature !== signature){
                throw {name:"signature missmatch", message:"there was a missmatch in signatures genereated and received"}
            }
            return res.status(200).render('result',{data:{
                status: "failed",
                message: "payment failure",
            }});
        }
        case txnTypes.success: {
            //buisness logic if payments succeed
            const signature = req.body.signature;
            console.log("this is signature value"+signature);
            // const signature = signatureVerification.signatureRequest1(req.body, config.secretKey);
            const derivedSignature = signatureVerification.signatureResponse1(req.body, config.secretKey);
            if(derivedSignature !== signature){
                throw {name:"signature missmatch", message:"there was a missmatch in signatures genereated and received"}
            }
            return res.status(200).render('result',{data:{
                status: "success",
                message: "payment success",
            }});
        }
    }
    }
    catch(err){
        return res.status(500).render('result',{data:{
            status:"error",
            err: err,
            name: err.name,
            message: err.message,
        }});
    }
    // $data = $orderId.$orderAmount.$referenceId.$txStatus.$paymentMode.$txMsg.$txTime;
    const  signature = crypto.createHmac('sha256',config.secretKey).update(req.body.toString()).digest('base64') ;
    const derivedSignature = signatureVerification.signatureResponse1(req.body, config.secretKey);;
    // const signature = signatureVerification.signatureResponse1(req.body, config.secretKey);
    // const signature = req.body.signature;
    console.log(signature);
    // const derivedSignature = signatureVerification.signatureRequest1(req.body, config.secretKey);
    console.log(derivedSignature);
    if(derivedSignature === signature){
        console.log("works");
        return res.status(200).send({
            status:req.body.txStatus,
        })
    }
    else{
        console.log("signature gotten: ", signature);
        console.log("signature derived: ", derivedSignature);
        return res.status(200).send({
            status: "error",
            message: "signature mismatch",
        })
    }
});

module.exports = router;