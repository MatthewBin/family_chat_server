/**
 * Created by maxiaobin on 17/5/2.
 */
'use strict';

var pub = {};

pub.hello = function (req, res) {
    var ip = req.headers["x-real-ip"];
    if (!ip) {
        ip = req.ip;
        if (!ip) {
            ip = "none";
        }
    }
    res.send({
        hello: 'It works.', ip: ip, project: "family_chat_server"
    });
};

module.exports = pub;
