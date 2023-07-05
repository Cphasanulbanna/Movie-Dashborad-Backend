//model
const User = require("../models/userModel");

//packages
const cloudinary = require("cloudinary");
const nodemailer = require("nodemailer");
const consola = require("consola");

//functions
const { generatePasswordHash, comparePassword } = require("../utils/bcrypt");
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require("../utils/jwt");
const { generateOtp } = require("../utils/generateOTP");

const signup = async (req, res) => {
    try {
        const file = req?.files?.profilePic;
        if (!file) {
            return res.status(400).json({
                message: "profile-picture is required",
                StatusCode: 6001,
            });
        }
        const profilePicture = await cloudinary.v2.uploader.upload(file?.tempFilePath, {
            folder: "movie-dashboard/profile-picture",
        });

        const { username, password, email } = req.body;

        if (!username || !password || !email) {
            return res.status(400).json({
                message: "Username, email, profile-picture and Password is required",
                StatusCode: 6001,
            });
        }
        const isExists = await User.findOne({ email: email });
        if (isExists) {
            return res
                .status(400)
                .json({ message: "A user aalready exists with this username", StatusCode: 6001 });
        }

        const hashedPaassword = await generatePasswordHash(password);

        const newUser = {
            email: email,
            username: username,
            password: hashedPaassword,
            profilePic: {
                public_id: profilePicture.public_id,
                url: profilePicture.secure_url,
            },
        };

        // Delete the temporary file
        fs.unlinkSync(file.tempFilePath);

        await User.create(newUser);

        return res.status(201).json({ message: "Account created successfully", StatusCode: 6000 });
    } catch (error) {
        res.status(400).json({ message: error.message, StatusCode: 6001 });
    }
};

const login = async (req, res) => {
    consola.log(req.body.email, "email----------");
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res
                .status(400)
                .json({ message: "email and Password is required", StatusCode: 6001 });
        }
        const user = await User.findOne({ email: email });
        if (!user) {
            return res.status(401).json({ message: "User not found", StatusCode: 6001 });
        }

        const validPassword = await comparePassword(password, user.password);
        if (!validPassword) {
            return res.status(404).json({ message: "Invalid password", StatusCode: 6001 });
        }

        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
        });

        res.status(200).json({
            StatusCode: 6000,
            message: "Login success",
            _id: user.id,
            username: user.username,
            email: user.email,
            profile_pic: user.profilePic,
            access_token: accessToken,
            refresh_token: refreshToken,
        });
    } catch (error) {
        consola.log(error);
        res.status(400).json({ message: error.message, StatusCode: 6001 });
    }
};

const getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select("username email profilePic createdAt role");
        users.forEach((user) => {
            if (user.role === "Admin") {
                const index = user.email.indexOf("@");
                const firstpart = user.email.slice(0, index);

                const editedmail = `${user.email.replace(firstpart, "*******")}`;
                user.email = editedmail;
            }
        });
        return res.status(200).json({ message: "Success", users: users });
    } catch (error) {
        res.status(400).json({ message: error.message, StatusCode: 6001 });
    }
};

const forgetPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const user = await User.findOne({ email: email });
        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        const generatedOTP = generateOtp();
        consola.log(generatedOTP, "inside forget password");
        // Store the OTP in the session
        // req.session.generatedOTP = generatedOTP;
        user.otp = {
            otp: generatedOTP,
            otp_verified: false,
        };

        await user.save();

        // consola.log(req.sessionID, "id in forget password");
        // consola.log(req.session.generatedOTP, "otp from session inside forget password api");

        let transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.SENDER_MAIL,
                pass: process.env.PASSWORD, // generated app password
            },
        });

        transporter.verify(function (error, success) {
            if (error) {
                consola.error(error.message);
            } else {
                consola.log("Server is ready to take our messages");
            }
        });

        let mailOptions = {
            from: process.env.SENDER_MAIL,
            to: email,
            subject: "Password Reset",
            html: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
            <html xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office" style="width:100%;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;padding:0;Margin:0">
             <head>
              <meta charset="UTF-8">
              <meta content="width=device-width, initial-scale=1" name="viewport">
              <meta name="x-apple-disable-message-reformatting">
              <meta http-equiv="X-UA-Compatible" content="IE=edge">
              <meta content="telephone=no" name="format-detection">
              <title>Reset Password</title><!--[if (mso 16)]>
                <style type="text/css">
                a {text-decoration: none;}
                </style>
                <![endif]--><!--[if gte mso 9]><style>sup { font-size: 100% !important; }</style><![endif]--><!--[if gte mso 9]>
            <xml>
                <o:OfficeDocumentSettings>
                <o:AllowPNG></o:AllowPNG>
                <o:PixelsPerInch>96</o:PixelsPerInch>
                </o:OfficeDocumentSettings>
            </xml>
            <![endif]-->
              <style type="text/css">
            #outlook a {
                padding:0;
            }
            .ExternalClass {
                width:100%;
            }
            .ExternalClass,
            .ExternalClass p,
            .ExternalClass span,
            .ExternalClass font,
            .ExternalClass td,
            .ExternalClass div {
                line-height:100%;
            }
            .es-button {
                mso-style-priority:100!important;
                text-decoration:none!important;
            }
            a[x-apple-data-detectors] {
                color:inherit!important;
                text-decoration:none!important;
                font-size:inherit!important;
                font-family:inherit!important;
                font-weight:inherit!important;
                line-height:inherit!important;
            }
            .es-desk-hidden {
                display:none;
                float:left;
                overflow:hidden;
                width:0;
                max-height:0;
                line-height:0;
                mso-hide:all;
            }
            .es-button-border:hover a.es-button, .es-button-border:hover button.es-button {
                background:#ffffff!important;
            }
            .es-button-border:hover {
                background:#ffffff!important;
                border-style:solid solid solid solid!important;
                border-color:#3d5ca3 #3d5ca3 #3d5ca3 #3d5ca3!important;
            }
            @media only screen and (max-width:600px) {p, ul li, ol li, a { line-height:150%!important } h1, h2, h3, h1 a, h2 a, h3 a { line-height:120%!important } h1 { font-size:20px!important; text-align:center } h2 { font-size:16px!important; text-align:left } h3 { font-size:20px!important; text-align:center } .es-header-body h1 a, .es-content-body h1 a, .es-footer-body h1 a { font-size:20px!important } h2 a { text-align:left } .es-header-body h2 a, .es-content-body h2 a, .es-footer-body h2 a { font-size:16px!important } .es-header-body h3 a, .es-content-body h3 a, .es-footer-body h3 a { font-size:20px!important } .es-menu td a { font-size:14px!important } .es-header-body p, .es-header-body ul li, .es-header-body ol li, .es-header-body a { font-size:10px!important } .es-content-body p, .es-content-body ul li, .es-content-body ol li, .es-content-body a { font-size:16px!important } .es-footer-body p, .es-footer-body ul li, .es-footer-body ol li, .es-footer-body a { font-size:12px!important } .es-infoblock p, .es-infoblock ul li, .es-infoblock ol li, .es-infoblock a { font-size:12px!important } *[class="gmail-fix"] { display:none!important } .es-m-txt-c, .es-m-txt-c h1, .es-m-txt-c h2, .es-m-txt-c h3 { text-align:center!important } .es-m-txt-r, .es-m-txt-r h1, .es-m-txt-r h2, .es-m-txt-r h3 { text-align:right!important } .es-m-txt-l, .es-m-txt-l h1, .es-m-txt-l h2, .es-m-txt-l h3 { text-align:left!important } .es-m-txt-r img, .es-m-txt-c img, .es-m-txt-l img { display:inline!important } .es-button-border { display:block!important } a.es-button, button.es-button { font-size:14px!important; display:block!important; border-left-width:0px!important; border-right-width:0px!important } .es-btn-fw { border-width:10px 0px!important; text-align:center!important } .es-adaptive table, .es-btn-fw, .es-btn-fw-brdr, .es-left, .es-right { width:100%!important } .es-content table, .es-header table, .es-footer table, .es-content, .es-footer, .es-header { width:100%!important; max-width:600px!important } .es-adapt-td { display:block!important; width:100%!important } .adapt-img { width:100%!important; height:auto!important } .es-m-p0 { padding:0px!important } .es-m-p0r { padding-right:0px!important } .es-m-p0l { padding-left:0px!important } .es-m-p0t { padding-top:0px!important } .es-m-p0b { padding-bottom:0!important } .es-m-p20b { padding-bottom:20px!important } .es-mobile-hidden, .es-hidden { display:none!important } tr.es-desk-hidden, td.es-desk-hidden, table.es-desk-hidden { width:auto!important; overflow:visible!important; float:none!important; max-height:inherit!important; line-height:inherit!important } tr.es-desk-hidden { display:table-row!important } table.es-desk-hidden { display:table!important } td.es-desk-menu-hidden { display:table-cell!important } .es-menu td { width:1%!important } table.es-table-not-adapt, .esd-block-html table { width:auto!important } table.es-social { display:inline-block!important } table.es-social td { display:inline-block!important } .es-desk-hidden { display:table-row!important; width:auto!important; overflow:visible!important; max-height:inherit!important } }
            </style>
             </head>
             <body style="width:100%;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;padding:0;Margin:0">
              <div class="es-wrapper-color" style="background-color:#FAFAFA"><!--[if gte mso 9]>
                        <v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t">
                            <v:fill type="tile" color="#fafafa"></v:fill>
                        </v:background>
                    <![endif]-->
               <table class="es-wrapper" width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;padding:0;Margin:0;width:100%;height:100%;background-repeat:repeat;background-position:center top;background-color:#FAFAFA">
                 <tr style="border-collapse:collapse">
                  <td valign="top" style="padding:0;Margin:0">
                   <table cellpadding="0" cellspacing="0" class="es-content" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%">
                     <tr style="border-collapse:collapse">
                      <td class="es-adaptive" align="center" style="padding:0;Margin:0">
                       <table class="es-content-body" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:transparent;width:600px" cellspacing="0" cellpadding="0" bgcolor="#ffffff" align="center">
                         <tr style="border-collapse:collapse">
                          <td align="left" style="padding:10px;Margin:0">
                           <table width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                             <tr style="border-collapse:collapse">
                              <td valign="top" align="center" style="padding:0;Margin:0;width:580px">
                               <table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                 <tr style="border-collapse:collapse">
                                  <td align="center" class="es-infoblock" style="padding:0;Margin:0;line-height:14px;font-size:12px;color:#CCCCCC"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:14px;color:#CCCCCC;font-size:12px">Password Reset<br></p></td>
                                 </tr>
                               </table></td>
                             </tr>
                           </table></td>
                         </tr>
                       </table></td>
                     </tr>
                   </table>
                   <table cellpadding="0" cellspacing="0" class="es-header" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%;background-color:transparent;background-repeat:repeat;background-position:center top">
                     <tr style="border-collapse:collapse">
                      <td class="es-adaptive" align="center" style="padding:0;Margin:0">
                       <table class="es-header-body" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#3d5ca3;width:600px" cellspacing="0" cellpadding="0" bgcolor="#3d5ca3" align="center">
                         <tr style="border-collapse:collapse">
                          <td style="Margin:0;padding-top:20px;padding-bottom:20px;padding-left:20px;padding-right:20px;background-color:#3d5ca3" bgcolor="#3d5ca3" align="left"><!--[if mso]><table style="width:560px" cellpadding="0" 
                                    cellspacing="0"><tr><td style="width:270px" valign="top"><![endif]-->
                           <table class="es-left" cellspacing="0" cellpadding="0" align="left" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left">
                             <tr style="border-collapse:collapse">
                              <td class="es-m-p20b" align="left" style="padding:0;Margin:0;width:270px">
                               <table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                 <tr style="border-collapse:collapse">
                                  <td align="left" style="padding:0;Margin:0"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:21px;color:#333333;font-size:14px"><br></p></td>
                                 </tr>
                               </table></td>
                             </tr>
                           </table><!--[if mso]></td><td style="width:20px"></td><td style="width:270px" valign="top"><![endif]-->
                           <table class="es-right" cellspacing="0" cellpadding="0" align="right" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right">
                             <tr style="border-collapse:collapse">
                              <td align="left" style="padding:0;Margin:0;width:270px">
                               <table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                 <tr style="border-collapse:collapse">
                                  <td align="left" style="padding:0;Margin:0"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:21px;color:#333333;font-size:14px"><br></p></td>
                                 </tr>
                               </table></td>
                             </tr>
                           </table><!--[if mso]></td></tr></table><![endif]--></td>
                         </tr>
                       </table></td>
                     </tr>
                   </table>
                   <table class="es-content" cellspacing="0" cellpadding="0" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%">
                     <tr style="border-collapse:collapse">
                      <td style="padding:0;Margin:0;background-color:#fafafa" bgcolor="#fafafa" align="center">
                       <table class="es-content-body" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#ffffff;width:600px" cellspacing="0" cellpadding="0" bgcolor="#ffffff" align="center">
                         <tr style="border-collapse:collapse">
                          <td style="padding:0;Margin:0;padding-left:20px;padding-right:20px;padding-top:40px;background-color:transparent;background-position:left top" bgcolor="transparent" align="left">
                           <table width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                             <tr style="border-collapse:collapse">
                              <td valign="top" align="center" style="padding:0;Margin:0;width:560px">
                               <table style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-position:left top" width="100%" cellspacing="0" cellpadding="0" role="presentation">
                                 <tr style="border-collapse:collapse">
                                  <td align="center" style="padding:0;Margin:0;padding-top:5px;padding-bottom:5px;font-size:0"><img src="https://qfurqr.stripocdn.email/content/guids/CABINET_dd354a98a803b60e2f0411e893c82f56/images/23891556799905703.png" alt style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic" width="175"></td>
                                 </tr>
                                 <tr style="border-collapse:collapse">
                                  <td align="center" style="padding:0;Margin:0;padding-top:15px;padding-bottom:15px"><h1 style="Margin:0;line-height:24px;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;font-size:20px;font-style:normal;font-weight:normal;color:#333333"><strong>FORGOT YOUR </strong></h1><h1 style="Margin:0;line-height:24px;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;font-size:20px;font-style:normal;font-weight:normal;color:#333333"><strong>&nbsp;PASSWORD?</strong></h1></td>
                                 </tr>
                                 <tr style="border-collapse:collapse">
                                  <td align="center" style="padding:0;Margin:0;padding-bottom:15px;padding-left:40px;padding-right:40px"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#666666;font-size:16px">HI,${user.username}</p></td>
                                 </tr>
                                 <tr style="border-collapse:collapse">
                                  <td align="center" style="padding:0;Margin:0;padding-bottom:10px;padding-right:35px;padding-left:40px"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#666666;font-size:16px">There was a request to change your password!</p></td>
                                 </tr>
                                 <tr style="border-collapse:collapse">
                                  <td align="center" style="padding:0;Margin:0;padding-top:25px;padding-left:40px;padding-right:40px"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#666666;font-size:16px">Please enter the security code below to reset your password. This code is confidential, so please do not share it with anyone else. We value your security.</p><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#666666;font-size:16px">To reset your password, use the following code</p></td>
                                 </tr>
                                 <tr style="border-collapse:collapse">
                                  <td align="center" style="padding:0;Margin:0;padding-left:10px;padding-right:10px;padding-top:40px"><!--[if mso]><a href="https://viewstripo.email/" target="_blank" hidden>
                <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" esdevVmlButton href="https://viewstripo.email/" 
                            style="height:46px; v-text-anchor:middle; width:129px" arcsize="22%" strokecolor="#3d5ca3" strokeweight="1px" fillcolor="#ffffff">
                    <w:anchorlock></w:anchorlock>
                    <center style='color:#3d5ca3; font-family:arial, "helvetica neue", helvetica, sans-serif; font-size:14px; font-weight:700; line-height:14px;  mso-text-raise:1px'>OTP : ${generatedOTP}</center>
                </v:roundrect></a>
            <![endif]--><!--[if !mso]><!-- --><span class="msohide es-button-border" style="border-style:solid;border-color:#3D5CA3;background:#FFFFFF;border-width:2px;display:inline-block;border-radius:10px;width:auto;mso-hide:all"><a href="https://viewstripo.email/" class="es-button" target="_blank" style="mso-style-priority:100 !important;text-decoration:none;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;color:#3D5CA3;font-size:14px;display:inline-block;background:#FFFFFF;border-radius:10px;font-family:arial, 'helvetica neue', helvetica, sans-serif;font-weight:bold;font-style:normal;line-height:17px;width:auto;text-align:center;padding:15px 20px 15px 20px;mso-padding-alt:0;mso-border-alt:10px solid #FFFFFF">OTP: ${generatedOTP}</a></span><!--<![endif]--></td>
                                 </tr>
                               </table></td>
                             </tr>
                           </table></td>
                         </tr>
                         <tr style="border-collapse:collapse">
                          <td align="left" style="padding:0;Margin:0;padding-left:10px;padding-right:10px"><!--[if mso]><table style="width:580px" cellpadding="0" cellspacing="0"><tr><td style="width:199px" valign="top"><![endif]-->
                           <table class="es-left" cellspacing="0" cellpadding="0" align="left" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left">
                             <tr style="border-collapse:collapse">
                              <td align="left" style="padding:0;Margin:0;width:199px">
                               <table style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-position:center center" width="100%" cellspacing="0" cellpadding="0" role="presentation">
                                 <tr style="border-collapse:collapse">
                                  <td align="left" style="padding:0;Margin:0"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#666666;font-size:16px"><br></p></td>
                                 </tr>
                               </table></td>
                             </tr>
                           </table><!--[if mso]></td><td style="width:20px"></td><td style="width:361px" valign="top"><![endif]-->
                           <table class="es-right" cellspacing="0" cellpadding="0" align="right" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right">
                             <tr style="border-collapse:collapse">
                              <td align="left" style="padding:0;Margin:0;width:361px">
                               <table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                 <tr style="border-collapse:collapse">
                                  <td align="left" style="padding:0;Margin:0"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#666666;font-size:16px"><br></p></td>
                                 </tr>
                               </table></td>
                             </tr>
                           </table><!--[if mso]></td></tr></table><![endif]--></td>
                         </tr>
                         <tr style="border-collapse:collapse">
                          <td align="left" style="padding:0;Margin:0;padding-left:20px;padding-right:20px">
                           <table width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                             <tr style="border-collapse:collapse">
                              <td valign="top" align="center" style="padding:0;Margin:0;width:560px">
                               <table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                 <tr style="border-collapse:collapse">
                                  <td align="left" style="padding:0;Margin:0"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#666666;font-size:16px"><br></p></td>
                                 </tr>
                               </table></td>
                             </tr>
                           </table></td>
                         </tr>
                       </table></td>
                     </tr>
                   </table>
                   <table class="es-footer" cellspacing="0" cellpadding="0" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%;background-color:transparent;background-repeat:repeat;background-position:center top">
                     <tr style="border-collapse:collapse">
                      <td style="padding:0;Margin:0;background-color:#fafafa" bgcolor="#fafafa" align="center">
                       <table class="es-footer-body" cellspacing="0" cellpadding="0" bgcolor="#ffffff" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:transparent;width:600px">
                         <tr style="border-collapse:collapse">
                          <td style="padding:0;Margin:0;padding-left:20px;padding-right:20px;background-color:#0b5394" bgcolor="#0b5394" align="left">
                           <table width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                             <tr style="border-collapse:collapse">
                              <td valign="top" align="center" style="padding:0;Margin:0;width:560px">
                               <table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                 <tr style="border-collapse:collapse">
                                  <td align="left" style="padding:0;Margin:0;padding-top:5px;padding-bottom:5px"><h2 style="Margin:0;line-height:17px;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;font-size:14px;font-style:normal;font-weight:normal;color:#333333"><br></h2></td>
                                 </tr>
                                 <tr style="border-collapse:collapse">
                                  <td align="left" style="padding:0;Margin:0;padding-bottom:5px"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:21px;color:#333333;font-size:14px"><br></p></td>
                                 </tr>
                               </table></td>
                             </tr>
                           </table></td>
                         </tr>
                       </table></td>
                     </tr>
                   </table>
                   <table class="es-content" cellspacing="0" cellpadding="0" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%">
                     <tr style="border-collapse:collapse">
                      <td style="padding:0;Margin:0;background-color:#fafafa" bgcolor="#fafafa" align="center">
                       <table class="es-content-body" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:transparent;width:600px" cellspacing="0" cellpadding="0" bgcolor="transparent" align="center">
                         <tr style="border-collapse:collapse">
                          <td align="left" style="padding:0;Margin:0;padding-top:15px">
                           <table width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                             <tr style="border-collapse:collapse">
                              <td valign="top" align="center" style="padding:0;Margin:0;width:600px">
                               <table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                 <tr style="border-collapse:collapse">
                                  <td align="center" style="padding:0;Margin:0;font-size:0">
                                   <table width="100%" height="100%" cellspacing="0" cellpadding="0" border="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;width:100% !important;display:inline-table" role="presentation">
                                     <tr style="border-collapse:collapse">
                                      <td style="padding:0;Margin:0;border-bottom:1px solid #fafafa;background:none;height:1px;width:100%;margin:0px"></td>
                                     </tr>
                                   </table></td>
                                 </tr>
                               </table></td>
                             </tr>
                           </table></td>
                         </tr>
                       </table></td>
                     </tr>
                   </table>
                   <table class="es-content" cellspacing="0" cellpadding="0" align="center" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%">
                     <tr style="border-collapse:collapse">
                      <td align="center" style="padding:0;Margin:0">
                       <table class="es-content-body" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:transparent;width:600px" cellspacing="0" cellpadding="0" bgcolor="#ffffff" align="center">
                         <tr style="border-collapse:collapse">
                          <td align="left" style="padding:0;Margin:0">
                           <table width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                             <tr style="border-collapse:collapse">
                              <td valign="top" align="center" style="padding:0;Margin:0;width:600px">
                               <table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                 <tr style="border-collapse:collapse">
                                  <td align="left" style="padding:0;Margin:0"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:24px;color:#666666;font-size:16px"><br></p></td>
                                 </tr>
                               </table></td>
                             </tr>
                           </table></td>
                         </tr>
                       </table></td>
                     </tr>
                   </table></td>
                 </tr>
               </table>
              </div>
             </body>
            </html>`, // You can use html templates if you want to customize the design of email
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return res.status(400).json({ message: error.message });
            }
            return res.status(200).json({ StatusCode: 6000, message: `OTP sent to ${email}` });
        });
    } catch (error) {
        res.status(400).json({ message: error.message, StatusCode: 6001 });
    }
};

const verifyOtp = async (req, res) => {
    try {
        const { otp, email } = req.body;

        if (!otp) {
            return res.status(400).json({ message: "OTP is required", StatusCode: 6001 });
        }

        const user = await User.findOne({ email: email });

        // Compare the user-entered OTP with the stored OTP in the session

        // consola.error(otp, "user enetered otp-----------------");
        // consola.error(user.otp, "stored otp++++++++++++++++++++");

        if (otp !== user.otp.otp) {
            return res.status(400).json({ message: "Invalid OTP", StatusCode: 6001 });
        }

        // req.session.otpVerified = true;

        res.status(200).json({ StatusCode: 6000, message: "OTP Verified" });
        user.otp = {
            otp: "",
            otp_verified: true,
        };
        await user.save();
        // req.session.generatedOTP = null;
    } catch (error) {
        res.status(500).json({ message: error.message, StatusCode: 6001 });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "Email & Password is required" });
        }

        const passwordHash = await generatePasswordHash(password);
        const user = await User.findOne({ email: email });

        const otpVerified = user.otp.otp_verified;
        if (otpVerified) {
            user.password = passwordHash;
            user.otp = {
                otp: "",
                otp_verified: false,
            };
            await user.save();
            return res
                .status(200)
                .json({ StatusCode: 6000, message: "Password changed successfully!" });
        } else {
            return res.status(400).json({ message: "otp unverified" });
        }
    } catch (error) {
        return res.status(500).json({ message: error.message, StatusCode: 6001 });
    }
};

const refreshToken = async (req, res) => {
    try {
        //verify current refresh token sent from frontend
        const userId = verifyRefreshToken(req.cookies.refreshToken);

        consola.log(req.cookies.refreshToken, "cookies*************");
        consola.log(userId, "refresh token+++++++++++++");
        // const userId = verifyRefreshToken(req.body.refresh_token);

        if (!userId)
            return res.status(401).json({ StatusCode: 6001, message: "Refresh token expired" });

        const accessToken = generateAccessToken(userId);
        const refreshToken = generateRefreshToken(userId);

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
        });

        res.json({ access_token: accessToken });
    } catch (error) {
        return res.status(500).json({ message: error.message, StatusCode: 6001 });
    }
};
module.exports = {
    signup,
    login,
    getAllUsers,
    forgetPassword,
    verifyOtp,
    resetPassword,
    refreshToken,
};
